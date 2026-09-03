import { ParseException, Span, TokenStream, TokenType } from './index'
import tokenizer from './tokenizer'
import JavaClass from '../editor/java-class'
import {
  Node,
  Assert,
  AsyncCall,
  BinaryOperation,
  Break,
  ClassConverter,
  Continue,
  Exit,
  ForStatement,
  FunctionCall,
  IfStatement,
  Import,
  LambdaFunction,
  LanguageExpression,
  LinqField,
  LinqJoin,
  LinqOrder,
  LinqSelect,
  ListLiteral,
  Literal,
  MapLiteral,
  MapOrArrayAccess,
  MemberAccess,
  MethodCall,
  NewStatement,
  Return,
  Spread,
  TernaryOperation,
  TryStatement,
  UnaryOperation,
  VarDefine,
  DestructuringVarDefine,
  VariableAccess,
  WhileStatement,
  WholeLiteral,
  Throw
} from './ast'
import RequestParameter from '../editor/request-parameter'
import { ErrorEnhancer, EnhancedError } from './errors'

export const keywords = [
  'import',
  'as',
  'var',
  'let',
  'const',
  'return',
  'break',
  'continue',
  'if',
  'for',
  'in',
  'new',
  'true',
  'false',
  'null',
  'else',
  'try',
  'catch',
  'finally',
  'async',
  'while',
  'exit',
  'and',
  'or',
  'instanceof',
  'throw' /*"assert"*/
]
export const linqKeywords = [
  'from',
  'join',
  'left',
  'group',
  'by',
  'as',
  'having',
  'and',
  'or',
  'in',
  'where',
  'on',
  'limit',
  'offset'
]
const binaryOperatorPrecedence = [
  [TokenType.Assignment],
  [
    TokenType.RShift2Equal,
    TokenType.RShiftEqual,
    TokenType.LShiftEqual,
    TokenType.XorEqual,
    TokenType.BitOrEqual,
    TokenType.BitAndEqual,
    TokenType.PercentEqual,
    TokenType.ForwardSlashEqual,
    TokenType.AsteriskEqual,
    TokenType.MinusEqual,
    TokenType.PlusEqual
  ],
  [TokenType.Or, TokenType.SqlOr],
  [TokenType.And, TokenType.SqlAnd],
  [TokenType.BitOr],
  [TokenType.Xor],
  [TokenType.BitAnd],
  [TokenType.EqualEqualEqual, TokenType.Equal, TokenType.NotEqualEqual, TokenType.NotEqual, TokenType.SqlNotEqual, TokenType.InstanceOf],
  [TokenType.Less, TokenType.LessEqual, TokenType.Greater, TokenType.GreaterEqual],
  [TokenType.Plus, TokenType.Minus],
  [TokenType.LShift, TokenType.RShift, TokenType.RShift2],
  [TokenType.Asterisk, TokenType.ForwardSlash, TokenType.Percentage]
]
const linqBinaryOperatorPrecedence = [
  [
    TokenType.RShift2Equal,
    TokenType.RShiftEqual,
    TokenType.LShiftEqual,
    TokenType.XorEqual,
    TokenType.BitOrEqual,
    TokenType.BitAndEqual,
    TokenType.PercentEqual,
    TokenType.ForwardSlashEqual,
    TokenType.AsteriskEqual,
    TokenType.MinusEqual,
    TokenType.PlusEqual
  ],
  [TokenType.Or, TokenType.SqlOr],
  [TokenType.And, TokenType.SqlAnd],
  [TokenType.BitOr],
  [TokenType.Xor],
  [TokenType.BitAnd],
  [
    TokenType.Assignment,
    TokenType.EqualEqualEqual,
    TokenType.Equal,
    TokenType.NotEqualEqual,
    TokenType.Equal,
    TokenType.NotEqual,
    TokenType.SqlNotEqual
  ],
  [TokenType.Less, TokenType.LessEqual, TokenType.Greater, TokenType.GreaterEqual],
  [TokenType.Plus, TokenType.Minus],
  [TokenType.LShift, TokenType.RShift, TokenType.RShift2],
  [TokenType.Asterisk, TokenType.ForwardSlash, TokenType.Percentage]
]
const unaryOperators = [
  TokenType.MinusMinus,
  TokenType.PlusPlus,
  TokenType.BitNot,
  TokenType.Minus,
  TokenType.Plus,
  TokenType.Not
]

export class Parser {
  private errors: EnhancedError[] = []; // 错误列表
  private stream: TokenStream;
  private linqLevel: number;
  
  constructor(stream: TokenStream) {
    this.stream = stream
    this.linqLevel = 0
  }

  // 获取所有错误
  getErrors(): EnhancedError[] {
    return this.errors;
  }

  // 获取用户友好的错误报告
  getErrorReport(): string {
    return ErrorEnhancer.generateErrorReport(this.errors);
  }

  // 收集错误（使用错误信息）
  private addError(message: string, span: Span, context?: any) {
    const enhancedError = ErrorEnhancer.enhanceError(message, span, context);
    this.errors.push(enhancedError);
  }

  parse(ignoreError: boolean): Node[] {
    let nodes: Node[] = []
    try {
      while (this.stream.hasMore()) {
        try {
          let node = this.parseStatement()
          if (node != null) {
            this.validateNode(node)
            nodes.push(node)
          }
        }catch (e: any) {
          this.addError(e.message, e.span, { 
            currentToken: this.stream.getPrev()?.getText(),
            nextToken: this.stream.hasNext() ? this.stream.getToken(false)?.getText() : undefined,
            linqLevel: this.linqLevel
          })
        }
      }
    } catch (e: any) {
      //console.error(e)
      if (ignoreError !== true) {
        throw e
      }
    }
    // 校验 import 资源是否存在
    this.validateImports(nodes)
    return nodes
  }

