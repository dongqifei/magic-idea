import { injectable, inject, postConstruct, named } from "inversify";
import { Signal } from "@lumino/signaling";
import { CommandRegistry } from "@lumino/commands";
import { MenuManager, MenuOptions, MenuItem, MenuContribution } from "./menu-types";
import { NotificationService } from "../../notification/notification-service";
import { ContributionProvider } from "../../common/contribution-provider";

@injectable()
export class DefaultMenuManager implements MenuManager {
  private menus = new Map<string, MenuOptions>();
  private menuChanged = new Signal<this, void>(this);

  constructor(
    @inject(CommandRegistry) private commands: CommandRegistry,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(ContributionProvider)
    @named(MenuContribution)
    protected readonly contributions: ContributionProvider<MenuContribution>
  ) {}

  // 提供信号供外部监听
  get onMenuChanged(): Signal<this, void> {
    return this.menuChanged;
  }

  onStart(): void {
    for (const contrib of this.contributions.getContributions()) {
      contrib.registerMenus(this);
    }
  }

  @postConstruct()
  registerDefaultMenus(): void {
    // 退出
    this.commands.addCommand("editor:exit", {
      label: "退出",
      execute: () => {
        console.log("退出");
      },
    });

    
    // 文件菜单（文件操作全流程）
    this.registerMenu({
      id: "file",
      label: "文件",
      items: [
        { type: "command", commandId: "editor:exit", group: "file.operation@100" }, // 退出操作
      ],
    });

    // 文件菜单（文件操作全流程）
    this.registerMenu({
      id: "edit",
      label: "编辑",
      items: [
        { type: "command", commandId: "view:search-file", group: "view@30" },
      ],
    });

    // 查看菜单（视图控制与布局）
    this.registerMenu({
      id: "view",
      label: "查看",
      items: [
        { type: "command", commandId: "editor.action.quickCommand", group: "view.quick@10" }, // 快捷操作
        { type: "command", commandId: "view.open-view", group: "view.quick@20" },
        { type: "command", commandId: "view:magic-api-explorer", group: "view.top-left@40" }, // 左上角区域
        { type: "command", commandId: "view:file-explorer", group: "view.top-left@50" },
        { type: "command", commandId: "view:search-file", group: "view.top-left@60" },
        { type: "command", commandId: "view:extensions", group: "view.top-left@70" },
        { type: "command", commandId: "view:magic-chat", group: "view.side@90" }, // 侧边区域
        { type: "command", commandId: "view:run", group: "view.bottom-left@110" }, // 左下区域
        { type: "command", commandId: "view:debug", group: "view.bottom-left@120" },
        { type: "command", commandId: "view:problems", group: "view.bottom-left@130" },
        { type: "command", commandId: "view:logs-output", group: "view.bottom-left@130" },
        { type: "command", commandId: "view:property-config", group: "view.bottom-left@130" },
      ],
    });

    // 运行菜单（执行与调试流程）
    this.registerMenu({
      id: "run",
      label: "运行",
      items: [
        { type: "command", commandId: "debug:run", group: "debug@10" }, // 核心运行
        { type: "command", commandId: "debug:start", group: "debug@30" }, // 调试控制
        { type: "command", commandId: "debug.action.step", group: "debug-action@50" },
        { type: "command", commandId: "debug.action.continue", group: "debug-action@60" },
        { 
          type: "submenu",
          label: "断点管理",
          group: "debug@50", // 断点相关
          items: [
            { type: "command", commandId: "editor:breakpoint-enable-all", group: "breakpoint@10" },
            { type: "command", commandId: "editor:breakpoint-disable-all", group: "breakpoint@20" },
            { type: "command", commandId: "editor:breakpoint-remove-all", group: "breakpoint@30" },
          ],
        },
      ],
    });

    // 设置菜单（系统配置）
    this.registerMenu({
      id: "settings",
      label: "首选项",
      items: [
        { type: "command", commandId: "editor.action.quickCommand", group: "quick@10" }, // 快捷设置
        { type: "command", commandId: "editor:settings", group: "settings@30" }, // 通用设置
        { type: "command", commandId: "editor.theme.setting", group: "settings@40" }, // 外观设置
      ],
    });

    // 帮助菜单（辅助与系统信息）
    this.registerMenu({
      id: "help",
      label: "帮助",
      items: [
        { type: "command", commandId: "help:welcome", group: "guide@10" }, // 入门指南
        { type: "command", commandId: "help:documentation", group: "guide@20" }, // 文档
        { type: "command", commandId: "help:check-update", group: "system@60" }, // 系统更新
        { type: "command", commandId: "help:about", group: "system@70" }, // 关于信息
      ],
    });
  }

