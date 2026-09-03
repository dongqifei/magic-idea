import { Span } from "./index";
declare class Node {
    span: Span;
    constructor(span: Span);
    getSpan(): Span;
    getJavaType(env: any): Promise<string>;
    getExpressionsJavaType(env: any): Promise<void>;
    expressions(): any[];
    toString(): string;
}
declare class Expression extends Node {
    javaType?: string;
    expressionList?: Expression[];
    constructor(span: Span);
}
declare class Literal extends Expression {
    constructor(span: Span, javaType: string, expressionList?: Expression[]);
    expressions(): Expression[];
    getJavaType(): Promise<string>;
    getValue(): string;
}
declare class MethodCall extends Node {
    target: MemberAccess;
    args: Expression[];
    constructor(span: Span, target: MemberAccess, args: Expression[]);
    expressions(): (Expression | MemberAccess)[];
    getMethod(): MemberAccess;
    getArguments(): Expression[];
    getJavaType(env: any): Promise<any>;
}
declare class FunctionCall extends Node {
    target: VariableAccess | Expression;
    args: Expression[];
    constructor(span: Span, target: VariableAccess | Expression, args: Expression[]);
    expressions(): (Expression | VariableAccess)[];
    getFunction(): Expression | VariableAccess;
    getArguments(): Expression[];
    getJavaType(env: any): Promise<any>;
}
declare class MemberAccess extends Node {
    target: Expression;
    optional: boolean;
    member: any;
    whole: boolean;
    constructor(span: Span, target: Expression, optional: boolean, member: any, whole?: boolean);
    isWhole(): boolean;
    expressions(): Expression[];
    getTarget(): Expression;
    getJavaType(env: any): Promise<any>;
}
declare class VariableAccess extends Node {
    variable: string;
    constructor(span: Span, variable: string);
    getVariable(): string;
    getJavaType(env: any): Promise<any>;
}
declare class MapOrArrayAccess extends Node {
    target: Expression;
    keyOrIndex: Expression;
    constructor(span: Span, target: Expression, keyOrIndex: Expression);
    getJavaType(env: any): Promise<string>;
    expressions(): Expression[];
}
declare class IfStatement extends Node {
    condition: Expression;
    trueBlock: Node[];
    elseIfs: Node[];
    falseBlock: Node[];
    constructor(span: Span, condition: Expression, trueBlock?: Node[], elseIfs?: Node[], falseBlock?: Node[]);
    expressions(): Node[];
}
declare class WholeLiteral extends Literal {
    constructor(span: Span);
}
declare class LambdaFunction extends Node {
    parameters: string[];
    childNodes: Node[];
    constructor(span: Span, parameters: string[], childNodes: Node[]);
    expressions(): Node[];
    getJavaType(env: any): Promise<string>;
}
declare class Return extends Node {
    returnValue?: Expression;
    constructor(span: Span, returnValue?: Expression);
    expressions(): Expression[];
    getJavaType(env: any): Promise<string>;
}
declare class Continue extends Node {
    constructor(span: Span);
}
declare class Break extends Node {
    constructor(span: Span);
}
declare class Exit extends Node {
    values: Expression[];
    constructor(span: Span, values: Expression[]);
    expressions(): Expression[];
}
declare class Throw extends Node {
    value: Expression;
    constructor(span: Span, value: Expression);
    expressions(): Expression[];
}
declare class Assert extends Node {
    condition: Expression;
    values: Expression[];
    constructor(span: Span, condition: Expression, values: Expression[]);
    expressions(): Expression[];
}
declare class NewStatement extends Node {
    identifier: string;
    parameters: Expression[];
    constructor(span: Span, identifier: string, parameters: Expression[]);
    expressions(): Expression[];
    getJavaType(env: any): Promise<any>;
}
declare class AsyncCall extends Node {
    expression: Expression;
    constructor(span: Span, expression: Expression);
    expressions(): Expression[];
    getJavaType(env: any): Promise<string>;
}
declare class UnaryOperation extends Node {
    operator: any;
    operand: Expression;
    atAfter: boolean;
    constructor(operator: any, operand: Expression, atAfter: boolean);
    getJavaType(env: any): Promise<string>;
    expressions(): Expression[];
}
declare class TryStatement extends Node {
    exceptionVarNode: any;
    tryBlock: Node[];
    tryResources: Node[];
    catchBlock: Node[];
    finallyBlock: Node[];
    constructor(span: Span, exceptionVarNode: any, tryBlock: Node[], tryResources: Node[], catchBlock: Node[], finallyBlock: Node[]);
    expressions(): Node[];
}
declare class ForStatement extends Node {
    indexOrKey: any;
    value: any;
    mapOrArray: Expression;
    body: Node[];
    constructor(span: Span, indexOrKey: any, value: any, mapOrArray: Expression, body: Node[]);
    expressions(): Node[];
}
declare class WhileStatement extends Node {
    condition: Expression;
    trueBlock: Node[];
    constructor(span: Span, condition: Expression, trueBlock: Node[]);
    expressions(): Node[];
}
declare class Import extends Node {
    packageName: string;
    varName?: string;
    module?: boolean;
    constructor(span: Span, packageName: string, varName?: string, module?: boolean);
    getJavaType(env: any): Promise<void>;
}
declare class VarDefine extends Node {
    varName: string;
    expression?: Expression;
    defineType?: string;
    constructor(span: Span, varName: string, expression?: Expression, defineType?: string);
    getVarName(): string;
    expressions(): Expression[];
    getJavaType(env: any): Promise<string>;
}
declare class DestructuringVarDefine extends VarDefine {
    tokens: any[];
    isMapAccess: boolean;
    constructor(span: Span, tokens: any[], expression?: Expression, defineType?: string, isMapAccess?: boolean);
    getIdentifiers(): any[];
    isObjectDestructuring(): boolean;
    expressions(): Expression[];
    getJavaType(env: any): Promise<string>;
}
declare class TernaryOperation extends Node {
    condition: Expression;
    trueExpression: Expression;
    falseExpression: Expression;
    constructor(condition: Expression, trueExpression: Expression, falseExpression: Expression);
    expressions(): Expression[];
}
declare class Spread extends Node {
    target: Expression;
    constructor(span: Span, target: Expression);
    expressions(): Expression[];
}
declare class MapLiteral extends Literal {
    keys: Expression[];
    values: Expression[];
    constructor(span: Span, keys: Expression[], values: Expression[]);
    expressions(): Expression[];
}
declare class ListLiteral extends Literal {
    values: Expression[];
    constructor(span: Span, values: Expression[]);
    expressions(): Expression[];
}
declare class LanguageExpression extends Node {
    constructor(span: Span);
    getJavaType(): Promise<string>;
    expressions(): any[];
}
declare class BinaryOperation extends Node {
    left: Expression;
    right: Expression;
    operator: any;
    linqLevel: number;
    constructor(left: Expression, operator: any, right: Expression, linqLevel: number);
    getOperator(): any;
    setRightOperand(right: Expression): void;
    getRightOperand(): Expression;
    expressions(): Expression[];
    getJavaType(env: any): Promise<"java.lang.Integer" | "java.lang.String" | "java.lang.Double" | "java.lang.Float" | "java.lang.Byte" | "java.lang.Short" | "java.lang.Long" | "java.lang.Object" | "java.math.BigDecimal" | "java.lang.Boolean">;
}
declare class LinqField extends Expression {
    expression: Expression;
    alias?: string;
    constructor(span: Span, expression: Expression, alias?: string);
    expressions(): Expression[];
}
declare class LinqJoin extends Expression {
    leftJoin: boolean;
    target: Expression;
    condition: Expression;
    constructor(span: Span, leftJoin: boolean, target: Expression, condition: Expression);
    expressions(): Expression[];
}
declare class LinqOrder extends Expression {
    expression: Expression;
    alias?: string;
    order: string;
    constructor(span: Span, expression: Expression, alias?: string, order: string);
    expressions(): Expression[];
}
declare class ClassConverter extends Expression {
    convert: string;
    target: Expression;
    args: Expression[];
    constructor(span: Span, convert: string, target: Expression, args: Expression[]);
    expressions(): Expression[];
    getJavaType(): Promise<"java.lang.Integer" | "java.lang.Double" | "java.lang.Float" | "java.lang.Byte" | "java.lang.Short" | "java.lang.Long" | "java.lang.Object" | "java.util.Date">;
}
declare class LinqSelect extends Expression {
    fields: LinqField[];
    from: any;
    joins: LinqJoin[];
    where?: Expression;
    groups: any[];
    having?: Expression;
    orders: LinqOrder[];
    limit?: Expression;
    offset?: Expression;
    constructor(span: Span, fields: LinqField[], from: any, joins: LinqJoin[], where?: Expression, groups?: any[], having?: Expression, orders?: LinqOrder[], limit?: Expression, offset?: Expression);
    expressions(): any[];
    getJavaType(): Promise<string>;
}
export { Node, Expression, Literal, Assert, MethodCall, FunctionCall, MemberAccess, VariableAccess, MapOrArrayAccess, IfStatement, LambdaFunction, Return, Continue, Break, NewStatement, AsyncCall, UnaryOperation, TryStatement, ForStatement, WhileStatement, Import, VarDefine, DestructuringVarDefine, // 新增导出
TernaryOperation, BinaryOperation, Spread, MapLiteral, ListLiteral, Exit, LinqField, LinqJoin, LinqOrder, LinqSelect, WholeLiteral, ClassConverter, LanguageExpression, Throw, };
