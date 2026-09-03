/** 日志级别（与Log4j对应） */
export enum LogLevel {
  OFF = 0,    // 关闭所有日志
  FATAL = 100, // 致命错误
  ERROR = 200, // 错误
  WARN = 300,  // 警告
  INFO = 400,  // 信息
  DEBUG = 500, // 调试
  TRACE = 600  // 跟踪（最详细）
}

/** 日志配置接口 */
export interface LoggerConfig {
  level: LogLevel;         // 全局日志级别
  format?: string;         // 日志格式（支持占位符：%d{yyyy-MM-dd HH:mm:ss} %c %p - %m）
  appenders?: Appender[];  // 日志输出器（控制台、文件等）
}

/** 日志输出器接口（类似Log4j的Appender） */
export interface Appender {
  name: string;
  append(logEvent: LogEvent): void;
}

/** 日志事件对象 */
export interface LogEvent {
  loggerName: string;      // 日志器名称
  level: LogLevel;         // 日志级别
  message: string;         // 日志消息
  timestamp: Date;         // 时间戳
  error?: Error;           // 可选错误对象
}