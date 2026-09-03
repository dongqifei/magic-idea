import { LoggerConfig } from './logger-types';
import { Logger } from './logger-service';
/** 日志管理器（类似LogManager） */
export declare class LogManager {
    private static instance;
    private loggers;
    private config;
    private constructor();
    /** 获取单例实例 */
    static getInstance(): LogManager;
    /** 配置全局日志 */
    configure(config: Partial<LoggerConfig>): void;
    /** 获取命名日志器（类似LogManager.getLogger(name)） */
    getLogger(name: string): Logger;
    /** 获取根日志器 */
    getRootLogger(): Logger;
}
