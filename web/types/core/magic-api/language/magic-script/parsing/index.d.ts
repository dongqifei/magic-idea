declare class ParseException extends Error {
    constructor(message: any, span: any);
}
declare class Span {
    source: any;
    start: any;
    end: any;
    cachedText: string;
    line: any;
    constructor(source: any, start: any, end?: any);
    getText(): string;
    getSource(): any;
    getStart(): any;
    getEnd(): any;
    toString(): string;
    inPosition(position: any): boolean;
    getLine(): any;
}
declare const TokenType: {
    Spread: {
        literal: string;
        error: string;
    };
    Period: {
        literal: string;
        error: string;
    };
    QuestionPeriod: {
        literal: string;
        error: string;
    };
    Comma: {
        literal: string;
        error: string;
    };
    Semicolon: {
        literal: string;
        error: string;
    };
    Colon: {
        literal: string;
        error: string;
    };
    Plus: {
        literal: string;
        error: string;
    };
    Minus: {
        literal: string;
        error: string;
    };
    Asterisk: {
        literal: string;
        error: string;
    };
    ForwardSlash: {
        literal: string;
        error: string;
    };
    PostSlash: {
        literal: string;
        error: string;
    };
    Percentage: {
        literal: string;
        error: string;
    };
    LeftParantheses: {
        literal: string;
        error: string;
    };
    RightParantheses: {
        literal: string;
        error: string;
    };
    LeftBracket: {
        literal: string;
        error: string;
    };
    RightBracket: {
        literal: string;
        error: string;
    };
    LeftCurly: {
        literal: string;
        error: string;
    };
    RightCurly: {
        error: string;
    };
    Less: {
        literal: string;
        error: string;
    };
    Greater: {
        literal: string;
        error: string;
    };
    LessEqual: {
        literal: string;
        error: string;
    };
    GreaterEqual: {
        literal: string;
        error: string;
    };
    Equal: {
        literal: string;
        error: string;
    };
    NotEqual: {
        literal: string;
        error: string;
    };
    Assignment: {
        literal: string;
        error: string;
    };
    PlusPlus: {
        literal: string;
        error: string;
    };
    MinusMinus: {
        literal: string;
        error: string;
    };
    PlusEqual: {
        literal: string;
        error: string;
    };
    MinusEqual: {
        literal: string;
        error: string;
    };
    AsteriskEqual: {
        literal: string;
        error: string;
    };
    ForwardSlashEqual: {
        literal: string;
        error: string;
    };
    PercentEqual: {
        literal: string;
        error: string;
    };
    ColonColon: {
        literal: string;
        error: string;
    };
    EqualEqualEqual: {
        literal: string;
        error: string;
    };
    NotEqualEqual: {
        literal: string;
        error: string;
    };
    And: {
        literal: string;
        error: string;
    };
    Or: {
        literal: string;
        error: string;
    };
    Xor: {
        literal: string;
        error: string;
    };
    Not: {
        literal: string;
        error: string;
    };
    BitAnd: {
        literal: string;
        error: string;
    };
    BitOr: {
        literal: string;
        error: string;
    };
    BitNot: {
        literal: string;
        error: string;
    };
    LShift: {
        literal: string;
        error: string;
    };
    RShift: {
        literal: string;
        error: string;
    };
    RShift2: {
        literal: string;
        error: string;
    };
    XorEqual: {
        literal: string;
        error: string;
        modifiable: boolean;
    };
    BitAndEqual: {
        literal: string;
        error: string;
        modifiable: boolean;
    };
    BitOrEqual: {
        literal: string;
        error: string;
        modifiable: boolean;
    };
    LShiftEqual: {
        literal: string;
        error: string;
        modifiable: boolean;
    };
    RShiftEqual: {
        literal: string;
        error: string;
        modifiable: boolean;
    };
    RShift2Equal: {
        literal: string;
        error: string;
        modifiable: boolean;
    };
    SqlAnd: {
        literal: string;
        error: string;
    };
    SqlOr: {
        literal: string;
        error: string;
    };
    SqlNotEqual: {
        literal: string;
        error: string;
        inLinq: boolean;
    };
    InstanceOf: {
        literal: string;
        error: string;
    };
    Questionmark: {
        literal: string;
        error: string;
    };
    DoubleQuote: {
        literal: string;
        error: string;
    };
    TripleQuote: {
        literal: string;
        error: string;
    };
    SingleQuote: {
        literal: string;
        error: string;
    };
    Lambda: {
        error: string;
    };
    BooleanLiteral: {
        error: string;
    };
    DoubleLiteral: {
        error: string;
    };
    DecimalLiteral: {
        error: string;
    };
    FloatLiteral: {
        error: string;
    };
    LongLiteral: {
        error: string;
    };
    IntegerLiteral: {
        error: string;
    };
    ShortLiteral: {
        error: string;
    };
    ByteLiteral: {
        error: string;
    };
    CharacterLiteral: {
        error: string;
    };
    RegexpLiteral: {
        error: string;
    };
    StringLiteral: {
        error: string;
    };
    NullLiteral: {
        error: string;
    };
    Language: {
        error: string;
    };
    Identifier: {
        error: string;
    };
    Unknown: {
        error: string;
    };
};
declare class Token {
    constructor(tokenType: any, span: any, valueOrTokenStream: any);
    getTokenType(): any;
    getTokenStream(): any;
    getSpan(): any;
    getText(): any;
}
declare class LiteralToken extends Token {
    constructor(tokenType: any, span: any, valueOrTokenStream: any);
    getJavaType(): "java.lang.Integer" | "java.lang.String" | "java.lang.Double" | "java.lang.Float" | "java.lang.Byte" | "java.lang.Long" | "java.lang.Object" | "java.math.BigDecimal" | "java.lang.Boolean" | "java.util.regex.Pattern";
}
declare class CharacterStream {
    constructor(source: any, start: any, end: any);
    hasMore(): boolean;
    consume(): any;
    match(needle: any, consume: any): boolean;
    matchAny(strs: any, consume: any): boolean;
    matchDigit(consume: any): boolean;
    matchIdentifierStart(consume: any): boolean;
    matchIdentifierPart(consume: any): boolean;
    skipWhiteSpace(): void;
    getSpan(start: any, end: any): Span;
    skipLine(): void;
    skipUntil(chars: any): boolean;
    startSpan(): void;
    endSpan(offsetOrStart: any, end: any): Span;
    getPosition(): any;
    reset(position: any): void;
}
declare class TokenStream {
    constructor(tokens: any);
    getEnd(): any;
    hasMore(): boolean;
    hasNext(): boolean;
    makeIndex(): any;
    resetIndex(index: any): void;
    getToken(consume: any): any;
    consume(): any;
    next(): any;
    prev(): any;
    getPrev(): any;
    match(tokenOrText: any, consume: any, ignoreCase: any): boolean;
    textToString(tokenOrText: any): any;
    expect(text: any, ignoreCase: any): any;
    hasPrev(): boolean;
    getSource(): any;
}
export { Span, Token, TokenType, CharacterStream, TokenStream, LiteralToken, ParseException };
