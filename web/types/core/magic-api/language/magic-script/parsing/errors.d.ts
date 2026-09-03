/**
 * 语法错误增强器 - 提供更友好的错误提示
 */
import { Span } from './index';
export interface EnhancedError {
    message: string;
    suggestion: string;
    span: Span;
    severity: 'error' | 'warning';
    code: string;
}
export declare class ErrorEnhancer {
    /**
     * 增强错误信息，提供更友好的提示
     */
    static enhanceError(originalMessage: string, span: Span, context?: any): EnhancedError;
    /**
     * 判断是否为对象字面量错误
     */
    private static isObjectLiteralError;
    /**
     * 增强对象字面量错误
     */
    private static enhanceObjectLiteralError;
    /**
     * 增强语法错误
     */
    private static enhanceSyntaxError;
    /**
     * 增强标识符错误
     */
    private static enhanceIdentifierError;
    /**
     * 增强字符串错误
     */
    private static enhanceStringError;
    /**
     * 增强括号错误
     */
    private static enhanceBracketError;
    /**
     * 增强关键字错误
     */
    private static enhanceKeywordError;
    /**
     * 增强变量名错误
     */
    private static enhanceVariableNameError;
    /**
     * 增强LINQ错误
     */
    private static enhanceLinqError;
    /**
     * 创建默认错误
     */
    private static createDefaultError;
    /**
     * 获取语法建议
     */
    private static getSyntaxSuggestion;
    /**
     * 格式化错误位置信息
     */
    static formatErrorLocation(span: Span): string;
    /**
     * 生成完整的错误报告
     */
    static generateErrorReport(errors: EnhancedError[]): string;
}
