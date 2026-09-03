import { IEvent } from '../common';
export type StatusBarAlignment = 'left' | 'right';
export type StatusBarItemType = 'text' | 'spinner' | 'progress' | 'custom' | 'button';
export interface StatusBarItemOptions {
    icon?: string;
    dot?: boolean;
    text?: string;
    alignment?: StatusBarAlignment;
    priority?: number;
    tooltip?: string;
    visible?: boolean;
    type?: StatusBarItemType;
    progress?: number;
    onClick?: (e: MouseEvent) => void;
    render?: () => any;
    [k: string]: any;
}
/**
 * 状态栏项配置项
 */
export interface StatusBarItem {
    id: string;
    options: StatusBarItemOptions;
}
/**
 * 状态栏服务接口
 */
export interface IStatusBarService {
    onDidChangeStatusBar: IEvent<any>;
    registerItem(id: string, options: StatusBarItemOptions): {
        dispose: () => void;
        update: (opts: Partial<StatusBarItemOptions>) => void;
    };
    removeItem(id: string): void;
    getItems(): StatusBarItem[];
}
/**
 * 状态栏接口
 */
export declare const IStatusBarService: unique symbol;
