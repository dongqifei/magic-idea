import JavaClass from "../editor/java-class";
import { Span, TokenType } from "./index";

class Node {
  span: Span;
  constructor(span: Span) {
    this.span = span;
  }

  getSpan() {
    return this.span;
  }

  async getJavaType(env: any) {
    await this.getExpressionsJavaType(env);
    return "java.lang.Object";
  }

  async getExpressionsJavaType(env: any) {
    for (const expr of this.expressions().filter((it) => it)) {
      await expr.getJavaType(env);
    }
  }

  expressions() {
    return [];
  }

  toString() {
    return this.span.getText();
  }
}

class Expression extends Node {
  javaType?: string;
  expressionList?: Expression[];
  constructor(span: Span) {
    super(span);
  }
}

class Literal extends Expression {
  constructor(span: Span, javaType: string, expressionList: Expression[] = []) {
    super(span);
    this.javaType = javaType;
    this.expressionList = expressionList;
  }

  expressions() {
    return this.expressionList || [];
  }

  async getJavaType() {
    return this.javaType || "java.lang.Object";
  }

  getValue() {
    return this.getSpan()
      .getText()
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }
}

class MethodCall extends Node {
  target: MemberAccess;
  args: Expression[];

  constructor(span: Span, target: MemberAccess, args: Expression[]) {
    super(span);
    this.target = target;
    this.args = args;
  }

  expressions() {
    return [this.target, ...this.args];
  }

  getMethod() {
    return this.target;
  }

  getArguments() {
    return this.args;
  }

  async getJavaType(env: any) {
    const methodName = this.target.member.getText();
    const targetType = await this.target.getJavaType(env);
    for (const arg of this.args) {
      await arg.getJavaType(env);
    }
    const methods = JavaClass.findMethods(targetType);

    if (methods) {
      for (const method of methods) {
        if (
          method.name === methodName &&
          await JavaClass.matchTypes(method.parameters, this.args, method.extension, env)
        ) {
          return method.origin
            ? targetType
            : JavaClass.getWrapperClass(method.returnType);
        }
      }
    }
    return "java.lang.Object";
  }
}

class FunctionCall extends Node {
  target: VariableAccess | Expression;
  args: Expression[];

  constructor(
    span: Span,
    target: VariableAccess | Expression,
    args: Expression[]
  ) {
    super(span);
    this.target = target;
    this.args = args;
  }

  expressions() {
    return [this.target, ...this.args];
  }

  getFunction() {
    return this.target;
  }

  getArguments() {
    return this.args;
  }

  async getJavaType(env: any) {
    if (this.target instanceof VariableAccess) {
      const method = JavaClass.findFunction().find(
        (m) => m.name === this.target.variable
      );
      if (method) return method.returnType;

      // 处理通过 import "@/xxx" as xxx 导入的 magic-api 函数资源
      const varValue = env?.[this.target.variable];
      if (varValue && typeof varValue === "string" && varValue.startsWith("@")) {
        const func = JavaClass.getOnlineFunction(varValue.substring(1));
        if (func?.returnType) {
          return JavaClass.getWrapperClass(func.returnType);
        }
        // 无法确定返回类型时，返回 Object 而非资源路径，避免被当作 Java 类名
        return "java.lang.Object";
      }
    }
    return await this.target.getJavaType(env);
  }
}

class MemberAccess extends Node {
  target: Expression;
  optional: boolean;
  member: any;
  whole: boolean;

  constructor(
    span: Span,
    target: Expression,
    optional: boolean,
    member: any,
    whole: boolean = false
  ) {
    super(span);
    this.target = target;
    this.optional = optional;
    this.member = member;
    this.whole = whole;
  }

  isWhole() {
    return this.whole === true;
  }

  expressions() {
    return [this.target];
  }

  getTarget() {
    return this.target;
  }

  async getJavaType(env: any) {
    const javaType = await this.target.getJavaType(env);

    // 过滤非 Java 类名（如 magic-api 资源路径 "@/xxx"、模块名等），避免请求后台
    if (!javaType || typeof javaType !== "string" || javaType.startsWith("@")) {
      return "java.lang.Object";
    }

    const clazz = await JavaClass.loadClass(javaType);

    // Check attributes
    if (clazz?.attributes) {
      const attribute = clazz.attributes.find(
        (it: any) => it.name === this.member.getText()
      );
      if (attribute) return JavaClass.getWrapperClass(attribute.type);
    }

    // Check enums
    if (clazz?.enums) {
      const enumItem = clazz.enums.find(
        (it: any) => it.name === this.member.getText()
      );
      if (enumItem) return JavaClass.getWrapperClass(enumItem.type);
    }

    // Check HashMap get method
    if (clazz?.methods) {
      for (const method of clazz.methods) {
        if (
          clazz.superClass === "java.util.HashMap" &&
          method.name === "get" &&
          method.parameters.length === 1
        ) {
          return JavaClass.getWrapperClass(method.returnType);
        }
      }
    }

    return javaType || "java.lang.Object";
  }
}

