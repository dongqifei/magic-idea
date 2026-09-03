import { Signal } from "@lumino/signaling";
import { CommandRegistry } from "@lumino/commands";
import { MenuManager, MenuOptions, MenuItem, MenuContribution } from "./menu-types";
import { NotificationService } from "../../notification/notification-service";
import { ContributionProvider } from "../../common/contribution-provider";
export declare class DefaultMenuManager implements MenuManager {
    private commands;
    private notificationService;
    protected readonly contributions: ContributionProvider<MenuContribution>;
    private menus;
    private menuChanged;
    constructor(commands: CommandRegistry, notificationService: NotificationService, contributions: ContributionProvider<MenuContribution>);
    get onMenuChanged(): Signal<this, void>;
    onStart(): void;
    registerDefaultMenus(): void;
    registerMenu(menu: MenuOptions): void;
    unregisterMenu(menuId: string): void;
    /** 获取所有处理过分分组和分隔符的菜单 */
    getMenus(): MenuOptions[];
    /** 获取处理过分组和分隔符的单个菜单 */
    getMenu(menuId: string): MenuOptions | undefined;
    /** 处理菜单项：过滤不可见项、按分组排序、插入分隔符 */
    private processMenuItems;
    private groupAndSortItems;
    /** 向指定菜单添加项（按group和order自动排序） */
    addMenuItem(menuId: string, item: MenuItem & {
        group?: string;
        when?: string;
    }): void;
    /** 移除菜单项（通过匹配函数定位） */
    removeMenuItem(menuId: string, predicate: (item: MenuItem) => boolean): void;
    /** 解析可见性条件表达式（简化实现） */
    evaluateWhen(expression: string, commands: CommandRegistry): boolean;
    private triggerChange;
    private isMenuVisible;
}
