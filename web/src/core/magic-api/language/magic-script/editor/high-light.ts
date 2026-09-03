/**
 * @file 高亮配置
 */
export const HighLightOptions = {
  // 内置函数列表，目前为空
  builtinFunctions: [],

  // 定义操作符
  operators: ['+', '-', '*', '/', '=', '==', '!=', '>', '<', '>=', '<='],

  // 定义符号
  symbols: /[=><!~?:&|+\-*/^%]+/,

  // 定义数字正则表达式
  digits: /\d+(_+\d+)*/,

  // 匹配二进制数字，允许包含下划线（如 0b1010_1010）
  binarydigits: /[0-1_]+/,

  // 匹配十六进制数字，允许包含下划线（如 0x1A2B_3C4D）
  hexdigits: /[[0-9a-fA-F_]+/,

  // 定义转义字符，如 \n, \t, \x1B, \u1234 等
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // 定义类型
  types: [
    'var',
    'const',
    'let',
    'Object',
    'Long',
    'String',
    'Double',
    'Float',
    'Integer',
    'Byte',
    'Pattern',
    'BigDecimal',
    'Boolean'
  ],

  // 定义系统关键字
  keywords: ['import', 'as', 'return', 'exit', 'try', 'catch', 'finally', 'throw', 'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'continue', 'break', 'null', 'true', 'false' ],

  // 匹配正则表达式中的控制字符，如 {}[]()$^|*+?.
  regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,

  // 匹配正则表达式中的转义字符，如 \b, \d, \n, \x1B 等
  regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

  // 定义 tokenizer
  tokenizer: {
    root: [
      // [/db\./, 'keywords'],
      [/\.[a-zA-Z_]\w*(?=\()/, 'function'],
      // 高亮数字
      [/(@digits)/, 'number'],
      [/\s+/, 'white'],
      [/```$/, { token: 'string', next: '@codeblock' }],
      // 高亮关键字，匹配标识符（变量名、函数名等）
      [
        /[a-zA-Z_$][\w$]*/,
        {
          cases: {
            // 如果是内置函数，标记为 'predefined' emphasis
            '@builtinFunctions': 'sys.function',
            '@types': 'keyword',
            '@keywords': 'sys.keyword',

            // 如果是关键字（如 instanceof, new, in 等），标记为 'keywords'
            '~(instanceof|new|in|async|asc|desc|ASC|DESC|assert|select|from|left|join|on|and|or|order|by|where|group|having|limit|)[\\s]?':
              { token: 'keyword' },
            // 如果是 SQL 关键字（如 SELECT, FROM, WHERE 等），标记为 'keywords'
            '~(select|from|left|join|on|and|or|order|by|where|group|having|limit|offset|SELECT|FROM|LEFT|JOIN|ON|AND|OR|ORDER|BY|WHERE|GROUP|HAVING|LIMIT|OFFSET)[\\s]{1}':
              { token: 'keywords' },
            '@default': 'identifier'
          }
        }
      ],

      // 匹配多行字符串开始符 """，标记为 'string'，并进入 '@string_multi_embedded' 状态
      [/"""/, { token: 'string', next: '@string_multi_embedded', nextEmbedded: 'mybatis' }],

      // 匹配双冒号语法（如 ::type），标记为 'keywords'
      [/::[a-zA-Z]+/, 'keyword'],

      // 匹配分号、逗号、点号，标记为 'delimiter'
      [/[;,.]/, 'delimiter'],

      // 高亮字符串
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // 非终止字符串
      [/'([^'\\]|\\.)*$/, 'string.invalid'], // 非终止字符串
      [/"/, 'string', '@string_double'], // 双引号字符串
      [/'/, 'string', '@string_single'], // 单引号字符串

      // 高亮注释
      [/\/\/.*$/, 'comment'], // 单行注释
      [/\/\*/, 'comment', '@comment'], // 多行注释

      // 匹配正则表达式，标记为 'regexp'，并进入 '@regexp' 状态
      [
        /\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/,
        { token: 'regexp', bracket: '@open', next: '@regexp' }
      ],

      // 匹配未闭合的双引号字符串，标记为 'string.invalid'
      [/"([^"\\]|\\.)*$/, 'string.invalid'],

      // 匹配未闭合的单引号字符串，标记为 'string.invalid'
      [/'([^'\\]|\\.)*$/, 'string.invalid'],

      // 匹配双引号字符串开始符 "，标记为 'string'，并进入 '@string_double' 状态
      [/"/, 'string', '@string_double'],

      // 匹配单引号字符串开始符 '，标记为 'string'，并进入 '@string_single' 状态
      [/'/, 'string', '@string_single'],

      // 匹配反引号字符串开始符 `，标记为 'string'，并进入 '@string_backtick' 状态
      [/`/, 'string', '@string_backtick'],

      // 高亮操作符和符号
      [/@symbols/, 'operator']
    ],

    // 多行注释
    comment: [
      [/\*\//, 'comment', '@pop'],
      [/[^/*]+/, 'comment'],
      [/[/\*]/, 'comment']
    ],

    // 代码块
    codeblock: [
      [/^```$/, { token: 'string', next: '@pop' }],
      [/.*$/, 'variable.source']
    ],

    // 正则表达式的解析规则
    regexp: [
      // 匹配正则表达式中的量词（如 {1,3}），标记为 'regexp.escape.control'
      [/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],

      // 匹配正则表达式中的字符集（如 [a-z]），标记为 'regexp.escape.control'
      [
        /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
        ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]
      ],

      // 匹配正则表达式中的非捕获组（如 (?:...)），标记为 'regexp.escape.control'
      [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],

      // 匹配正则表达式中的括号，标记为 'regexp.escape.control'
      [/[()]/, 'regexp.escape.control'],

      // 匹配正则表达式中的控制字符，标记为 'regexp.escape.control'
      [/@regexpctl/, 'regexp.escape.control'],

      // 匹配正则表达式中的普通字符，标记为 'regexp'
      [/[^\\\/]/, 'regexp'],

      // 匹配正则表达式中的转义字符，标记为 'regexp.escape'
      [/@regexpesc/, 'regexp.escape'],

      // 匹配无效的正则表达式转义字符，标记为 'regexp.invalid'
      [/\\\./, 'regexp.invalid'],

      // 匹配正则表达式结束符 /，标记为 'regexp'，并退出 '@regexp' 状态
      [/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']]
    ],

    // 正则表达式字符集的解析规则
    regexrange: [
      // 匹配字符集中的连字符 -，标记为 'regexp.escape.control'
      [/-/, 'regexp.escape.control'],

      // 匹配字符集中的 ^，标记为 'regexp.invalid'
      [/\^/, 'regexp.invalid'],

      // 匹配字符集中的转义字符，标记为 'regexp.escape'
      [/@regexpesc/, 'regexp.escape'],

      // 匹配字符集中的普通字符，标记为 'regexp'
      [/[^\]]/, 'regexp'],

      // 匹配字符集结束符 ]，标记为 'regexp.escape.control'，并退出 '@regexrange' 状态
      [
        /\]/,
        {
          token: 'regexp.escape.control',
          next: '@pop',
          bracket: '@close'
        }
      ]
    ],

    // 多行字符串的解析规则
    string_multi_embedded: [
      // 匹配多行字符串中的内容
      [/[^"]+/, ''],

      // 匹配多行字符串结束符 """，标记为 'string'，并退出 '@string_multi_embedded' 状态
      ['"""', { token: 'string', next: '@pop', nextEmbedded: '@pop' }]
    ],

    // 双引号字符串
    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    // 单引号字符串
    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop']
    ],

    // 反引号字符串的解析规则
    string_backtick: [
      // 匹配反引号字符串中的 ${，标记为 'delimiter.bracket'，并进入 '@bracketCounting' 状态
      [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],

      // 匹配反引号字符串中的内容，标记为 'string'
      [/[^\\`$]+/, 'string'],

      // 匹配反引号字符串中的转义字符，标记为 'string.escape'
      [/@escapes/, 'string.escape'],

      // 匹配无效的转义字符，标记为 'string.escape.invalid'
      [/\\./, 'string.escape.invalid'],

      // 匹配反引号字符串结束符 `，标记为 'string'，并退出 '@string_backtick' 状态
      [/`/, 'string', '@pop']
    ],

    // 括号计数的解析规则
    bracketCounting: [
      // 匹配左括号 {，标记为 'delimiter.bracket'，并递归进入 '@bracketCounting' 状态
      [/\{/, 'delimiter.bracket', '@bracketCounting'],

      // 匹配右括号 }，标记为 'delimiter.bracket'，并退出 '@bracketCounting' 状态
      [/\}/, 'delimiter.bracket', '@pop'],

      // 包含根规则，继续解析其他内容
      { include: 'root' }
    ]
  }
}
