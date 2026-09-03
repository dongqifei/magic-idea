import { IEvent, Emitter } from '../common';
import { StatusBarItem, IStatusBarService, StatusBarItemOptions } from './statusbar-types';
/**
 * 状态栏服务实现
 */
export declare class StatusBarServiceImpl implements IStatusBarService {
    private items;
    protected readonly onDidChangeStatusBarEmitter: Emitter<void>;
    get onDidChangeStatusBar(): IEvent<void>;
    /**
     * 发送状态栏变化事件
     */
    protected fireOnDidChangeStatusBar(): void;
    registerItem(id: string, options: StatusBarItemOptions): {
        dispose: () => void;
        update: (opts: Partial<StatusBarItemOptions>) => void;
    };
    removeItem(id: string): void;
    getItems(): StatusBarItem[];
}