  // 校验 import 语句中引用的资源/类/模块是否存在
  private validateImports(nodes: Node[]) {
    for (const node of nodes) {
      if (node instanceof Import) {
        const pkg = (node as Import).packageName
        const isModule = (node as Import).module
        if (pkg && !JavaClass.hasImport(pkg, !!isModule)) {
          let typeLabel = '资源'
          if (!pkg.startsWith('@')) {
            typeLabel = isModule && !pkg.includes('.') ? '模块' : '类'
          }
          // 直接构造语义错误，绕过 ErrorEnhancer 的关键字匹配（避免消息中的 "string" 等词被误判）
          this.errors.push({
            message: `找不到${typeLabel} "${pkg}"，请检查路径是否正确或是否已创建`,
            suggestion: `请确认 "${pkg}" 对应的${typeLabel}存在，且路径拼写正确`,
            span: node.getSpan(),
            severity: 'error',
            code: 'IMPORT_NOT_FOUND'
          })
        }
      }
    }
  }

  private async validateSemantics(nodes: Node[], env: any) {
    const customFunctions: Record<string, { params: number }> = {}
    for (const node of nodes) {
      await this.collectCustomFunctions(node, customFunctions)
    }
    for (const node of nodes) {
      await this.validateNodeSemantics(node, env, customFunctions)
    }
  }

  private async collectCustomFunctions(node: Node, customFunctions: Record<string, { params: number }>) {
    if (node instanceof VarDefine && node.expression instanceof LambdaFunction) {
      customFunctions[node.varName] = {
        params: node.expression.parameters.length
      }
    }
    for (const expr of node.expressions().filter((it) => it)) {
      await this.collectCustomFunctions(expr, customFunctions)
    }
  }

  private async validateNodeSemantics(node: Node, env: any, customFunctions: Record<string, { params: number }>) {
    if (node instanceof MethodCall) {
      await this.validateMethodCall(node, env)
    }
    if (node instanceof FunctionCall) {
      await this.validateFunctionCall(node, env, customFunctions)
    }
    for (const expr of node.expressions().filter((it) => it)) {
      await this.validateNodeSemantics(expr, env, customFunctions)
    }
  }

  private async validateMethodCall(node: MethodCall, env: any) {
    const methodName = node.getMethod().member.getText()
    const targetType = await node.getMethod().getTarget().getJavaType(env)

    if (!targetType || typeof targetType !== 'string') {
      return
    }
    if (targetType.startsWith('@') || targetType === 'java.lang.Object') {
      return
    }

    const methods = JavaClass.findMethods(targetType)
    if (!methods || methods.length === 0) {
      return
    }

    const sameNameMethods = methods.filter((method: any) => method.name === methodName)
    if (sameNameMethods.length === 0) {
      this.errors.push({
        message: `类型 "${targetType}" 上找不到方法 "${methodName}"`,
        suggestion: `请确认 ${targetType} 是否存在名为 ${methodName} 的方法，或者检查目标对象是否正确`,
        span: node.getSpan(),
        severity: 'error',
        code: 'METHOD_NOT_FOUND'
      })
      return
    }

    for (const arg of node.getArguments()) {
      await arg.getJavaType(env)
    }

    let matched = false
    for (const method of sameNameMethods) {
      if (await JavaClass.matchTypes(method.parameters, node.getArguments(), method.extension, env)) {
        matched = true
        break
      }
    }

    if (!matched) {
      this.errors.push({
        message: `方法 "${targetType}.${methodName}" 的参数不匹配`,
        suggestion: `请检查 ${targetType}.${methodName} 的参数个数和类型是否正确。`,
        span: node.getSpan(),
        severity: 'error',
        code: 'METHOD_ARGUMENT_MISMATCH'
      })
    }
  }

  private async validateFunctionCall(node: FunctionCall, env: any, customFunctions: Record<string, { params: number }>) {
    if (!(node.getFunction() instanceof VariableAccess)) {
      return
    }

    const functionName = (node.getFunction() as VariableAccess).getVariable()
    const varValue = env?.[functionName]

    if (customFunctions[functionName]) {
      const expectedParams = customFunctions[functionName].params
      if (node.getArguments().length !== expectedParams) {
        this.errors.push({
          message: `函数 "${functionName}" 调用参数个数不匹配，期望 ${expectedParams} 个参数`,
          suggestion: `请检查函数 "${functionName}" 的定义和调用参数数量是否一致。`,
          span: node.getSpan(),
          severity: 'error',
          code: 'CUSTOM_FUNCTION_ARGUMENT_MISMATCH'
        })
      }
      return
    }

    if (varValue !== undefined) {
      return
    }

    const functionDef = JavaClass.findFunction().find((method: any) => method.name === functionName)
    if (!functionDef) {
      this.errors.push({
        message: `找不到函数 "${functionName}"`,
        suggestion: `请检查函数名称是否正确，或确认是否已通过 import 引入该函数。`,
        span: node.getSpan(),
        severity: 'error',
        code: 'FUNCTION_NOT_FOUND'
      })
    }
  }

  async parseEnv(): Promise<any> {
    const nodes = this.parse(true)
    const env = await this.processEnv(nodes)
    await this.validateSemantics(nodes, env)
    return env
  }

  async parseBest(position: any): Promise<{ best: any; env: any }> {
    let nodes = this.parse(true)
    let env = await this.processEnv(nodes)
    return {
      best: this.findBestMatch(nodes[nodes.length - 1], position),
      env
    }
  }

  async processEnv(nodes: Node[]): Promise<any> {
    let nodeLen = nodes.length
    let env = {
      ...RequestParameter.environmentFunction(),
      ...JavaClass.getAutoImportClass(),
      ...JavaClass.getAutoImportModule(),
      '@import': []
    }
    for (let i = 0; i < nodeLen; i++) {
      await nodes[i].getJavaType(env)
    }
    return env
  }