class VariableAccess extends Node {
  variable: string;

  constructor(span: Span, variable: string) {
    super(span);
    this.variable = variable;
  }

  getVariable() {
    return this.variable;
  }

  async getJavaType(env: any) {
    let value = env && env[this.variable];
    if (!value) {
      const imports = env["@import"] || [];
      for (let i = imports.length - 1; i >= 0 && !value; i--) {
        value = JavaClass.findClass(imports[i] + this.variable);
      }
    }
    return value || "java.lang.Object";
  }
}

class MapOrArrayAccess extends Node {
  target: Expression;
  keyOrIndex: Expression;

  constructor(span: Span, target: Expression, keyOrIndex: Expression) {
    super(span);
    this.target = target;
    this.keyOrIndex = keyOrIndex;
  }

  async getJavaType(env: any) {
    const javaType = await this.target.getJavaType(env);
    return javaType === "db" ? "db" : super.getJavaType(env);
  }

  expressions() {
    return [this.target, this.keyOrIndex];
  }
}

class IfStatement extends Node {
  condition: Expression;
  trueBlock: Node[];
  elseIfs: Node[];
  falseBlock: Node[];

  constructor(
    span: Span,
    condition: Expression,
    trueBlock: Node[] = [],
    elseIfs: Node[] = [],
    falseBlock: Node[] = []
  ) {
    super(span);
    this.condition = condition;
    this.trueBlock = trueBlock;
    this.elseIfs = elseIfs;
    this.falseBlock = falseBlock;
  }

  expressions() {
    return [
      this.condition,
      ...this.trueBlock,
      ...this.elseIfs,
      ...this.falseBlock,
    ];
  }
}

class WholeLiteral extends Literal {
  constructor(span: Span) {
    super(span, "java.lang.Object", []);
  }
}

class LambdaFunction extends Node {
  parameters: string[];
  childNodes: Node[];

  constructor(span: Span, parameters: string[], childNodes: Node[]) {
    super(span);
    this.parameters = parameters;
    this.childNodes = childNodes;
  }

  expressions() {
    return [...this.childNodes];
  }

  async getJavaType(env: any) {
    // 处理参数，添加到局部作用域
    for (const param of this.parameters) {
      env[param] = "java.lang.Object"; // 参数默认类型
    }

    // 处理函数体内的所有语句
    let returnType = "java.lang.Object"; // 默认返回类型
    
    for (const node of this.childNodes) {
      // 处理变量声明，会添加到 env
      if (node instanceof VarDefine) {
        await node.getJavaType(env);
      }
      
      // 如果是 return 语句，获取其类型
      if (node instanceof Return) {
        returnType = await node.getJavaType(env);
      }
      
      // 其他语句也需要处理，以便收集可能的变量声明
      await node.getJavaType(env);
    }

    // 如果没有明确的 return 语句，尝试推断最后一个表达式的类型
    if (returnType === "java.lang.Object" && this.childNodes.length > 0) {
      const lastNode = this.childNodes[this.childNodes.length - 1];
      if (!(lastNode instanceof Return)) {
        returnType = await lastNode.getJavaType(env);
      }
    }

    return returnType;
  }
}

class Return extends Node {
  returnValue?: Expression;

  constructor(span: Span, returnValue?: Expression) {
    super(span);
    this.returnValue = returnValue;
  }

  expressions() {
    return this.returnValue ? [this.returnValue] : [];
  }

  async getJavaType(env: any) {
    return this.returnValue == null
      ? ""
      : await this.returnValue.getJavaType(env);
  }
}

class Continue extends Node {
  constructor(span: Span) {
    super(span);
  }
}

class Break extends Node {
  constructor(span: Span) {
    super(span);
  }
}

class Exit extends Node {
  values: Expression[];

  constructor(span: Span, values: Expression[]) {
    super(span);
    this.values = values;
  }

  expressions() {
    return this.values;
  }
}

class Throw extends Node {
  value: Expression;

  constructor(span: Span, value: Expression) {
    super(span);
    this.value = value;
  }

  expressions() {
    return [this.value];
  }
}

class Assert extends Node {
  condition: Expression;
  values: Expression[];

  constructor(span: Span, condition: Expression, values: Expression[]) {
    super(span);
    this.condition = condition;
    this.values = values;
  }

