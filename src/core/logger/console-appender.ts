import { Appender, LogEvent, LogLevel } from './logger-types';
import { LogFormatter } from './logger-formatter';

/** 控制台输出器（默认输出到控制台） */
export class ConsoleAppender implements Appender {
  name = 'ConsoleAppender';
  private defaultFormat = '%d{yyyy-MM-dd HH:mm:ss.SSS} [%c] %p - %m';

  constructor(private format?: string) {}

  append(logEvent: LogEvent): void {
    const formattedMessage = LogFormatter.format(this.format || this.defaultFormat, logEvent);

    // 根据日志级别调用不同的控制台方法
    switch (logEvent.level) {
      case LogLevel.FATAL:
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}