  validateNode(node) {
    if (node instanceof Literal) {
      // 提供更具体的错误信息，说明字面量不能单独使用的原因
      throw new ParseException('字面量（数字、字符串等）不能单独作为语句使用，需要赋值给变量或作为表达式的一部分', node.getSpan())
    }
  }

  parseStatement(expectRightCurly?: boolean): Node | null {
    let result: Node | null = null
    if (this.stream.match('import', false)) {
      result = this.parseImport()
    } else if (this.matchVarDefine()) {
      result = this.parseVarDefine()
    } else if (this.stream.match('if', false)) {
      result = this.parseIfStatement()
    } else if (this.stream.match('return', false)) {
      result = this.parseReturn()
    } else if (this.stream.match('for', false)) {
      result = this.parseForStatement()
    } else if (this.stream.match('while', false)) {
      result = this.parseWhileStatement()
    } else if (this.stream.match('continue', false)) {
      result = new Continue(this.stream.consume().getSpan())
    } else if (this.stream.match('async', false)) {
      result = this.parseAsync()
    } else if (this.stream.match('try', false)) {
      result = this.parseTryStatement()
    } else if (this.stream.match('break', false)) {
      result = new Break(this.stream.consume().getSpan())
    } else if (this.stream.match('exit', false)) {
      result = this.parseExit()
    } else if (this.stream.match('throw', false)) {
      result = this.parseThrow()
    } else if (this.stream.match('assert', false)) {
      result = this.parseAssert()
    } else {
      let index = this.stream.makeIndex()
      if (this.matchTypeDefine()) {
        this.stream.resetIndex(index)
        result = this.parseVarDefine()
      }
      if (result == null) {
        this.stream.resetIndex(index)
        result = this.parseExpression(expectRightCurly)
      }
    }
    while (this.stream.match(';', true)) {}
    return result
  }

  matchTypeDefine() {
    return this.stream.match(TokenType.Identifier, true) && this.stream.match(TokenType.Identifier, false)
  }

  matchVarDefine() {
    return this.stream.match(['var', 'let', 'const'], false)
  }

  checkKeyword(span) {
    if (keywords.indexOf(span.getText()) > -1) {
      throw new ParseException(`变量名不能定义为关键字 '${span.getText()}'`, span)
    }
  }

  parseThrow() {
    let opening = this.stream.consume().getSpan()
    let expression = this.parseExpression()
    return new Throw(new Span(opening, this.stream.getPrev().getSpan()), expression)
  }

  parseExit() {
    let opening = this.stream.expect('exit').getSpan()
    let expressionList = []
    do {
      expressionList.push(this.parseExpression())
    } while (this.stream.match(TokenType.Comma, true))
    return new Exit(new Span(opening, this.stream.getPrev().getSpan()), expressionList)
  }

  parseAssert() {
    let index = this.stream.makeIndex()
    try {
      let opening = this.stream.expect('assert').getSpan()
      let condition = this.parseExpression()
      this.stream.expect(TokenType.Colon)
      let expressionList = []
      do {
        expressionList.push(this.parseExpression())
      } while (this.stream.match(TokenType.Comma, true))
      return new Assert(new Span(opening, this.stream.getPrev().getSpan()), condition, expressionList)
    } catch (e) {
      this.stream.resetIndex(index)
      return this.parseExpression()
    }
  }

  parseImport() {
    let opening = this.stream.expect('import').getSpan()
    if (this.stream.hasMore()) {
      let expected = this.stream.consume()
      let packageName = null
      let isStringLiteral = expected.getTokenType() === TokenType.StringLiteral
      if (isStringLiteral) {
        packageName = this.createStringLiteral(expected).getValue()
      } else if (expected.type === TokenType.Identifier) {
        let startSpan = expected.getSpan()
        let endSpan = null
        packageName = startSpan.getText()
        while (this.stream.match(TokenType.Period, true)) {
          isStringLiteral = true
          if (this.stream.match(TokenType.Asterisk, false)) {
            expected = this.stream.consume()
            break
          }
          expected = this.stream.expect(TokenType.Identifier)
        }
        if (isStringLiteral) {
          endSpan = expected.getSpan()
          packageName = new Span(startSpan, endSpan).getText()
        }
      } else {
        throw new ParseException(
          'Expected identifier or string, but got stream is ' + expected.getTokenType().error,
          this.stream.getPrev().getSpan()
        )
      }

      let varName = packageName
      if (isStringLiteral) {
        if (this.stream.match('as', true)) {
          expected = this.stream.expect(TokenType.Identifier)
          this.checkKeyword(expected.getSpan())
          varName = expected.getSpan().getText()
        } else {
          let temp = packageName
          if (!temp.startsWith('@')) {
            let index = temp.lastIndexOf('.')
            if (index != -1) {
              temp = temp.substring(index + 1)
            }
          } else {
            throw new ParseException('Expected as', this.stream.getPrev().getSpan())
          }
          varName = temp
        }
      }
      return new Import(new Span(opening, expected.getSpan()), packageName, varName, !isStringLiteral)
    }
    throw new ParseException('Expected identifier or string, but got stream is EOF', this.stream.getPrev().getSpan())
  }

  parseReturn() {
    let returnSpan = this.stream.expect('return').getSpan()
    if (this.stream.match(';', false)) return new Return(returnSpan, null)
    let returnValue = this.parseExpression()
    return new Return(new Span(returnSpan, returnValue.getSpan()), returnValue)
  }

  parseAsync() {
    let opening = this.stream.expect('async').getSpan()
    let expression = this.parseExpression()
    return new AsyncCall(new Span(opening, this.stream.getPrev().getSpan()), expression)
  }