  expressions() {
    return [this.condition, ...this.values];
  }
}

class NewStatement extends Node {
  identifier: string;
  parameters: Expression[];

  constructor(span: Span, identifier: string, parameters: Expression[]) {
    super(span);
    this.identifier = identifier;
    this.parameters = parameters;
  }

  expressions() {
    return [...this.parameters];
  }

  async getJavaType(env: any) {
    let value = env[this.identifier];
    if (!value) {
      const imports = env["@import"] || [];
      for (let i = imports.length - 1; i >= 0 && !value; i--) {
        value = JavaClass.findClass(imports[i] + this.identifier);
      }
    }
    return value || "java.lang.Object";
  }
}

class AsyncCall extends Node {
  expression: Expression;

  constructor(span: Span, expression: Expression) {
    super(span);
    this.expression = expression;
  }

  expressions() {
    return [this.expression];
  }

  async getJavaType(env: any) {
    return "java.util.concurrent.Future";
  }
}

class UnaryOperation extends Node {
  operator: any;
  operand: Expression;
  atAfter: boolean;

  constructor(operator: any, operand: Expression, atAfter: boolean) {
    super(new Span(operator.getSpan(), operand.getSpan()));
    this.operator = operator;
    this.operand = operand;
    this.atAfter = atAfter;
  }

  async getJavaType(env: any) {
    return await this.operand.getJavaType(env);
  }

  expressions() {
    return [this.operand];
  }
}

class TryStatement extends Node {
  exceptionVarNode: any;
  tryBlock: Node[];
  tryResources: Node[];
  catchBlock: Node[];
  finallyBlock: Node[];

  constructor(
    span: Span,
    exceptionVarNode: any,
    tryBlock: Node[],
    tryResources: Node[],
    catchBlock: Node[],
    finallyBlock: Node[]
  ) {
    super(span);
    this.exceptionVarNode = exceptionVarNode;
    this.tryBlock = tryBlock;
    this.tryResources = tryResources;
    this.catchBlock = catchBlock;
    this.finallyBlock = finallyBlock;
  }

  expressions() {
    return [
      ...this.tryBlock,
      ...this.tryResources,
      ...this.catchBlock,
      ...this.finallyBlock,
    ];
  }
}

class ForStatement extends Node {
  indexOrKey: any;
  value: any;
  mapOrArray: Expression;
  body: Node[];

  constructor(
    span: Span,
    indexOrKey: any,
    value: any,
    mapOrArray: Expression,
    body: Node[]
  ) {
    super(span);
    this.indexOrKey = indexOrKey;
    this.value = value;
    this.mapOrArray = mapOrArray;
    this.body = body;
  }

  expressions() {
    return [this.mapOrArray, ...this.body];
  }
}

class WhileStatement extends Node {
  condition: Expression;
  trueBlock: Node[];

  constructor(span: Span, condition: Expression, trueBlock: Node[]) {
    super(span);
    this.condition = condition;
    this.trueBlock = trueBlock;
  }

  expressions() {
    return [this.condition, ...this.trueBlock];
  }
}

class Import extends Node {
  packageName: string;
  varName?: string;
  module?: boolean;

  constructor(
    span: Span,
    packageName: string,
    varName?: string,
    module?: boolean
  ) {
    super(span);
    this.packageName = packageName;
    this.varName = varName;
    this.module = module;
  }

  async getJavaType(env: any) {
    if (this.packageName.endsWith(".*")) {
      env["@import"].push(
        this.packageName.substring(0, this.packageName.length - 1)
      );
    } else if (this.module) {
      env[this.packageName] = this.packageName;
    } else if (this.varName) {
      env[this.varName] = this.packageName;
    } else {
      const index = this.packageName.lastIndexOf(".");
      if (index > -1) {
        env[this.packageName.substring(index + 1)] = this.packageName;
      }
    }
  }
}

class VarDefine extends Node {
  varName: string;
  expression?: Expression;
  defineType?: string;

  constructor(
    span: Span,
    varName: string,
    expression?: Expression,
    defineType?: string
  ) {
    super(span);
    this.varName = varName;
    this.expression = expression;
    this.defineType = defineType;
    // 过滤掉var/const/let等关键字作为类型
    // this.defineType = ["var", "const", "let"].includes(defineType || "")
    //   ? undefined
    //   : defineType;
  }

  getVarName() {
    return this.varName;
  }

  expressions() {
    return this.expression ? [this.expression] : [];
  }

