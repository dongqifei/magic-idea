import { Panel } from "@lumino/widgets";
import { CommandRegistry } from "@lumino/commands";
import { MenuManager } from "./menu-types";
export declare class MenubarWidget extends Panel {
    private commands;
    private menuManager;
    private disposables;
    private menuBar;
    constructor(commands: CommandRegistry, menuManager: MenuManager);
    /** 加载所有注册的菜单 */
    private loadMenus;
    /** 创建单个菜单（支持嵌套子菜单） */
    private createMenu;
    /** 更新菜单状态（启用/禁用等） */
    private updateMenuStates;
    /** 递归更新菜单状态 */
    private updateMenu;
    dispose(): void;
}