  parseIfStatement() {
    let openingIf = this.stream.expect('if').getSpan()
    let condition = this.parseExpression()
    let trueBlock = this.parseFunctionBody()
    let elseIfs = []
    let falseBlock = []
    while (this.stream.hasMore() && this.stream.match('else', true)) {
      if (this.stream.hasMore() && this.stream.match('if', false)) {
        let elseIfOpening = this.stream.expect('if').getSpan()
        let elseIfCondition = this.parseExpression()
        let elseIfBlock = this.parseFunctionBody()
        let elseIfSpan = new Span(
          elseIfOpening,
          elseIfBlock.length > 0 ? elseIfBlock[elseIfBlock.length - 1].getSpan() : elseIfOpening
        )
        elseIfs.push(new IfStatement(elseIfSpan, elseIfCondition, elseIfBlock, []))
      } else {
        falseBlock = falseBlock.concat(this.parseFunctionBody())
        break
      }
    }
    let closingEnd = this.stream.getPrev().getSpan()

    return new IfStatement(new Span(openingIf, closingEnd), condition, trueBlock, elseIfs, falseBlock)
  }

  parseNewExpression(opening) {
    let expression = this.parseAccessOrCall(TokenType.Identifier, true)
    let span = new Span(opening.getSource(), opening.getStart(), this.stream.getPrev().getSpan().getEnd())
    if (expression instanceof MethodCall) {
      return this.parseAccessOrCall(new NewStatement(span, expression.getMethod(), expression.getArguments()))
    } else if (expression instanceof FunctionCall) {
      return this.parseAccessOrCall(new NewStatement(span, expression.getFunction(), expression.getArguments()))
    }
    return this.parseAccessOrCall(new NewStatement(span, expression, []))
    // throw new ParseException("Expected MethodCall or FunctionCall or LambdaFunction", this.stream.getPrev().getSpan());
  }

  parseArguments() {
    this.stream.expect(TokenType.LeftParantheses)
    let args = []
    while (this.stream.hasMore() && !this.stream.match(TokenType.RightParantheses, false)) {
      args.push(this.parseExpression())
      if (!this.stream.match(TokenType.RightParantheses, false)) this.stream.expect(TokenType.Comma)
    }
    return args
  }

  parseForStatement() {
    let openingFor = this.stream.expect('for').getSpan()
    this.stream.expect('(')
    let index = null
    let value = this.stream.expect(TokenType.Identifier).getSpan()
    this.checkKeyword(value)
    if (this.stream.match(TokenType.Comma, true)) {
      index = value
      value = this.stream.expect(TokenType.Identifier).getSpan()
      this.checkKeyword(value)
    }
    this.stream.expect('in')
    let mapOrArray = this.parseExpression()
    this.stream.expect(')')
    let body = this.parseFunctionBody()
    return new ForStatement(
      new Span(openingFor, this.stream.getPrev().getSpan()),
      index && index.getText(),
      value && value.getText(),
      mapOrArray,
      body
    )
  }

  parseVarDefine() {
    let opening = this.stream.consume().getSpan()
    let isDestructuring;
    let identifiers = [];
    
    // Check for destructuring pattern (either {a,b} or [a,b])
    if ((isDestructuring = this.stream.match(TokenType.LeftCurly, false)) || 
        this.stream.match(TokenType.LeftBracket, false)) {
        
        this.stream.expect([TokenType.LeftCurly, TokenType.LeftBracket]);
        
        // Collect identifiers until closing token
        do {
            let id = this.stream.expect(TokenType.Identifier);
            identifiers.push(id);
        } while (this.stream.match(TokenType.Comma, true));
        
        // Expect closing token
        isDestructuring ? 
            this.stream.match(TokenType.RightCurly, true) : 
            this.stream.match(TokenType.RightBracket, true);
        
        // Expect assignment operator
        this.stream.match(TokenType.Assignment, true);
        
        return new DestructuringVarDefine(
            new Span(opening, this.stream.getPrev().getSpan()),
            identifiers,
            this.parseExpression(),
            opening.getText(),
            isDestructuring
        );
    }
    let token = this.stream.expect(TokenType.Identifier)
    this.checkKeyword(token.getSpan())
    let varDefine
    if (this.stream.match(TokenType.Assignment, true)) {
      varDefine = new VarDefine(
        new Span(opening, this.stream.getPrev().getSpan()),
        token.getText(),
        this.parseExpression(),
        opening.getText()
      )
    } else {
      varDefine = new VarDefine(
        new Span(opening, this.stream.getPrev().getSpan()),
        token.getText(),
        null,
        opening.getText()
      )
    }
    return varDefine
  }

  parseTryStatement() {
    let opening = this.stream.expect('try')
    let tryResources = []
    if (this.stream.match('(', true)) {
      if (this.stream.match(')', false)) {
        // 空的 try-with-resource
      } else {
        while (!this.stream.match(')', false)) {
          if (this.stream.match(';', true)) {
            continue
          }
          let result = null
          if (this.matchVarDefine()) {
            result = this.parseVarDefine()
          } else {
            if (this.stream.matchAny(keywords, false)) {
              throw new ParseException('try 括号中只允许写赋值语句', this.stream.consume().getSpan())
            }
            let index = this.stream.makeIndex()
            if (this.matchTypeDefine()) {
              this.stream.resetIndex(index)
              result = this.parseVarDefine()
            }
            if (result == null) {
              this.stream.resetIndex(index)
              throw new ParseException('try 括号中只允许写赋值语句', this.stream.consume().getSpan())
            }
          }
          tryResources.push(result)
        }
      }
      this.stream.expect(')')
    }
    let tryBlocks = this.parseFunctionBody()
    let catchBlocks = []
    let finallyBlocks = []
    let exception = null
    if (this.stream.match('catch', true)) {
      if (this.stream.match('(', true)) {
        exception = this.stream.expect(TokenType.Identifier).getText()
        this.stream.expect(')')
      }
      catchBlocks = catchBlocks.concat(this.parseFunctionBody())
    }
    if (this.stream.match('finally', true)) {
      finallyBlocks = finallyBlocks.concat(this.parseFunctionBody())
    }
    return new TryStatement(
      new Span(opening.getSpan(), this.stream.getPrev().getSpan()),
      exception,
      tryBlocks,
      tryResources,
      catchBlocks,
      finallyBlocks
    )
  }

