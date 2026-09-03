import { Widget, Panel, Menu, MenuBar } from "@lumino/widgets";
import { CommandRegistry } from "@lumino/commands";
import { MenuManager, MenuOptions } from "./menu-types";
import { DisposableCollection } from '../../common/disposable';

export class MenubarWidget extends Panel {
  private disposables = new DisposableCollection();
  private menuBar: MenuBar;
  
  constructor(
    private commands: CommandRegistry,
    private menuManager: MenuManager
  ) {
    super();
    this.id = "left-top-panel";
    this.menuBar = new MenuBar();
    
    // 添加logo
    const logo = new Widget();
    logo.addClass("magic-idea-icon");
    this.addWidget(logo);
    this.addWidget(this.menuBar);

    // 初始加载菜单
    this.loadMenus();

    // 监听菜单变化
    this.disposables.trackEvent(
      (cb) => this.menuManager.onMenuChanged.connect(cb),
      (cb) => this.menuManager.onMenuChanged.disconnect(cb),
      () => this.loadMenus()
    );

    // 监听命令变化更新菜单状态
    this.disposables.trackEvent(
      (cb) => this.commands.commandChanged.connect(cb),
      (cb) => this.commands.commandChanged.disconnect(cb),
      () => this.updateMenuStates()
    );
  }

  /** 加载所有注册的菜单 */
  private loadMenus(): void {
    this.menuBar.clearMenus();
    const menus = this.menuManager.getMenus();
    
    menus.forEach(menuOptions => {
      const menu = this.createMenu(menuOptions);
      this.menuBar.addMenu(menu);
    });
  }

  /** 创建单个菜单（支持嵌套子菜单） */
  private createMenu(menuOptions: MenuOptions): Menu {
    const menu = new Menu({ commands: this.commands });
    menu.title.label = menuOptions.label;
    menu.title.mnemonic = menuOptions.mnemonic || -1;

    menuOptions.items.forEach(item => {
      // 处理分组生成的分隔符标记
      switch (item.type) {
        case 'command':
          menu.addItem({ command: item.commandId });
          break;
        case 'separator':
          menu.addItem({ type: 'separator' });
          break;
        case 'submenu':
          const submenu = this.createMenu({
            id: `${menuOptions.id}-${item.label}`,
            label: item.label,
            items: item.items,
          });
          menu.addItem({ type: 'submenu', submenu });
          break;
      }
    });

    return menu;
  }

  /** 更新菜单状态（启用/禁用等） */
  private updateMenuStates(): void {
    this.menuBar.menus.forEach(menu => {
      this.updateMenu(menu);
    });
  }

  /** 递归更新菜单状态 */
  private updateMenu(menu: Menu): void {
    menu.items.forEach(item => {
      if (item.submenu) {
        this.updateMenu(item.submenu);
      }
    });
    menu.update();
  }

  dispose(): void {
    super.dispose();
    this.disposables.dispose();
  }
}