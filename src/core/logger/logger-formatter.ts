import { LogEvent, LogLevel } from "./logger-types";

/** 日志格式化工具 */
export class LogFormatter {
  /**
   * 格式化日志消息
   * @param format 格式字符串（如："%d{yyyy-MM-dd HH:mm:ss} [%c] %p - %m"）
   * @param event 日志事件
   */
  static format(format: string, event: LogEvent): string {
    let result = format;

    // 替换日期占位符 %d{pattern}
    const dateMatch = format.match(/%d\{(.*?)\}/);
    if (dateMatch) {
      const datePattern = dateMatch[1];
      result = result.replace(
        dateMatch[0],
        this.formatDate(event.timestamp, datePattern)
      );
    }

    // 替换日志器名称 %c
    result = result.replace(/%c/g, event.loggerName);

    // 替换日志级别 %p（转为大写）
    result = result.replace(/%p/g, LogLevel[event.level].toUpperCase());

    // 替换日志消息 %m
    result = result.replace(/%m/g, event.message);

    // 替换错误信息 %ex（如果有错误）
    if (event.error && format.includes("%ex")) {
      result = result.replace(
        /%ex/g,
        `\n${event.error.stack || event.error.message}`
      );
    } else {
      result = result.replace(/%ex/g, "");
    }

    return result;
  }

  /** 格式化日期 */
  private static formatDate(date: Date, pattern: string): string {
    const year = date.getFullYear();
    const month = this.pad(date.getMonth() + 1);
    const day = this.pad(date.getDate());
    const hours = this.pad(date.getHours());
    const minutes = this.pad(date.getMinutes());
    const seconds = this.pad(date.getSeconds());
    // 获取毫秒并补三位（000-999）
    const milliseconds = this.pad3(date.getMilliseconds());

    return pattern
      .replace("yyyy", year.toString())
      .replace("MM", month)
      .replace("dd", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds)
      .replace("SSS", milliseconds);
  }

  /** 数字补零 */
  private static pad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  private static pad3(num: number): string {
    return num.toString().padStart(3, "0");
  }
}