  async getJavaType(env: any) {
    let type = "java.lang.Object";
    //  var/const/let等类型不进行类型推导
    if (this.defineType && !["var", "const", "let"].includes(this.defineType || "")) {
      type = env[this.defineType] || type;
    } else if (this.expression) {
        type = await this.expression.getJavaType(env);
    }
    // console.log("varName", this.defineType, this.varName, type, env);
    if(env[this.varName] === undefined) {
      env[this.varName] = type;
    }
    return type;
  }
}

class DestructuringVarDefine extends VarDefine {
  tokens: any[];
  isMapAccess: boolean;

  constructor(
    span: Span,
    tokens: any[],
    expression?: Expression,
    defineType?: string,
    isMapAccess: boolean = true
  ) {
    super(span, "", expression, defineType);
    this.tokens = tokens;
    // this.defineType = ["var", "const", "let"].includes(defineType || "")
    //   ? undefined
    //   : defineType;
    this.isMapAccess = isMapAccess;
  }

  // 获取解构的所有标识符
  getIdentifiers(): any[] {
    return this.tokens;
  }

  // 判断是否是对象解构（大括号形式）
  isObjectDestructuring(): boolean {
    return this.isMapAccess;
  }

  expressions() {
    return this.expression ? [this.expression] : [];
  }

  // 在 MapAccessVarDefine 类中修正 getJavaType 方法
  async getJavaType(env: any) {
    let type = "java.lang.Object";

    // 如果有定义类型（var/let/const），使用环境中的类型
    if (this.defineType && !["var", "const", "let"].includes(this.defineType || "")) {
      type = env[this.defineType] || type;
    } else if (!this.isMapAccess) {
      return type;
    }

    // 处理每个token，创建成员访问并获取类型
    for (const token of this.tokens) {
      if (this.expression) {
        const memberAccess = new MemberAccess(
          token.getSpan(), // span
          this.expression, // target
          false, // optional
          token, // member
          false // isWhole
        );
        env[token.getText()] = await memberAccess.getJavaType(env);
      } else {
        // 如果没有表达式，设置为默认类型
        env[token.getText()] = "java.lang.Object";
      }
    }

    return type;
  }
}

class TernaryOperation extends Node {
  condition: Expression;
  trueExpression: Expression;
  falseExpression: Expression;

  constructor(
    condition: Expression,
    trueExpression: Expression,
    falseExpression: Expression
  ) {
    super(new Span(condition.getSpan(), falseExpression.getSpan()));
    this.condition = condition;
    this.trueExpression = trueExpression;
    this.falseExpression = falseExpression;
  }

  expressions() {
    return [this.condition, this.trueExpression, this.falseExpression];
  }
}

class Spread extends Node {
  target: Expression;

  constructor(span: Span, target: Expression) {
    super(span);
    this.target = target;
  }

  expressions() {
    return [this.target];
  }
}

class MapLiteral extends Literal {
  keys: Expression[];
  values: Expression[];

  constructor(span: Span, keys: Expression[], values: Expression[]) {
    super(span, "java.util.LinkedHashMap", []);
    this.keys = keys;
    this.values = values;
  }

  expressions() {
    return this.values;
  }
}

class ListLiteral extends Literal {
  values: Expression[];

  constructor(span: Span, values: Expression[]) {
    super(span, "java.util.ArrayList", []);
    this.values = values;
  }

  expressions() {
    return this.values;
  }
}

class LanguageExpression extends Node {
  constructor(span: Span) {
    super(span);
  }

  async getJavaType() {
    return "java.util.function.Function";
  }

  expressions() {
    return [];
  }
}

class BinaryOperation extends Node {
  left: Expression;
  right: Expression;
  operator: any;
  linqLevel: number;

  constructor(
    left: Expression,
    operator: any,
    right: Expression,
    linqLevel: number
  ) {
    super(new Span(left.getSpan(), right.getSpan()));
    this.left = left;
    this.right = right;
    this.operator = operator;
    this.linqLevel = linqLevel;
  }

  getOperator() {
    return this.operator;
  }

  setRightOperand(right: Expression) {
    this.right = right;
  }

  getRightOperand() {
    return this.right;
  }

  expressions() {
    return [this.left, this.right];
  }

