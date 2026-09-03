/** 日志级别（与Log4j对应） */
export declare enum LogLevel {
    OFF = 0,// 关闭所有日志
    FATAL = 100,// 致命错误
    ERROR = 200,// 错误
    WARN = 300,// 警告
    INFO = 400,// 信息
    DEBUG = 500,// 调试
    TRACE = 600
}
/** 日志配置接口 */
export interface LoggerConfig {
    level: LogLevel;
    format?: string;
    appenders?: Appender[];
}
/** 日志输出器接口（类似Log4j的Appender） */
export interface Appender {
    name: string;
    append(logEvent: LogEvent): void;
}
/** 日志事件对象 */
export interface LogEvent {
    loggerName: string;
    level: LogLevel;
    message: string;
    timestamp: Date;
    error?: Error;
}
