import { ReactWidget } from '../widgets/react-widget';
import { IStatusBarService } from './statusbar-types';
import { HoverService } from '../hover-service';
/**
 * 状态栏业务处理类
 */
export declare class StatusBarWidget extends ReactWidget {
    private readonly service;
    private readonly hoverService;
    private items;
    private disposables;
    private testProgressUpdater?;
    private progressTimer?;
    private currentProgress;
    constructor(service: IStatusBarService, hoverService: HoverService);
    protected init(): void;
    protected debouncedUpdate: import("lodash").DebouncedFunc<() => void>;
    private registerTestItems;
    private handleItemClick;
    protected render(): React.ReactNode;
    /** 启动进度模拟 */
    private startProgress;
    /** 停止进度模拟 */
    private stopProgress;
    /**
     * 重写销毁方法，清理所有资源
     * 会在组件被销毁时（如从 DockPanel 中移除）自动调用
     */
    dispose(): void;
}
