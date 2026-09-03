import { CommandRegistry } from "@lumino/commands";

/** 菜单项类型 */
export type MenuItem = 
  | { 
      type: 'command'; 
      commandId: string;
      /** 分组标识（同组内自动排序，不同组间加分隔符） */
      group: string;
      /** 可见性条件表达式 */
      when?: string;
    }
  | { type: 'separator' }
  | { 
      type: 'submenu'; 
      label: string; 
      items: MenuItem[]; 
      /** 分组标识（同组内自动排序，不同组间加分隔符） */
      group: string;
      /** 可见性条件表达式 */
      when?: string;
    };

/** 菜单配置项 */
export interface MenuOptions {
  /** 菜单唯一标识 */
  id: string;
  /** 菜单显示名称 */
  label: string;
  /** 菜单项集合 */
  items: MenuItem[];
  /** 快捷键索引（可选） */
  mnemonic?: number;
  /** 菜单可见性判断（可选） */
  isVisible?: (commands: CommandRegistry) => boolean;
}

/** 菜单管理器接口（增加分组相关方法） */
export const MenuManager = Symbol('MenuManager');
export interface MenuManager {
  onMenuChanged: import("@lumino/signaling").ISignal<this, void>;
  onStart(): void;
  /** 注册菜单 */
  registerMenu(menu: MenuOptions): void;
  /** 移除菜单 */
  unregisterMenu(menuId: string): void;
  /** 获取所有菜单（自动处理分组和分隔符） */
  getMenus(): MenuOptions[];
  /** 获取指定菜单（自动处理分组和分隔符） */
  getMenu(menuId: string): MenuOptions | undefined;
  /** 向指定菜单添加项（按group自动分组排序） */
  addMenuItem(menuId: string, item: MenuItem): void;
  /** 从指定菜单移除项 */
  removeMenuItem(menuId: string, predicate: (item: MenuItem) => boolean): void;
  /** 解析可见性条件表达式 */
  evaluateWhen(expression: string, commands: CommandRegistry): boolean;
}

export const MenuContribution = Symbol('MenuContribution');

/**
 * Representation of a menu contribution.
 *
 * Note that there are also convenience classes which combine multiple contributions into one.
 * For example to register a view together with a menu and keybinding you could use
 * {@link AbstractViewContribution} instead.
 *
 * ### Example usage
 *
 * ```ts
 * import { MenuContribution, MenuManager } from '@MagicIdea/core/shell';
 *
 * @injectable()
 * export class NewMenuContribution implements MenuContribution {
 *    
 *    registerMenus(menus: MenuManager): void {
 *      menus.addMenuItem("help", { type: "command", commandId: "help:about", group: "system@70" })
 *      menus.registerMenu({
 *         id: "help",
 *         label: "帮助",
 *         items: [
 *           { type: "command", commandId: "help:about", group: "system@70" }, // 关于信息
 *         ],
 *      });
 *    }
 * }
 * ```
 */
export interface MenuContribution {
  /**
   * Registers menus.
   * @param menus the menu model registry.
   */
  registerMenus(menus: MenuManager): void;
}