import { LogEvent } from "./logger-types";
/** 日志格式化工具 */
export declare class LogFormatter {
    /**
     * 格式化日志消息
     * @param format 格式字符串（如："%d{yyyy-MM-dd HH:mm:ss} [%c] %p - %m"）
     * @param event 日志事件
     */
    static format(format: string, event: LogEvent): string;
    /** 格式化日期 */
    private static formatDate;
    /** 数字补零 */
    private static pad;
    private static pad3;
}
