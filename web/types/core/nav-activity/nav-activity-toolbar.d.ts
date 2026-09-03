import { BoxPanel } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import { ActivityToolbarConfig, ToolbarItemConfig, ToolbarItemType } from './nav-activity-type';
/**
 * 活动栏工具栏组件（magic-idea 风格）
 */
export declare class ActivityToolbar extends BoxPanel {
    /** 工具栏配置 */
    private config;
    /** 命令注册器 */
    private commands;
    /** 工具项缓存 */
    private toolItems;
    /** 下拉菜单缓存 */
    private menus;
    constructor(config: ActivityToolbarConfig, commands: CommandRegistry);
    /**
     * 初始化工具栏
     */
    initialize(): void;
    /**
     * 动态添加工具项
     */
    addToolItem(item: ToolbarItemType, config: Omit<ToolbarItemConfig, 'type'>): void;
    /**
     * 动态移除工具项
     */
    removeToolItem(itemId: string): void;
    /**
     * 更新工具项状态
     */
    updateToolItem(itemId: string, updates: Partial<ToolbarItemConfig>): void;
    /**
     * 销毁组件
     */
    dispose(): void;
    /**
     * 添加标题组件
     */
    private addTitleWidget;
    /**
     * 获取选中状态（兼容同步/异步、值/函数类型）
     * @param item QuickPickItem 实例
     * @returns Promise<boolean> 选中状态（异步适配所有场景）
     */
    private getVisibleStatus;
    /**
     * 添加工具项（支持左右分区）
     */
    private addToolItems;
    /**
     * 创建工具按钮
     */
    private createToolButton;
    /**
     * 创建下拉菜单工具
     */
    private createToolDropdown;
    /**
     * 递归构建菜单项
     */
    private buildMenuItems;
}