  parseWhileStatement() {
    let openingWhile = this.stream.expect('while').getSpan()
    let condition = this.parseExpression()
    let trueBlock = this.parseFunctionBody()
    let closingEnd = this.stream.getPrev().getSpan()

    return new WhileStatement(new Span(openingWhile, closingEnd), condition, trueBlock)
  }

  parseFunctionBody() {
    this.stream.expect('{')
    let blocks = []
    while (this.stream.hasMore() && !this.stream.match('}', false)) {
      let node = this.parseStatement(true)
      if (node != null) {
        this.validateNode(node)
        blocks.push(node)
      }
    }
    this.expectCloseing()
    return blocks
  }

  expectCloseing() {
    if (!this.stream.hasMore()) {
      // throw new ParseException("Did not find closing }.", this.stream.prev().getSpan());
    }
    return this.stream.expect('}').getSpan()
  }

  parseExpression(expectRightCurly) {
    return this.parseTernaryOperator(expectRightCurly)
  }

  parseTernaryOperator(expectRightCurly) {
    let condition = this.parseBinaryOperator(0, expectRightCurly)
    if (this.stream.match(TokenType.Questionmark, true)) {
      let trueExpression = this.parseTernaryOperator(expectRightCurly)
      this.stream.expect(TokenType.Colon)
      let falseExpression = this.parseTernaryOperator(expectRightCurly)
      if (condition instanceof BinaryOperation && condition.getOperator() === TokenType.Assignment) {
        condition.setRightOperand(new TernaryOperation(condition.getRightOperand(), trueExpression, falseExpression))
        return condition
      }
      return new TernaryOperation(condition, trueExpression, falseExpression)
    } else {
      return condition
    }
  }

  parseBinaryOperator(level, expectRightCurly) {
    let nextLevel = level + 1
    let precedence = this.linqLevel > 0 ? linqBinaryOperatorPrecedence : binaryOperatorPrecedence
    let left =
      nextLevel === precedence.length
        ? this.parseUnaryOperator(expectRightCurly)
        : this.parseBinaryOperator(nextLevel, expectRightCurly)
    let operators = precedence[level]
    while (this.stream.hasMore() && this.stream.match(operators, false)) {
      let operator = this.stream.consume()
      if (operator.type.inLinq && this.linqLevel === 0) {
        throw new ParseException(
          operator.getText() + ' 只能在Linq中使用',
          this.stream.hasMore() ? this.stream.consume().getSpan() : this.stream.getPrev().getSpan()
        )
      }
      let right =
        nextLevel === precedence.length
          ? this.parseUnaryOperator(expectRightCurly)
          : this.parseBinaryOperator(nextLevel, expectRightCurly)
      left = new BinaryOperation(left, operator, right, this.linqLevel)
    }
    return left
  }

  parseUnaryOperator(expectRightCurly) {
    if (this.stream.match(unaryOperators, false)) {
      return new UnaryOperation(this.stream.consume(), this.parseUnaryOperator(expectRightCurly))
    } else {
      if (this.stream.match(TokenType.LeftParantheses, false)) {
        let openSpan = this.stream.expect(TokenType.LeftParantheses).getSpan()
        let index = this.stream.makeIndex()
        let parameters = []
        while (this.stream.match(TokenType.Identifier, false)) {
          let identifier = this.stream.expect(TokenType.Identifier)
          parameters.push(identifier.getSpan().getText())
          if (this.stream.match(TokenType.Comma, true)) {
            continue
          }
          if (this.stream.match(TokenType.RightParantheses, true)) {
            if (this.stream.match(TokenType.Lambda, true)) {
              return this.parseLambdaBody(openSpan, parameters)
            }
            break
          }
        }
        if (this.stream.match(TokenType.RightParantheses, true) && this.stream.match(TokenType.Lambda, true)) {
          return this.parseLambdaBody(openSpan, parameters)
        }
        this.stream.resetIndex(index)
        let expression = this.parseExpression()
        this.stream.expect(TokenType.RightParantheses)
        return this.parseAccessOrCall(expression)
      } else {
        let expression = this.parseAccessOrCallOrLiteral(expectRightCurly)
        if (
          expression instanceof MemberAccess ||
          expression instanceof VariableAccess ||
          expression instanceof MapOrArrayAccess
        ) {
          if (this.stream.match([TokenType.PlusPlus, TokenType.MinusMinus], false)) {
            return new UnaryOperation(this.stream.consume(), expression)
          }
        }
        return expression
      }
    }
  }

  parseLambdaBody(openSpan, parameters) {
    let index = this.stream.makeIndex()
    let childNodes = []
    try {
      let expression = this.parseExpression()
      childNodes.push(new Return(new Span('return', 0, 6), expression))
      return new LambdaFunction(new Span(openSpan, expression.getSpan()), parameters, childNodes)
    } catch (e) {
      this.stream.resetIndex(index)
      if (this.stream.match(TokenType.LeftCurly, true)) {
        while (this.stream.hasMore() && !this.stream.match('}', false)) {
          let node = this.parseStatement(true)
          this.validateNode(node)
          childNodes.push(node)
        }
        let closeSpan = this.expectCloseing()
        return new LambdaFunction(new Span(openSpan, closeSpan), parameters, childNodes)
      } else {
        let node = this.parseStatement()
        childNodes.push(new Return(new Span('return', 0, 6), node))
        return new LambdaFunction(new Span(openSpan, node.getSpan()), parameters, childNodes)
      }
    }
  }

