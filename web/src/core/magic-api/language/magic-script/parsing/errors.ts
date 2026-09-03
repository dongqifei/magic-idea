/**
 * 语法错误增强器 - 提供更友好的错误提示
 */

import { Span, TokenType } from './index';

export interface EnhancedError {
  message: string;           // 用户友好的错误消息
  suggestion: string;        // 具体的修复建议
  span: Span;               // 错误位置
  severity: 'error' | 'warning'; // 错误级别
  code: string;             // 错误代码
}

export class ErrorEnhancer {
  /**
   * 增强错误信息，提供更友好的提示
   */
  static enhanceError(originalMessage: string, span: Span, context?: any): EnhancedError {
    const message = originalMessage.toLowerCase();
    
    // 根据错误类型进行分类处理
    if (message.includes('expected') && message.includes('but got')) {
      return this.enhanceSyntaxError(originalMessage, span, context);
    }
    
    // 专门处理变量名以数字开头的错误
    if (message.includes('变量名') && message.includes('不能定义')) {
      return this.enhanceVariableNameError(originalMessage, span, context);
    }
    
    // 处理对象字面量中的语法错误
    if (this.isObjectLiteralError(message, context)) {
      return this.enhanceObjectLiteralError(originalMessage, span, context);
    }
    
    if (message.includes('identifier') || message.includes('变量名')) {
      return this.enhanceIdentifierError(originalMessage, span, context);
    }
    
    if (message.includes('字符串') || message.includes('string')) {
      return this.enhanceStringError(originalMessage, span, context);
    }
    
    if (message.includes('括号') || message.includes('bracket')) {
      return this.enhanceBracketError(originalMessage, span, context);
    }
    
    if (message.includes('关键字') || message.includes('keyword')) {
      return this.enhanceKeywordError(originalMessage, span, context);
    }
    
    if (message.includes('linq')) {
      return this.enhanceLinqError(originalMessage, span, context);
    }
    
    // 默认错误处理
    return this.createDefaultError(originalMessage, span);
  }

  /**
   * 判断是否为对象字面量错误
   */
  private static isObjectLiteralError(message: string, context?: any): boolean {
    // 检查是否在对象字面量上下文中出现语法错误
    return (message.includes('literal cannot be used alone') && 
            message.includes('期望变量、字段、映射、数组、函数或方法调用')) ||
           (context && context.inObjectLiteral);
  }

  /**
   * 增强对象字面量错误
   */
  private static enhanceObjectLiteralError(message: string, span: Span, context?: any): EnhancedError {
    // 分析具体的错误模式
    if (message.includes('literal cannot be used alone')) {
      return {
        message: "对象字面量数字或字面量不能单独出现在键值对中",
        suggestion: "请检查对象字面量的格式是否正确。每个键值对应该是 '键: 值' 的形式，多个键值对之间用逗号分隔。",
        span,
        severity: 'error',
        code: 'OBJECT_LITERAL_SYNTAX'
      };
    }

    if (message.includes('期望变量、字段、映射、数组、函数或方法调用')) {
      return {
        message: "对象字面量结构错误",
        suggestion: "请检查对象字面量的结构：1. 确保每个键值对格式为 '键: 值' 2. 键值对之间用逗号分隔 3. 最后一个键值对后面不要加逗号 4. 检查是否有多余的符号或缺少必要的符号",
        span,
        severity: 'error',
        code: 'OBJECT_LITERAL_STRUCTURE'
      };
    }

    return {
      message: "对象字面量语法错误",
      suggestion: "对象字面量应该遵循格式：{ 键1: 值1, 键2: 值2, ... }。请检查是否有语法错误。",
      span,
      severity: 'error',
      code: 'OBJECT_LITERAL_ERROR'
    };
  }

  /**
   * 增强语法错误
   */
  private static enhanceSyntaxError(message: string, span: Span, context?: any): EnhancedError {
    // 提取期望的内容和实际的内容
    const expectedMatch = message.match(/Expected ['"]([^'"]+)['"]/);
    const actualMatch = message.match(/but got ['"]([^'"]+)['"]/);
    
    const expected = expectedMatch ? expectedMatch[1] : '某个符号';
    const actual = actualMatch ? actualMatch[1] : '未知符号';
    
    return {
      message: `期望的是'${expected}'，但实际是'${actual}'`,
      suggestion: this.getSyntaxSuggestion(expected, actual, context),
      span,
      severity: 'error',
      code: 'SYNTAX_ERROR'
    };
  }

  /**
   * 增强标识符错误
   */
  private static enhanceIdentifierError(message: string, span: Span, context?: any): EnhancedError {
    return {
      message: "需要有效的标识符（变量名、函数名等）",
      suggestion: "请提供一个以字母或下划线开头的有效名称，不能使用数字开头或特殊字符",
      span,
      severity: 'error',
      code: 'IDENTIFIER_EXPECTED'
    };
  }

  /**
   * 增强字符串错误
   */
  private static enhanceStringError(message: string, span: Span, context?: any): EnhancedError {
    const quoteType = message.includes("'") ? "单引号" : message.includes('"') ? "双引号" : "引号";
    
    return {
      message: "字符串没有正确闭合",
      suggestion: `请检查字符串是否以${quoteType}正确结尾，多行字符串需要使用三引号"""`,
      span,
      severity: 'error',
      code: 'UNCLOSED_STRING'
    };
  }

