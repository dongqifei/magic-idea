import { CharacterStream, LiteralToken, ParseException, Token, TokenStream, TokenType } from './index'

// 处理正则表达式 token（增加对 Not 等符号的判断，调整匹配逻辑）
const regexpToken = (stream: CharacterStream, tokens: Token[]) => {
  if (tokens.length > 0) {
    let token = tokens[tokens.length - 1]
    if (token instanceof LiteralToken) {
      return false
    }
    switch (token.getTokenType()) {
      case TokenType.Comma:
      case TokenType.Semicolon:
      case TokenType.Colon:
      case TokenType.RightCurly:
      case TokenType.LeftBracket:
      case TokenType.LeftParantheses:
      case TokenType.Assignment:
      case TokenType.NotEqual:
      case TokenType.EqualEqualEqual:
      case TokenType.NotEqualEqual:
      case TokenType.Equal:
      case TokenType.And:
      case TokenType.Or:
      case TokenType.SqlAnd:
      case TokenType.SqlOr:
      case TokenType.SqlNotEqual:
      case TokenType.Questionmark:
      case TokenType.InstanceOf:
      case TokenType.Lambda:
      case TokenType.Not:
        break
      default:
        return false
    }
  }
  if (stream.match('/', false)) {
    let mark = stream.getPosition()
    stream.consume()
    stream.startSpan()
    let matchedEndQuote = false
    let deep = 0
    let maybeMissForwardSlash = 0
    let maybeMissForwardSlashEnd = 0
    while (stream.hasMore()) {
      if (stream.match('\\', true)) {
        stream.consume()
        continue
      }
      if (stream.match('[', false)) {
        deep++
        maybeMissForwardSlash = stream.getPosition()
      } else if (deep > 0 && stream.match(']', false)) {
        deep--
      } else if (stream.match(TokenType.ForwardSlash.literal, true)) {
        if (deep === 0) {
          // 简化标志匹配逻辑
          stream.match('g', true)
          stream.match('i', true)
          stream.match('m', true)
          stream.match('s', true)
          stream.match('u', true)
          stream.match('y', true)
          matchedEndQuote = true
          break
        } else {
          maybeMissForwardSlashEnd = stream.getPosition()
        }
      }
      let ch = stream.consume()
      if (ch === '\r' || ch === '\n') {
        stream.reset(mark)
        return false
      }
    }
    if (deep !== 0) {
      throw new ParseException("Missing ']'", stream.getSpan(maybeMissForwardSlash, maybeMissForwardSlashEnd - 1))
    }
    if (!matchedEndQuote) {
      stream.reset(mark)
      return false
    }
    let regexpSpan = stream.endSpan()
    regexpSpan = stream.getSpan(regexpSpan.getStart() - 1, regexpSpan.getEnd())
    tokens.push(new LiteralToken(TokenType.RegexpLiteral, regexpSpan, null))
    return true
  }
  return false
}

// 处理字符串 token（调整参数顺序和异常信息）
const tokenizerString = (stream: CharacterStream, tokenType: TokenType, tokens: Token[]) => {
  if (stream.match(tokenType, true)) {
    stream.startSpan()
    let matchedEndQuote = false
    while (stream.hasMore()) {
      if (stream.match('\\', true)) {
        stream.consume()
        continue
      }
      if (stream.match(tokenType.literal, true)) {
        matchedEndQuote = true
        break
      }
      let ch = stream.consume()
      if (tokenType !== TokenType.TripleQuote && (ch === '\r' || ch === '\n')) {
        throw new ParseException(`${tokenType.error}${tokenType.error}定义的字符串不能换行`, stream.endSpan())
      }
    }
    if (!matchedEndQuote) {
      throw new ParseException(`字符串没有结束符${tokenType.error}`, stream.endSpan())
    }
    let stringSpan = stream.endSpan()
    stringSpan = stream.getSpan(stringSpan.getStart(), stringSpan.getEnd() - tokenType.literal.length)
    tokens.push(new LiteralToken(TokenType.StringLiteral, stringSpan, null))
    return true
  }
  return false
}

// 数字类型自动判断（调整整数范围判断逻辑）
const autoNumberType = (span: any, radix: number) => {
  let value = Number.parseInt(span.getText().substring(2).replace(/\_/g, ''), radix)
  // 调整整数范围判断：int 范围改为 2147483647/-2147483648
  if (value > 2147483647 || value < -2147483648) {
    return new LiteralToken(TokenType.LongLiteral, span, value)
  } else if (value > 127 || value < -128) {
    return new LiteralToken(TokenType.IntegerLiteral, span, value)  // 中间范围改为 Integer
  }
  return new LiteralToken(TokenType.ByteLiteral, span, value)
}