  parseSpreadAccess(spread) {
    if (!spread) {
      spread = this.stream.expect(TokenType.Spread)
    }
    let target = this.parseExpression()
    return new Spread(new Span(spread.getSpan(), target.getSpan()), target)
  }

  parseAccessOrCall(target, isNew) {
    if (target === TokenType.StringLiteral || target === TokenType.Identifier) {
      let token = this.stream.expect(target)
      let identifier = token.getSpan()
      if (target === TokenType.Identifier && 'new' === identifier.getText()) {
        return this.parseNewExpression(identifier)
      }
      if (target === TokenType.Identifier && this.stream.match(TokenType.Lambda, true)) {
        return this.parseLambdaBody(identifier, [identifier.getText()])
      }
      let result =
        target === TokenType.StringLiteral
          ? this.createStringLiteral(token)
          : new VariableAccess(identifier, identifier.getText())
      return this.parseAccessOrCall(result, isNew)
    } else {
      while (
        this.stream.hasMore() &&
        this.stream.match(
          [
            TokenType.LeftParantheses,
            TokenType.LeftBracket,
            TokenType.Period,
            TokenType.QuestionPeriod,
            TokenType.ColonColon
          ],
          false
        )
      ) {
        if (this.stream.match(TokenType.ColonColon, false)) {
          let open = this.stream.consume().getSpan()
          let args = []
          let identifier = this.stream.expect(TokenType.Identifier)
          let closing = identifier.getSpan()
          if (this.stream.match(TokenType.LeftParantheses, false)) {
            args = this.parseArguments()
            closing = this.stream.expect(TokenType.RightParantheses).getSpan()
          }
          target = new ClassConverter(new Span(open, closing), identifier.getText(), target, args)
        }
        // function or method call
        else if (this.stream.match(TokenType.LeftParantheses, false)) {
          let args = this.parseArguments()
          let closingSpan = this.stream.expect(TokenType.RightParantheses).getSpan()
          if (target instanceof VariableAccess || target instanceof MapOrArrayAccess)
            target = new FunctionCall(new Span(target.getSpan(), closingSpan), target, args, this.linqLevel > 0)
          else if (target instanceof MemberAccess) {
            target = new MethodCall(new Span(target.getSpan(), closingSpan), target, args, this.linqLevel > 0)
          } else {
            throw new ParseException(
              'Expected a variable, field or method.',
              this.stream.hasMore() ? this.stream.consume().getSpan() : this.stream.getPrev().getSpan()
            )
          }
          if (isNew) {
            break
          }
        }

        // map or array access
        else if (this.stream.match(TokenType.LeftBracket, true)) {
          let keyOrIndex = this.parseExpression()
          let closingSpan = this.stream.expect(TokenType.RightBracket).getSpan()
          target = new MapOrArrayAccess(new Span(target.getSpan(), closingSpan), target, keyOrIndex)
        }

        // field or method access
        else if (this.stream.match([TokenType.Period, TokenType.QuestionPeriod], false)) {
          let optional = this.stream.consume().getTokenType() === TokenType.QuestionPeriod
          if (this.linqLevel > 0 && this.stream.match(TokenType.Asterisk, false)) {
            target = new MemberAccess(target, optional, this.stream.expect(TokenType.Asterisk).getSpan(), true)
          } else {
            let name = this.stream.expect([TokenType.Identifier, TokenType.SqlAnd, TokenType.SqlOr]).getSpan()
            target = new MemberAccess(new Span(target.getSpan(), name), target, optional, name, false)
          }
        }
      }
      return target
    }
  }

  parseMapLiteral() {
    let openCurly = this.stream.expect(TokenType.LeftCurly).getSpan()

    let keys = []
    let values = []
    while (this.stream.hasMore() && !this.stream.match('}', false)) {
      let key
      if (this.stream.hasPrev()) {
        let prev = this.stream.getPrev()
        if (
          this.stream.match(TokenType.Spread, false) &&
          (prev.getTokenType() === TokenType.LeftCurly || prev.getTokenType() === TokenType.Comma)
        ) {
          let spread = this.stream.expect(TokenType.Spread)
          keys.push(spread)
          values.push(this.parseSpreadAccess(spread))
          if (this.stream.match([TokenType.Comma, TokenType.RightCurly], false)) {
            this.stream.match(TokenType.Comma, true)
          }
          continue
        }
      }
      if (this.stream.match(TokenType.StringLiteral, false)) {
        key = this.stream.expect(TokenType.StringLiteral)
      } else if (this.stream.match(TokenType.LeftBracket, true)) {
        // [key]
        key = this.parseExpression()
        this.stream.expect(TokenType.RightBracket)
      } else {
        key = this.stream.expect(TokenType.Identifier)
      }
      keys.push(key)
      if (this.stream.match([TokenType.Comma, TokenType.RightCurly], false)) {
        this.stream.match(TokenType.Comma, true)
        if (key instanceof VariableAccess) {
          values.push(key)
        } else if (key.getTokenType() === TokenType.Identifier) {
          values.push(new VariableAccess(key.getSpan(), key.getText()))
        } else {
          values.push(new Literal(key.getSpan(), 'java.lang.String'))
        }
      } else {
        this.stream.expect(':')
        values.push(this.parseExpression())
        if (!this.stream.match('}', false)) {
          this.stream.expect(TokenType.Comma)
        }
      }
    }
    let closeCurly = this.stream.expect('}').getSpan()
    return new MapLiteral(new Span(openCurly, closeCurly), keys, values)
  }