  registerMenu(menu: MenuOptions): void {
    if (this.menus.has(menu.id)) {
      console.warn(`Menu ${menu.id} already exists, overriding it`);
    }
    this.menus.set(menu.id, menu);

    this.triggerChange();
  }

  unregisterMenu(menuId: string): void {
    this.menus.delete(menuId);
    this.triggerChange();
  }

  /** 获取所有处理过分分组和分隔符的菜单 */
  getMenus(): MenuOptions[] {
    return Array.from(this.menus.values())
      .filter((menu) => this.isMenuVisible(menu))
      .map((menu) => this.processMenuItems(menu)); // 处理每个菜单的分组和分隔符
  }

  /** 获取处理过分组和分隔符的单个菜单 */
  getMenu(menuId: string): MenuOptions | undefined {
    const original = this.menus.get(menuId);
    if (!original || !this.isMenuVisible(original)) return undefined;
    return this.processMenuItems(original);
  }

  /** 处理菜单项：过滤不可见项、按分组排序、插入分隔符 */
  private processMenuItems(menu: MenuOptions): MenuOptions {
    // 1. 过滤不可见项（先为MenuItem扩展when字段类型定义）
    const visibleItems = menu.items.filter(
      (item) =>
        !("when" in item) ||
        this.evaluateWhen((item as any).when, this.commands)
    );

    // 2. 按分组和排序号排序
    const sortedItems = this.groupAndSortItems(visibleItems);

    // 3. 不同分组间插入分隔符
    const groupedItems: MenuItem[] = [];
    let lastGroup: string | null = null;

    sortedItems.forEach(({ item, group }) => {
      if (lastGroup && group !== lastGroup) {
        // 直接插入分隔符类型，避免使用特殊commandId
        groupedItems.push({ type: "separator" });
      }
      groupedItems.push(item);
      lastGroup = group;
    });

    return { ...menu, items: groupedItems };
  }

  // 辅助方法：按 group 分组并排序
  private groupAndSortItems(
    items: MenuItem[]
  ): Array<{ item: MenuItem; group: string }> {
    return items
      .map((item) => {
        // 解析 group（默认 other@100）
        const group =
          item.type === "command" && (item as any).group
            ? (item as any).group
            : "other@100";
        const [groupName, priority = "100"] = group.split("@");
        return {
          item,
          group: groupName,
          priority: Number(priority),
        };
      })
      .sort((a, b) => {
        // 先按组名排序，再按优先级排序
        // if (a.group !== b.group) {
        //   return a.group.localeCompare(b.group);
        // }
        return a.priority - b.priority;
      });
  }

  /** 向指定菜单添加项（按group和order自动排序） */
  addMenuItem(
    menuId: string,
    item: MenuItem & { group?: string; when?: string }
  ): void {
    const menu = this.menus.get(menuId);
    if (!menu) {
      throw new Error(`Menu ${menuId} does not exist`);
    }

    // 过滤不可见项
    if (item.when && !this.evaluateWhen(item.when, this.commands)) {
      return;
    }

    // 插入新项并按分组和排序号排序
    const allItems = [...menu.items, item];
    const sortedItems = this.groupAndSortItems(allItems);
    // 提取排序后的原始菜单项
    const newItems = sortedItems.map((i) => i.item);

    this.menus.set(menuId, { ...menu, items: newItems });
    this.triggerChange();
  }

  /** 移除菜单项（通过匹配函数定位） */
  removeMenuItem(menuId: string, predicate: (item: MenuItem) => boolean): void {
    const menu = this.menus.get(menuId);
    if (!menu) {
      throw new Error(`Menu ${menuId} does not exist`);
    }

    const newItems = menu.items.filter((item) => !predicate(item));
    this.menus.set(menuId, { ...menu, items: newItems });
    this.triggerChange();
  }

  /** 解析可见性条件表达式（简化实现） */
  evaluateWhen(expression: string, commands: CommandRegistry): boolean {
    // 实际项目中可使用表达式解析库增强功能
    try {
      // 示例：支持 `command:enabled(xxx)` 语法
      if (expression.startsWith("command:enabled(")) {
        const cmdId = expression.match(/command:enabled\((.*?)\)/)?.[1];
        return cmdId ? commands.isEnabled(cmdId) : false;
      }
      // 示例：支持 `editor:hasFocus` 等自定义条件
      if (expression === "editor:hasFocus") {
        return document.activeElement?.tagName === "TEXTAREA";
      }
      return true;
    } catch (e) {
      console.error("Failed to evaluate when expression:", e);
      return false;
    }
  }

  // 所有修改菜单的方法（registerMenu、addMenuItem等）执行后触发
  private triggerChange(): void {
    this.menuChanged.emit(void 0);
  }

  private isMenuVisible(menu: MenuOptions): boolean {
    return menu.isVisible ? menu.isVisible(this.commands) : true;
  }
}
