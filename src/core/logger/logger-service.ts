import { LogLevel, LoggerConfig, LogEvent, Appender } from './logger-types';
import { LogManager } from './logger-manager';

/** 日志器类（类似Log4j的Logger） */
export class Logger {
  private name: string;
  private level: LogLevel;
  private appenders: Appender[];

  constructor(name: string, config: LoggerConfig) {
    this.name = name;
    this.level = config.level;
    this.appenders = config.appenders || [];
  }

  /** 更新日志级别 */
  updateLevel(level: LogLevel): void {
    this.level = level;
  }

  /** 更新输出器 */
  updateAppenders(appenders: Appender[]): void {
    this.appenders = appenders;
  }

  /** 判断日志级别是否启用 */
  private isEnabled(level: LogLevel): boolean {
    return level <= this.level; // 注意：级别数值越小，优先级越高（OFF=0最高）
  }

  /** 输出日志到所有输出器 */
  private log(level: LogLevel, message: string, error?: Error): void {
    if (!this.isEnabled(level)) return;

    const event: LogEvent = {
      loggerName: this.name,
      level,
      message,
      timestamp: new Date(),
      error
    };

    this.appenders.forEach(appender => appender.append(event));
  }

  // 以下方法对应Log4j的日志级别方法
  fatal(message: string, error?: Error | any): void {
    this.log(LogLevel.FATAL, message, error);
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  trace(message: string): void {
    this.log(LogLevel.TRACE, message);
  }
}

// 全局快捷方法（类似Log4j的静态调用）
export const getLogger = (name: string): Logger => {
  return LogManager.getInstance().getLogger(name);
};