  parseListLiteral() {
    let openBracket = this.stream.expect(TokenType.LeftBracket).getSpan()
    let values = []
    while (this.stream.hasMore() && !this.stream.match(TokenType.RightBracket, false)) {
      values.push(this.parseExpression())
      if (!this.stream.match(TokenType.RightBracket, false)) {
        this.stream.expect(TokenType.Comma)
      }
    }

    let closeBracket = this.stream.expect(TokenType.RightBracket).getSpan()
    return new ListLiteral(new Span(openBracket, closeBracket), values)
  }

  parseSelect() {
    let opening = this.stream.expect('select', true).getSpan()
    this.linqLevel++
    let fields = this.parseLinqFields()
    this.stream.expect('from', true)
    let from = this.parseLinqField()
    let joins = this.parseLinqJoins()
    let where
    if (this.stream.match('where', true, true)) {
      where = this.parseExpression()
    }
    let groups = this.parseGroup()
    let having
    if (this.stream.match('having', true, true)) {
      having = this.parseExpression()
    }
    let orders = this.parseLinqOrders()
    this.linqLevel--
    let limit, offset
    if (this.stream.match('limit', true, true)) {
      limit = this.parseExpression()
      if (this.stream.match('offset', true, true)) {
        offset = this.parseExpression()
      }
    }
    let close = this.stream.getPrev().getSpan()
    return new LinqSelect(new Span(opening, close), fields, from, joins, where, groups, having, orders, limit, offset)
  }

  parseGroup() {
    let groups = []
    if (this.stream.match('group', true, true)) {
      this.stream.expect('by', true)
      do {
        let expression = this.parseExpression()
        groups.push(new LinqField(expression.getSpan(), expression, null))
      } while (this.stream.match(TokenType.Comma, true))
    }
    return groups
  }

  parseLinqOrders() {
    let orders = []
    if (this.stream.match('order', true, true)) {
      this.stream.expect('by', true)
      do {
        let expression = this.parseExpression()
        let order = 1
        if (this.stream.match(['desc', 'asc'], false, true)) {
          if ('desc' === this.stream.consume().getText()) {
            order = -1
          }
        }
        orders.push(
          new LinqOrder(new Span(expression.getSpan(), this.stream.getPrev().getSpan()), expression, null, order)
        )
      } while (this.stream.match(TokenType.Comma, true))
    }
    return orders
  }

  parseLinqField() {
    let expression = this.parseExpression()
    if (this.stream.match(TokenType.Identifier, false) && !this.stream.match(linqKeywords, false, true)) {
      let alias = this.stream.expect(TokenType.Identifier).getSpan()
      return new LinqField(new Span(expression.getSpan(), alias), expression, alias.getText())
    }
    return new LinqField(expression.getSpan(), expression, null)
  }

  parseLinqFields() {
    let fields = []
    do {
      let expression = this.parseExpression()

      if (this.stream.match(TokenType.Identifier, false) && !this.stream.match(linqKeywords, false, true)) {
        if (expression instanceof WholeLiteral) {
          throw new ParseException(
            '* 后边不能跟别名',
            this.stream.hasMore() ? this.stream.consume().getSpan() : this.stream.getPrev().getSpan()
          )
        } else if (expression instanceof MemberAccess && expression.isWhole()) {
          throw new ParseException(
            expression.getSpan().getText() + ' 后边不能跟别名',
            this.stream.hasMore() ? this.stream.consume().getSpan() : this.stream.getPrev().getSpan()
          )
        }
        let alias = this.stream.consume().getSpan()
        fields.push(new LinqField(new Span(expression.getSpan(), alias), expression, alias.getText()))
      } else {
        fields.push(new LinqField(expression.getSpan(), expression, null))
      }
    } while (this.stream.match(TokenType.Comma, true)) //,
    if (fields.length === 0) {
      throw new ParseException(
        '至少要查询一个字段',
        this.stream.hasMore() ? this.stream.consume().getSpan() : this.stream.getPrev().getSpan()
      )
    }
    return fields
  }

  parseLinqJoins() {
    let joins = []
    do {
      let isLeft = this.stream.match('left', false)
      let opeing = isLeft ? this.stream.consume().getSpan() : null
      if (this.stream.match('join', true)) {
        opeing = isLeft ? opeing : this.stream.getPrev().getSpan()
        let target = this.parseLinqField()
        this.stream.expect('on')
        let condition = this.parseExpression()
        joins.push(new LinqJoin(new Span(opeing, this.stream.getPrev().getSpan()), isLeft, target, condition))
      }
    } while (this.stream.match(['left', 'join'], false))
    return joins
  }

