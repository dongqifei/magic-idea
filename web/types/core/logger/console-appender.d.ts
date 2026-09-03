import { Appender, LogEvent } from './logger-types';
/** 控制台输出器（默认输出到控制台） */
export declare class ConsoleAppender implements Appender {
    private format?;
    name: string;
    private defaultFormat;
    constructor(format?: string);
    append(logEvent: LogEvent): void;
}