// 处理数字 token（优化循环逻辑）
const tokenizerNumber = (stream: CharacterStream, tokens: Token[]) => {
  if (stream.match('0', false)) {
    let index = stream.getPosition()
    stream.startSpan()
    stream.consume()
    if (stream.matchAny(['x', 'X'], true)) {
      // 简化循环条件
      while (
        stream.matchDigit(true) ||
        stream.matchAny(['A', 'B', 'C', 'D', 'E', 'F', 'a', 'b', 'c', 'd', 'e', 'f', '_'], true)
      );
      if (stream.matchAny(['L', 'l'], true)) {
        let span = stream.endSpan()
        let text = span.getText()
        tokens.push(
          new LiteralToken(
            TokenType.LongLiteral,
            span,
            parseInt(text.substring(2, text.length - 1).replace(/\_/g, ''), 16)
          )
        )
        return true
      }
      tokens.push(autoNumberType(stream.endSpan(), 16))
      return true
    } else if (stream.matchAny(['b', 'B'], true)) {
      while (stream.matchAny(['0', '1', '_'], true));
      if (stream.matchAny(['L', 'l'], true)) {
        let span = stream.endSpan()
        let text = span.getText()
        tokens.push(
          new LiteralToken(
            TokenType.LongLiteral,
            span,
            parseInt(text.substring(2, text.length - 1).replace(/\_/g, ''), 2)
          )
        )
        return true
      }
      tokens.push(autoNumberType(stream.endSpan(), 2))
      return true
    }
    stream.reset(index)
  }
  if (stream.matchDigit(false)) {
    let type = TokenType.IntegerLiteral
    stream.startSpan()
    while (stream.matchDigit(true) || stream.match('_', true));
    if (stream.match(TokenType.Period.literal, true)) {
      if (stream.hasMore()) {
        type = TokenType.DoubleLiteral
        while (stream.matchDigit(true) || stream.match('_', true));
      } else {
        stream.reset(stream.getPosition() - 1)
      }
    }
    // 调整类型判断顺序
    if (stream.matchAny(['b', 'B'], true)) {
      if (type === TokenType.DoubleLiteral) {
        throw new ParseException('Byte literal can not have a decimal point.', stream.endSpan())
      }
      type = TokenType.ByteLiteral
    } else if (stream.matchAny(['s', 'S'], true)) {
      if (type === TokenType.DoubleLiteral) {
        throw new ParseException('Short literal can not have a decimal point.', stream.endSpan())
      }
      type = TokenType.ShortLiteral
    } else if (stream.matchAny(['l', 'L'], true)) {
      if (type === TokenType.DoubleLiteral) {
        throw new ParseException('Long literal can not have a decimal point.', stream.endSpan())
      }
      type = TokenType.LongLiteral
    } else if (stream.matchAny(['f', 'F'], true)) {
      type = TokenType.FloatLiteral
    } else if (stream.matchAny(['d', 'D'], true)) {
      type = TokenType.DoubleLiteral
    } else if (stream.matchAny(['m', 'M'], true)) {
      type = TokenType.DecimalLiteral
    }
    tokens.push(new LiteralToken(type, stream.endSpan(), null))
    return true
  }
  return false
}

// 处理语言块 token（调整 Token 构造函数）
const tokenizerLanguage = (stream: CharacterStream, tokens: Token[]) => {
  if (stream.match('```', true)) {
    stream.startSpan()
    if (stream.matchIdentifierStart(true)) {
      while (stream.matchIdentifierPart(true));
      let language = stream.endSpan()
      tokens.push(new Token(TokenType.Language, language, null))  // 调整为基础 Token
      stream.startSpan()
      if (!stream.skipUntil('```')) {
        throw new ParseException('```需要以```结尾', stream.endSpan())
      }
      tokens.push(new Token(TokenType.Language, stream.endSpan(-3), null))
      return true
    } else {
      const startPos = stream.getPosition();
      const errorSpan = stream.getSpan(startPos, startPos + 1); // 指向下一个字符
      throw new ParseException('```后需要标识语言类型', errorSpan);
    }
  }
  return false
}