  parseAccessOrCallOrLiteral(expectRightCurly) {
    let expression
    if (expectRightCurly && this.stream.match('}', false)) {
      return null
    } else if (this.stream.match(TokenType.Spread, false)) {
      expression = this.parseSpreadAccess()
    } else if (this.stream.match(TokenType.Identifier, false)) {
      if (this.stream.match('async', false)) {
        expression = this.parseAsync()
      } else if (this.stream.match('select', false, true)) {
        expression = this.parseSelect()
      } else {
        expression = this.parseAccessOrCall(TokenType.Identifier)
      }
    } else if (this.stream.match(TokenType.LeftCurly, false)) {
      expression = this.parseMapLiteral()
    } else if (this.stream.match(TokenType.LeftBracket, false)) {
      expression = this.parseListLiteral()
    } else if (this.stream.match(TokenType.StringLiteral, false)) {
      expression = this.createStringLiteral(this.stream.expect(TokenType.StringLiteral))
    } else if (this.stream.match(TokenType.BooleanLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.BooleanLiteral).getSpan(), 'java.lang.Boolean')
    } else if (this.stream.match(TokenType.DoubleLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.DoubleLiteral).getSpan(), 'java.lang.Double')
    } else if (this.stream.match(TokenType.FloatLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.FloatLiteral).getSpan(), 'java.lang.Float')
    } else if (this.stream.match(TokenType.ByteLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.ByteLiteral).getSpan(), 'java.lang.Byte')
    } else if (this.stream.match(TokenType.ShortLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.ShortLiteral).getSpan(), 'java.lang.Short')
    } else if (this.stream.match(TokenType.IntegerLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.IntegerLiteral).getSpan(), 'java.lang.Integer')
    } else if (this.stream.match(TokenType.LongLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.LongLiteral).getSpan(), 'java.lang.Long')
    } else if (this.stream.match(TokenType.DecimalLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.DecimalLiteral).getSpan(), 'java.math.BigDecimal')
    } else if (this.stream.match(TokenType.RegexpLiteral, false)) {
      let token = this.stream.expect(TokenType.RegexpLiteral)
      expression = new Literal(token.getSpan(), 'java.util.regex.Pattern')
    } else if (this.stream.match(TokenType.NullLiteral, false)) {
      expression = new Literal(this.stream.expect(TokenType.NullLiteral).getSpan(), 'null')
    } else if (this.linqLevel > 0 && this.stream.match(TokenType.Asterisk, false)) {
      expression = new WholeLiteral(this.stream.expect(TokenType.Asterisk).getSpan())
    } else if (this.stream.match(TokenType.Language, false)) {
      expression = new LanguageExpression(this.stream.consume().getSpan(), this.stream.consume().getSpan())
    }
    if (expression == null) {
      const currentToken = this.stream.hasNext() ? this.stream.getToken(false) : null;
      const tokenText = currentToken ? `'${currentToken.getText()}'` : '文件结尾';
      
      // 提供更具体的错误上下文信息
      let errorMessage = `期望变量、字段、映射、数组、函数或方法调用，但发现了${tokenText}`;
      
      // 根据当前解析上下文提供更具体的建议
      if (currentToken) {
        const tokenValue = currentToken.getText();
        
        // 逗号相关的错误
        if (tokenValue === ',') {
          errorMessage = `逗号使用不当，可能缺少表达式或多余的逗号`;
        }
        // 冒号相关的错误  
        else if (tokenValue === ':') {
          errorMessage = `冒号使用不当，应该在对象字面量中用于分隔键值对`;
        }
        // 数字字面量相关的错误
        else if (/^\d+$/.test(tokenValue)) {
          errorMessage = `数字 ${tokenValue} 不能单独使用，需要赋值给变量或作为表达式的一部分`;
        }
      }
      
      throw new ParseException(
        errorMessage,
        this.stream.hasMore() ? this.stream.consume().getSpan() : this.stream.getPrev().getSpan()
      )
    }
    return this.parseAccessOrCall(expression)
  }

  createStringLiteral(token) {
    if (token.getTokenStream() == null) {
      return new Literal(token.getSpan(), 'java.lang.String')
    }
    let tempStream = this.stream
    this.stream = token.getTokenStream()
    let expressions = []
    while (this.stream.hasMore()) {
      expressions.push(this.parseExpression())
    }
    this.stream = tempStream
    return new Literal(token.getSpan(), 'java.lang.String', expressions)
  }

  findBestMatch(node: any, position: any): any {
    let expressions = node.expressions().filter((it: any) => it)
    for (let index in expressions) {
      let best = this.findBestMatch(expressions[index], position)
      if (best) {
        return best
      }
    }
    if (node.getSpan().inPosition(position)) {
      return node
    }
    return null
  }
}

function processBody(body, level) {
  let arr = []
  let defaultParam = {
    name: '',
    value: '',
    dataType: '',
    validateType: '',
    expression: '',
    error: '',
    description: '',
    children: [],
    level: level + 1,
    selected: false
  }
  if (body instanceof MapLiteral) {
    body.keys.forEach((key, index) => {
      let value = body.values[index]
      let param = {
        ...defaultParam,
        name: key.span.getText().replace(/['"]/g, ''),
        value: isSimpleObject(value) ? value.span.getText().trim() : '',
        dataType: getType(value)
      }
      if (value instanceof MapLiteral || value instanceof ListLiteral) {
        param.children = processBody(value, level + 1)
      }
      arr.push(param)
    })
  } else if (body instanceof ListLiteral) {
    if (body.values[0]) {
      let value = body.values[0]
      let param = {
        ...defaultParam,
        value: isSimpleObject(value) ? value.span.getText().trim() : '',
        dataType: getType(value)
      }
      if (value instanceof MapLiteral || value instanceof ListLiteral) {
        param.children = processBody(value, level + 1)
      }
      arr.push(param)
    }
  }
  return arr
}

function isSimpleObject(object) {
  return !(object instanceof MapLiteral || object instanceof ListLiteral)
}

function getType(object) {
  if (object instanceof MapLiteral) {
    return 'Object'
  }
  if (object instanceof ListLiteral) {
    return 'Array'
  }
  if (object instanceof UnaryOperation) {
    object = object.operand
  }
  let type = object.javaType?.substring(object.javaType.lastIndexOf('.') + 1)
  if (
    (type === 'Integer' && Number(object.span.getText()) > 0x7fffffff) ||
    Number(object.span.getText()) < -0x80000000
  ) {
    return 'Long'
  }
  return type === 'null' ? 'Object' : type
}

export async function parseJson(bodyStr: string): Promise<any> {
  let astNodes: Node[] = [];
  let env: any = {};
  let parser: Parser | null = null;
  try {
    parser = new Parser(new TokenStream(tokenizer(bodyStr)))
    astNodes = parser.parse(true);
    env = await parser.processEnv(astNodes)
  } catch (e) {
    // console.error(e)
  }
  // 3. 返回完整的AST结构
    return {
        type: 'Program',
        body: astNodes,
        sourceType: 'script',
        env,
        parser,
        loc: {
            start: { line: 1, column: 0 },
            end: { 
                line: bodyStr.split('\n').length, 
                column: bodyStr.split('\n').slice(-1)[0].length 
            }
        }
    };
}
