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
    return level <= this.level; // 数值越小优先级越高 OFF=0
  }

  /**
   * 完善 log 方法：支持模板字符串 + 动态参数 + 错误对象自动识别
   * @param level 日志级别
   * @param messageOrPattern 日志消息或模板字符串（%s %d %j）
   * @param params 动态参数
   */
  private log(level: LogLevel, messageOrPattern: string, ...params: any[]): void {
    if (!this.isEnabled(level)) return;

    let message = messageOrPattern;
    let error: Error | undefined = undefined;

    // 1. 从参数中提取 Error 对象（支持最后一个参数是 Error）
    if (params.length > 0) {
      const lastParam = params[params.length - 1];
      if (lastParam instanceof Error) {
        error = lastParam;
        params = params.slice(0, -1); // 移除错误参数，不参与模板替换
      }
    }

    // 2. 模板替换：支持 %s(字符串)、%d(数字)、%j(JSON)
    let paramIndex = 0;
    message = message.replace(/%[sdj]/g, (match) => {
      if (paramIndex >= params.length) return match;
      const param = params[paramIndex++];
      switch (match) {
        case '%s': return String(param);
        case '%d': return Number.isNaN(Number(param)) ? 'NaN' : String(param);
        case '%j': return JSON.stringify(param);
        default: return match;
      }
    });

    // 3. 剩余参数直接拼接（兼容 console.log 风格）
    if (paramIndex < params.length) {
      const restParams = params
        .slice(paramIndex)
        .map(p => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
        .join(' ');
      if (restParams) message += ' ' + restParams;
    }

    // 4. 构造日志事件
    const event: LogEvent = {
      loggerName: this.name,
      level,
      message: message.trim(),
      timestamp: new Date(),
      error
    };

    // 5. 输出到所有 appender
    this.appenders.forEach(appender => appender.append(event));
  }

  // ========== 统一日志方法，全部支持动态参数 ==========
  fatal(message: string, ...params: any[]): void {
    this.log(LogLevel.FATAL, message, ...params);
  }

  error(message: string, ...params: any[]): void {
    this.log(LogLevel.ERROR, message, ...params);
  }

  warn(message: string, ...params: any[]): void {
    this.log(LogLevel.WARN, message, ...params);
  }

  info(message: string, ...params: any[]): void {
    this.log(LogLevel.INFO, message, ...params);
  }

  debug(message: string, ...params: any[]): void {
    this.log(LogLevel.DEBUG, message, ...params);
  }

  trace(message: string, ...params: any[]): void {
    this.log(LogLevel.TRACE, message, ...params);
  }
}

// 全局快捷方法
export const getLogger = (name: string): Logger => {
  return LogManager.getInstance().getLogger(name);
};

// const logger = getLogger('app');
// // 1. 普通日志
// logger.info('服务启动成功');

// // 2. 模板占位符（%s 字符串 %d 数字 %j JSON）
// logger.info('用户ID：%d，用户名：%s，信息：%j', 1001, '张三', { age: 20 });

// // 3. 多参数直接打印（自动拼接）
// logger.debug('当前配置', { port: 3000 }, '模式：', 'development');

// // 4. 自动捕获错误（最后一个参数是 Error 即可）
// logger.error('数据库连接失败', new Error('连接超时'));

// // 5. 混合使用
// logger.error('请求%s失败，状态码：%d', '/api/user', 500, new Error('服务器异常'));