  async getJavaType(env: any) {
    let lType = await this.left.getJavaType(env);
    let rType = await this.right.getJavaType(env);

    lType = lType.toLowerCase().substring(lType.lastIndexOf(".") + 1);
    rType = rType.toLowerCase().substring(rType.lastIndexOf(".") + 1);

    if (
      (this.operator.type === TokenType.Plus ||
        this.operator.type === TokenType.PlusEqual) &&
      (lType === "string" || rType === "string")
    ) {
      return "java.lang.String";
    }

    if (
      this.operator.type === TokenType.Equal ||
      (this.operator.type === TokenType.Assignment && this.linqLevel > 0)
    ) {
      return "java.lang.Boolean";
    }

    if (lType === "bigdecimal" || rType === "bigdecimal") {
      return "java.math.BigDecimal";
    }

    if (lType === "double" || rType === "double") {
      return "java.lang.Double";
    }

    if (lType === "float" || rType === "float") {
      return "java.lang.Float";
    }

    if (lType === "long" || rType === "long") {
      return "java.lang.Long";
    }

    if (lType === "integer" || rType === "integer") {
      return "java.lang.Integer";
    }

    if (lType === "short" || rType === "short") {
      return "java.lang.Short";
    }

    if (lType === "byte" || rType === "byte") {
      return "java.lang.Byte";
    }

    return "java.lang.Object";
  }
}

class LinqField extends Expression {
  expression: Expression;
  alias?: string;

  constructor(span: Span, expression: Expression, alias?: string) {
    super(span);
    this.expression = expression;
    this.alias = alias;
  }

  expressions() {
    return [this.expression];
  }
}

class LinqJoin extends Expression {
  leftJoin: boolean;
  target: Expression;
  condition: Expression;

  constructor(
    span: Span,
    leftJoin: boolean,
    target: Expression,
    condition: Expression
  ) {
    super(span);
    this.leftJoin = leftJoin;
    this.target = target;
    this.condition = condition;
  }

  expressions() {
    return [this.target, this.condition];
  }
}

class LinqOrder extends Expression {
  expression: Expression;
  alias?: string;
  order: string;

  constructor(
    span: Span,
    expression: Expression,
    alias?: string,
    order: string
  ) {
    super(span);
    this.expression = expression;
    this.alias = alias;
    this.order = order;
  }

  expressions() {
    return [this.expression];
  }
}

class ClassConverter extends Expression {
  convert: string;
  target: Expression;
  args: Expression[];

  constructor(
    span: Span,
    convert: string,
    target: Expression,
    args: Expression[]
  ) {
    super(span);
    this.convert = convert;
    this.target = target;
    this.args = args;
  }

  expressions() {
    return [this.target, ...this.args];
  }

  async getJavaType() {
    switch (this.convert) {
      case "double":
        return "java.lang.Double";
      case "float":
        return "java.lang.Float";
      case "long":
        return "java.lang.Long";
      case "int":
        return "java.lang.Integer";
      case "short":
        return "java.lang.Short";
      case "byte":
        return "java.lang.Byte";
      case "date":
        return "java.util.Date";
      default:
        return "java.lang.Object";
    }
  }
}

class LinqSelect extends Expression {
  fields: LinqField[];
  from: any;
  joins: LinqJoin[];
  where?: Expression;
  groups: any[];
  having?: Expression;
  orders: LinqOrder[];
  limit?: Expression;
  offset?: Expression;

  constructor(
    span: Span,
    fields: LinqField[],
    from: any,
    joins: LinqJoin[],
    where?: Expression,
    groups: any[] = [],
    having?: Expression,
    orders: LinqOrder[] = [],
    limit?: Expression,
    offset?: Expression
  ) {
    super(span);
    this.fields = fields;
    this.from = from;
    this.joins = joins;
    this.where = where;
    this.groups = groups;
    this.having = having;
    this.orders = orders;
    this.limit = limit;
    this.offset = offset;
  }

  expressions() {
    const temp: Expression[] = [];
    if (this.where) temp.push(this.where);
    if (this.having) temp.push(this.having);

    return [
      ...this.fields,
      this.from,
      ...this.joins,
      ...this.groups,
      ...temp,
      ...this.orders,
      ...(this.limit ? [this.limit] : []),
      ...(this.offset ? [this.offset] : []),
    ];
  }

  async getJavaType() {
    return "java.util.List";
  }
}

export {
  Node,
  Expression,
  Literal,
  Assert,
  MethodCall,
  FunctionCall,
  MemberAccess,
  VariableAccess,
  MapOrArrayAccess,
  IfStatement,
  LambdaFunction,
  Return,
  Continue,
  Break,
  NewStatement,
  AsyncCall,
  UnaryOperation,
  TryStatement,
  ForStatement,
  WhileStatement,
  Import,
  VarDefine,
  DestructuringVarDefine, // 新增导出
  TernaryOperation,
  BinaryOperation,
  Spread,
  MapLiteral,
  ListLiteral,
  Exit,
  LinqField,
  LinqJoin,
  LinqOrder,
  LinqSelect,
  WholeLiteral,
  ClassConverter,
  LanguageExpression,
  Throw,
};