// 处理标识符 token（增加大小写不敏感判断）
const tokenizerIdentifier = (stream: CharacterStream, tokens: Token[]) => {
  if (stream.matchIdentifierStart(true)) {
    stream.startSpan()
    while (stream.matchIdentifierPart(true));
    let identifierSpan = stream.endSpan()
    identifierSpan = stream.getSpan(identifierSpan.getStart() - 1, identifierSpan.getEnd())
    const text = identifierSpan.getText()
    if (text === 'true' || text === 'false') {
      tokens.push(new LiteralToken(TokenType.BooleanLiteral, identifierSpan, null))
    } else if (text === 'null') {
      tokens.push(new LiteralToken(TokenType.NullLiteral, identifierSpan, null))
    } else if (text === 'instanceof') {  // 新增 instanceof 识别
      tokens.push(new Token(TokenType.InstanceOf, identifierSpan, null));
    } else if (TokenType.SqlAnd.literal.toUpperCase() === text.toUpperCase()) {  // 大小写不敏感
      tokens.push(new Token(TokenType.SqlAnd, identifierSpan, null))
    } else if (TokenType.SqlOr.literal.toUpperCase() === text.toUpperCase()) {  // 大小写不敏感
      tokens.push(new Token(TokenType.SqlOr, identifierSpan, null))
    } else {
      tokens.push(new Token(TokenType.Identifier, identifierSpan, null))
    }
    return true
  }
  return false
}

// 处理模板字符串 token（调整子 token 处理逻辑）
const tokenizerTemplateString = (stream: CharacterStream, tokens: Token[]) => {
  if (stream.match('`', true)) {
    let begin = stream.getPosition()
    let start = begin
    let matchedEndQuote = false;
    let subTokens: Token[] = []
    while (stream.hasMore()) {
      if (stream.match('\\', true)) {
        stream.consume()
        continue
      }
      if (stream.match('`', true)) {
        matchedEndQuote = true;
        break
      }
      if (stream.match('${', true)) {
        let end = stream.getPosition()
        if (start < end - 2) {
          subTokens.push(new LiteralToken(TokenType.StringLiteral, stream.endSpan(start, end - 2), null))
        }
        subTokens.push(...tokenizer(stream, [], '}'))  // 递归处理子 token
        start = stream.getPosition()
        continue
      }
      stream.consume()
    }
    if (!matchedEndQuote) {
      throw new ParseException('模板字符串未闭合', stream.getSpan(begin - 1, stream.getPosition()))
    }
    let stringSpan = stream.endSpan(begin, stream.getPosition())
    let end = stream.getPosition() - 1
    if (end - start > 0) {
      subTokens.push(new LiteralToken(TokenType.StringLiteral, stream.endSpan(start, end), null))
    }
    stringSpan = stream.getSpan(stringSpan.getStart() - 1, stringSpan.getEnd())
    tokens.push(new LiteralToken(TokenType.StringLiteral, stringSpan, new TokenStream(subTokens)))
    return true
  }
  return false
}

// 主 tokenizer 函数（优化循环和匹配逻辑）
const tokenizer = (stream: CharacterStream, tokens: Token[], except: string | null) => {
  let leftCount = 0
  let rightCount = 0
  while (stream.hasMore()) {
    stream.skipWhiteSpace()
    if (except && stream.match(except, true)) {
      return tokens
    }
    // 处理注释
    if (stream.match('//', true)) {
      stream.skipLine()
      continue
    }
    if (stream.match('/*', true)) {
      stream.skipUntil('*/')
      continue
    }
    // 按优先级处理各类 token
    if (
      tokenizerNumber(stream, tokens) ||
      tokenizerString(stream, TokenType.SingleQuote, tokens) ||
      tokenizerString(stream, TokenType.TripleQuote, tokens) ||
      tokenizerString(stream, TokenType.DoubleQuote, tokens) ||
      regexpToken(stream, tokens) ||
      tokenizerLanguage(stream, tokens) ||
      tokenizerTemplateString(stream, tokens) ||
      tokenizerIdentifier(stream, tokens)
    ) {
      continue
    }
    // 处理 lambda 表达式
    if (stream.matchAny(['=>', '->'], true)) {
      tokens.push(new Token(TokenType.Lambda, stream.getSpan(stream.getPosition() - 2, stream.getPosition()), null))
      continue
    }
    // 处理其他符号 token
    let matched = false
    const sortedTokens = TokenType.getSortedValues()
    for (let i = 0, len = sortedTokens.length; i < len; i++) {
      const t = sortedTokens[i]
      if (t.literal != null && stream.match(t.literal, true)) {
        if (t === TokenType.LeftCurly) {
          leftCount++
        }
        tokens.push(new Token(t, stream.getSpan(stream.getPosition() - t.literal.length, stream.getPosition()), null))
        matched = true
        break
      }
    }
    if (matched) {
      continue
    }
    // 处理右花括号特殊情况
    if (leftCount !== rightCount && stream.match('}', true)) {
      rightCount++
      tokens.push(new Token(TokenType.RightCurly, stream.getSpan(stream.getPosition() - 1, stream.getPosition()), null))
      continue
    }
    // 未知 token 异常
    if (stream.hasMore()) {
      throw new ParseException('Unknown token', stream.getSpan(stream.getPosition(), stream.getPosition() + 1))
    }
  }
  return tokens
}

export default (source: string) => {
  return tokenizer(new CharacterStream(source, 0, source.length), [], null)
}