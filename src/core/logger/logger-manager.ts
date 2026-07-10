import { LogLevel, LoggerConfig, Appender } from './logger-types';
import { Logger } from './logger-service';
import { ConsoleAppender } from './console-appender';

/** 日志管理器（类似LogManager） */
export class LogManager {
  private static instance: LogManager;
  private loggers = new Map<string, Logger>();
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    appenders: [new ConsoleAppender()]
  };

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  /** 配置全局日志 */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    // 若配置了新的输出器，更新已存在的日志器
    if (config.appenders) {
      this.loggers.forEach(logger => logger.updateAppenders(config.appenders!));
    }
    // 若配置了新的级别，更新已存在的日志器
    if (config.level !== undefined) {
      this.loggers.forEach(logger => logger.updateLevel(config.level!));
    }
  }

  /** 获取命名日志器（类似LogManager.getLogger(name)） */
  getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, new Logger(name, this.config));
    }
    return this.loggers.get(name)!;
  }

  /** 获取根日志器 */
  getRootLogger(): Logger {
    return this.getLogger('root');
  }
}