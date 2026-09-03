import { LogLevel, LoggerConfig, Appender } from './logger-types';
/** 日志器类（类似Log4j的Logger） */
export declare class Logger {
    private name;
    private level;
    private appenders;
    constructor(name: string, config: LoggerConfig);
    /** 更新日志级别 */
    updateLevel(level: LogLevel): void;
    /** 更新输出器 */
    updateAppenders(appenders: Appender[]): void;
    /** 判断日志级别是否启用 */
    private isEnabled;
    /**
     * 完善 log 方法：支持模板字符串 + 动态参数 + 错误对象自动识别
     * @param level 日志级别
     * @param messageOrPattern 日志消息或模板字符串（%s %d %j）
     * @param params 动态参数
     */
    private log;
    fatal(message: string, ...params: any[]): void;
    error(message: string, ...params: any[]): void;
    warn(message: string, ...params: any[]): void;
    info(message: string, ...params: any[]): void;
    debug(message: string, ...params: any[]): void;
    trace(message: string, ...params: any[]): void;
}
export declare const getLogger: (name: string) => Logger;
