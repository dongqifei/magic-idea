import { Panel, StackedPanel, Widget, SplitPanel, FocusTracker } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import { ActivityHandle, ActivityOptions } from './nav-activity-type';
import { ToolbarService } from '../shell/toolbar/toolbar-types';
/**
 * 统一的布局状态接口
 */
export interface LayoutState {
    activities: {
        left: {
            top: string | null;
            bottom: string | null;
        };
        right: {
            top: string | null;
            bottom: string | null;
        };
        bottom: string | null;
    };
    panels: {
        left: {
            visible: boolean;
            ratio: number;
        };
        right: {
            visible: boolean;
            ratio: number;
        };
        bottom: {
            visible: boolean;
            ratio: number;
        };
    };
    lastActiveActivity: {
        left: string | null;
        right: string | null;
        bottom: string | null;
    };
}
/**
 * 重构后的 ActivityManager
 * 职责清晰，支持布局状态持久化 + 命令同步活动显示
 */
export declare class ActivityManager {
    private leftSidePanel;
    private rightSidePanel;
    private leftStack;
    private rightStack;
    private bottomStack;
    private leftTopBar;
    private leftBottomBar;
    private rightTopBar;
    private rightBottomBar;
    private tracker;
    private activities;
    private layoutState;
    private activitiesByRegion;
    private topContentMain;
    private mainPanel;
    commands: CommandRegistry;
    readonly activityOpened: Signal<this, {
        id: string;
        region: string;
    }>;
    readonly activityClosed: Signal<this, {
        id: string;
        region: string;
    }>;
    readonly regionActivated: Signal<this, {
        region: string;
        active: boolean;
    }>;
    private readonly toolbarService;
    constructor(sideBarLeft: Panel | null, sideBarRight: Panel | null, leftContentPanel: StackedPanel | null, rightContentPanel: StackedPanel | null, bottomContentPanel: StackedPanel | null, topContentMain: SplitPanel | null, mainPanel: SplitPanel | null, commands: CommandRegistry, tracker: FocusTracker<Widget>, toolbarService: ToolbarService);
    /**
     * 根据布局状态初始化面板可见性
     */
    private initializePanelVisibilityFromLayout;
    /**
     * 重构：设置面板命令（同步控制活动显示）
     */
    private setupPanelCommands;
    /**
     * 重构：切换面板（同步控制活动显示）
     */
    private togglePanelWithActivity;
    /**
     * 重构：显示面板 + 自动打开活动（优先最后打开的，无则默认第一个）
     */
    private showPanelWithActivity;
    /**
     * 重构：隐藏面板 + 同步隐藏区域内所有活动
     */
    private hidePanelWithActivity;
    /**
     * 连接分割面板事件
     */
    private wireSplitPanelEvents;
    /**
     * 切换面板显示/隐藏
     */
    private togglePanel;
    /**
     * 显示面板（仅控制面板，不同步活动）
     */
    private showPanel;
    /**
     * 隐藏面板（仅控制面板，不同步活动）
     */
    private hidePanel;
    /**
     * 设置面板可见性
     */
    private setPanelVisibility;
    /**
     * 切换水平面板
     */
    private toggleHorizontalPanel;
    /**
     * 切换垂直面板
     */
    private toggleVerticalPanel;
    /**
     * 计算布局比例
     */
    private calculateLayout;
    /**
     * 更新面板比例
     */
    private updatePanelRatio;
    /**
     * 获取面板状态
     */
    getPanelState(): {
        left: {
            visible: boolean;
            ratio: number;
        };
        right: {
            visible: boolean;
            ratio: number;
        };
        bottom: {
            visible: boolean;
            ratio: number;
        };
    };
    /**
     * 设置面板状态
     */
    setPanelState(state: LayoutState['panels']): void;
    /**
     * 应用面板状态
     */
    private applyPanelState;
    /**
     * 注册活动（按区域分类存储）
     */
    registerActivity(options: ActivityOptions): ActivityHandle;
    /**
     * 获取当前布局状态
     */
    getLayoutState(): LayoutState;
    /**
     * 设置布局状态
     */
    setLayoutState(state: LayoutState): void;
    /**
     * 打开特定活动（更新最后打开的活动记录）
     */
    openActivity(id: string): boolean;
    /**
     * 关闭特定活动（如果关闭的是最后打开的活动，自动切换到下一个）
     */
    closeActivity(id: string): boolean;
    /**
     * 初始化 TabBar
     */
    private initializeTabBars;
    /**
     * 连接 TabBar 事件
     */
    private wireTabBarPair;
    /**
     * 连接单个 TabBar 事件
     */
    private wireTabBar;
    /**
     * 验证活动选项
     */
    private validateActivityOptions;
    /**
     * 解析位置配置
     */
    private parseLocation;
    /**
     * 创建活动条目
     */
    private createActivityEntry;
    /**
     * 添加到内容面板
     */
    private addToContentStack;
    /**
     * 添加到 TabBar
     */
    private addToTabBar;
    /**
     * 创建活动句柄
     */
    private createActivityHandle;
    /**
     * 处理标签激活（更新最后打开的活动记录）
     */
    private handleTabActivation;
    /**
     * 显示活动
     */
    private showActivity;
    /**
     * 隐藏活动
     */
    private hideActivity;
    /**
     * 隐藏同区域的其他活动
     */
    private hideOtherActivitiesInStack;
    /**
     * 加载布局状态（同步 activitiesByRegion）
     */
    private loadLayoutState;
    /**
     * 保存布局状态
     */
    private saveLayoutState;
    /**
     * 应用布局状态
     */
    private applyLayoutState;
    /**
     * 同步 activitiesByRegion（从所有活动中按区域分类）
     */
    private syncActivitiesByRegion;
    /**
     * 清除所有 TabBar 的选中状态
     */
    private clearAllTabBarSelections;
    /**
     * 更新活动布局状态
     */
    private updateActivityLayoutState;
    /**
     * 初始化活动内容
     */
    private initializeActivity;
    /**
     * 获取活动的工具栏配置（仅从插件注册的 ActivityOptions 中读取）
     */
    private getActivityToolbarConfig;
    /**
     * 设置活动徽章
     */
    private setActivityBadge;
    /**
     * 设置标签 DOM
     */
    private setupTabDom;
    /**
     * 确保徽章节点存在
     */
    private ensureBadgeNode;
    /**
     * 查找标签节点
     */
    private findTabNode;
    /**
     * 通过标题查找条目
     */
    private findEntryByTitle;
    /**
     * 获取条目对应的区域
     */
    private getRegionForEntry;
    /**
     * 获取条目对应的内容面板
     */
    private getContentStackForEntry;
    /**
     * 获取条目对应的 TabBar
     */
    private getTabBarForEntry;
    /**
     * 在面板中查找 TabBar
     */
    private findTabBarsInPanel;
    /**
     * 更新区域激活状态
     */
    private updateRegionActivation;
}