  /**
   * 增强括号错误
   */
  private static enhanceBracketError(message: string, span: Span, context?: any): EnhancedError {
    const bracketTypes: Record<string, string> = {
      '(': '圆括号',
      '[': '方括号',
      '{': '花括号'
    };
    
    const bracketChar = context?.bracketType || '(';
    const bracketName = bracketTypes[bracketChar] || '括号';
    
    return {
      message: `${bracketName}没有正确闭合`,
      suggestion: `请检查每个${bracketName}都有对应的闭合符号`,
      span,
      severity: 'error',
      code: 'UNMATCHED_BRACKET'
    };
  }

  /**
   * 增强关键字错误
   */
  private static enhanceKeywordError(message: string, span: Span, context?: any): EnhancedError {
    const keywordMatch = message.match(/['"]([^'"]+)['"]/);
    const keyword = keywordMatch ? keywordMatch[1] : '该关键字';
    
    return {
      message: `'${keyword}'是保留关键字，不能用作变量名`,
      suggestion: "请选择其他名称，避免使用语言内置的关键字如：if, for, while, return等",
      span,
      severity: 'error',
      code: 'RESERVED_KEYWORD'
    };
  }

  /**
   * 增强变量名错误
   */
  private static enhanceVariableNameError(message: string, span: Span, context?: any): EnhancedError {
    // 提取变量名
    const variableMatch = message.match(/['"]([^'"]+)['"]/);
    const variableName = variableMatch ? variableMatch[1] : '该变量';
    
    // 检查变量名是否以数字开头
    if (/^\d/.test(variableName)) {
      return {
        message: `变量名'${variableName}'以数字开头，不符合命名规范`,
        suggestion: "变量名应以字母或下划线开头，不能以数字开头。请修改为有效的标识符，例如：var myVar = '123';",
        span,
        severity: 'error',
        code: 'INVALID_VARIABLE_NAME'
      };
    }
    
    // 检查是否是保留关键字
    const keywords = ['var', 'let', 'const', 'if', 'for', 'while', 'return', 'function', 'class'];
    if (keywords.includes(variableName)) {
      return {
        message: `'${variableName}'是保留关键字，不能用作变量名`,
        suggestion: "请选择其他名称，避免使用语言内置的关键字",
        span,
        severity: 'error',
        code: 'RESERVED_KEYWORD'
      };
    }
    
    // 默认变量名错误
    return {
      message: `变量名'${variableName}'不符合命名规范`,
      suggestion: "变量名只能包含字母、数字、下划线，且不能以数字开头。请修改为有效的标识符。",
      span,
      severity: 'error',
      code: 'INVALID_VARIABLE_NAME'
    };
  }

  /**
   * 增强LINQ错误
   */
  private static enhanceLinqError(message: string, span: Span, context?: any): EnhancedError {
    return {
      message: "LINQ查询语法不正确",
      suggestion: "LINQ查询应该遵循格式：from 变量 in 数据源 [where 条件] [select 表达式]",
      span,
      severity: 'error',
      code: 'LINQ_SYNTAX_ERROR'
    };
  }

  /**
   * 创建默认错误
   */
  private static createDefaultError(message: string, span: Span): EnhancedError {
    return {
      message: `${message}`,
      suggestion: "",
      span,
      severity: 'error',
      code: 'GENERIC_ERROR'
    };
  }

  /**
   * 获取语法建议
   */
  private static getSyntaxSuggestion(expected: string, actual: string, context?: any): string {
    const suggestions: Record<string, string> = {
      ',': "可能需要添加逗号分隔多个参数或元素",
      ';': "语句应该以分号结尾",
      '(': "函数调用或表达式需要括号",
      ')': "括号没有正确闭合",
      '{': "代码块需要花括号",
      '}': "花括号没有正确闭合",
      '=': "赋值操作需要使用等号",
      '==': "比较操作应该使用双等号或三等号",
      ':': "对象字面量中键值对应该使用冒号分隔"
    };

    // 如果是对象字面量上下文，提供更具体的建议
    if (context && context.inObjectLiteral) {
      const objectSuggestions: Record<string, string> = {
        ',': "对象字面量中键值对之间应该用逗号分隔",
        ':': "对象字面量中键和值之间应该用冒号分隔",
        '}': "对象字面量应该用花括号正确闭合",
        'identifier': "对象字面量的键应该是有效的标识符或字符串"
      };
      return objectSuggestions[expected] || suggestions[expected] || "请检查对象字面量的语法结构";
    }

    return suggestions[expected] || "请检查语法结构是否正确";
  }

  /**
   * 格式化错误位置信息
   */
  static formatErrorLocation(span: Span): string {
    const line = span.getLine();
    return `第${line.lineNumber}行，第${line.startCol}列`;
  }

  /**
   * 生成完整的错误报告
   */
  static generateErrorReport(errors: EnhancedError[]): string {
    if (errors.length === 0) {
      return "✅ 代码语法正确";
    }

    let report = `发现 ${errors.length} 个语法问题：\n\n`;
    
    errors.forEach((error, index) => {
      const location = this.formatErrorLocation(error.span);
      report += `${index + 1}. ${error.message}\n`;
      report += `   位置：${location}\n`;
      report += `   建议：${error.suggestion}\n`;
      report += `   代码：${error.code}\n\n`;
    });

    return report;
  }
}