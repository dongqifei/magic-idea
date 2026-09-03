import { Widget, Panel, BoxPanel, Menu, MenuBar } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import { ActivityToolbarConfig, ToolbarItemConfig, DropdownMenuItem, ToolbarItemType } from './nav-activity-type';

/**
 * 活动栏工具栏组件（magic-idea 风格）
 */
export class ActivityToolbar extends BoxPanel {
  /** 工具栏配置 */
  private config: ActivityToolbarConfig;
  /** 命令注册器 */
  private commands: CommandRegistry;
  /** 工具项缓存 */
  private toolItems = new Map<string, Widget>();
  /** 下拉菜单缓存 */
  private menus = new Map<string, Menu>();

  constructor(config: ActivityToolbarConfig, commands: CommandRegistry) {
    super({ direction: 'left-to-right', spacing: 4 });
    this.config = {
      id: `${config.id || 'activity-toolbar'}`,
      showTitle: true,
      titlePosition: 'left',
      showCollapseButton: true,
      className: '',
      ...config
    };
    this.commands = commands;
    this.addClass(`magic-idea-activity-toolbar`);
    if(this.config.className){
        this.addClass(this.config.className);
    }
    // 初始化工具栏
    this.initialize();
  }

  /**
   * 初始化工具栏
   */
  public initialize(): void {
    // 1. 清空当前面板所有子组件
    [...this.widgets].forEach(w => {
      w.parent = null;
      w.dispose();
    });
    // 2. 清空缓存
    this.toolItems.forEach(w => w.dispose());
    this.menus.forEach(m => m.dispose());
    this.toolItems.clear();
    this.menus.clear();
    
    // 根据标题位置布局
    const { titlePosition } = this.config;
    
    if (titlePosition === 'left') {
      this.addTitleWidget();
      this.addToolItems();
    } else if (titlePosition === 'center') {
      this.addToolItems('left');
      this.addTitleWidget();
      this.addToolItems('right');
    } else {
      this.addToolItems();
      this.addTitleWidget();
    }
  }


  /**
   * 动态添加工具项
   */
  public addToolItem(item: ToolbarItemType, config: Omit<ToolbarItemConfig, 'type'>): void {
    const newItem: ToolbarItemConfig = { ...config, type: item };
    this.config.items.push(newItem);
    this.initialize(); // 重新初始化工具栏
  }

  /**
   * 动态移除工具项
   */
  public removeToolItem(itemId: string): void {
    this.config.items = this.config.items.filter(item => item.id !== itemId);
    this.toolItems.delete(itemId);
    this.menus.delete(itemId);
    this.initialize(); // 重新初始化工具栏
  }

  /**
   * 更新工具项状态
   */
  public updateToolItem(itemId: string, updates: Partial<ToolbarItemConfig>): void {
    const index = this.config.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.config.items[index] = { ...this.config.items[index], ...updates };
      this.initialize(); // 重新初始化工具栏
    }
  }

  /**
   * 销毁组件
   */
  dispose(): void {
    this.toolItems.forEach(widget => widget.dispose());
    this.menus.forEach(menu => menu.dispose());
    super.dispose();
  }
  
  /**
   * 添加标题组件
   */
  private addTitleWidget(): void {
    if (!this.config.showTitle) return;
    
    const titleWidget = new Widget();
    titleWidget.addClass('magic-idea-activity-toolbar-title');
    titleWidget.node.textContent = this.config.title || '';
    this.addWidget(titleWidget);
  }

  /**
   * 获取选中状态（兼容同步/异步、值/函数类型）
   * @param item QuickPickItem 实例
   * @returns Promise<boolean> 选中状态（异步适配所有场景）
   */
  private async getVisibleStatus(item: ToolbarItemConfig): Promise<boolean> {
    const { visible } = item;

    // 情况1：picked 为 undefined（默认选中）
    if (visible === undefined) {
      return true;
    }

    // 情况2：picked 为 boolean 原始值（直接返回）
    if (typeof visible === 'boolean') {
      return visible;
    }

    // 情况3：picked 为函数（CommandFunc），先执行函数获取结果
    let result: boolean | Promise<boolean>;
    try {
      result = visible(); // 执行函数
    } catch (error) {
      console.error('执行 visible 函数失败:', error);
      return false; // 执行失败默认未选中
    }

    // 情况3.1：函数返回值为 boolean（同步结果，直接返回）
    if (typeof result === 'boolean') {
      return result;
    }

    // 情况3.2：函数返回值为 Promise<boolean>（异步结果，等待解析）
    try {
      return await result;
    } catch (error) {
      console.error('解析 visible 异步结果失败:', error);
      return false; // 异步失败默认未选中
    }
  }

  /**
   * 添加工具项（支持左右分区）
   */
  private async addToolItems(area: 'left' | 'right' = 'left'): Promise<void> {
    const toolContainer = new BoxPanel({ direction: "right-to-left", spacing: 2 });
    toolContainer.addClass('magic-idea-activity-tool-items');
    
    for (const item of this.config.items) {
      // 过滤不可见项
      const visible = await this.getVisibleStatus(item);
      if (visible === false) return;
      
      let toolWidget: Widget | undefined;
      
      switch (item.type) {
        case 'button':
          toolWidget = this.createToolButton(item);
          break;
        case 'dropdown':
          toolWidget = this.createToolDropdown(item);
          break;
        case 'custom':
          toolWidget = item.customWidget ? item.customWidget() : undefined;
          break;
      }
      
      if (toolWidget) {
        toolWidget.addClass(`magic-idea-tool-item`);
        if(item.className){
            toolWidget.addClass(item.className);
        }
        toolWidget.id = `magic-idea-tool-item-${item.id}`;
        this.toolItems.set(item.id, toolWidget);
        toolContainer.addWidget(toolWidget);
      }
    }
    
    this.addWidget(toolContainer);
  }

  /**
   * 创建工具按钮
   */
  private createToolButton(config: ToolbarItemConfig): Widget {
    const button = new Widget();
    button.addClass('magic-idea-tool-button');
    let iconClass = config.iconClass || '';
    let tooltip = config.tooltip || '';
    const itemNode = document.createElement('i');
    itemNode.className = 'action-label codicon';
    // 绑定命令
    if (config.commandId && this.commands.hasCommand(config.commandId)) {
      const lable = this.commands.label(config.commandId);
      const caption = this.commands.caption(config.commandId);
      iconClass = this.commands.iconClass(config.commandId);
      tooltip = caption || lable;
      button.node.addEventListener('click', () => {
        this.commands.execute(config.commandId!);
      });
    }
    itemNode.className += ' ' + iconClass; 
    itemNode.title = tooltip || config.tooltip || '';
    button.node.appendChild(itemNode);
    return button;
  }

  /**
   * 创建下拉菜单工具
   */
  private createToolDropdown(config: ToolbarItemConfig): Widget {
    const dropdownButton = new Widget();
    dropdownButton.addClass('magic-idea-tool-button');
    dropdownButton.addClass('magic-idea-dropdown-button');
    dropdownButton.node.innerHTML = `<i class="action-label codicon ${config.iconClass || 'codicon-ellipsis'}""></i>`;
    dropdownButton.node.title = config.tooltip || '';
    
    // 创建菜单
    const menu = new Menu({ commands: this.commands });
    // 构建菜单项
    if (config.menuItems) {
      this.buildMenuItems(menu, config.menuItems);
    }
    
    // 绑定菜单显示
    dropdownButton.node.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = dropdownButton.node.getBoundingClientRect();
      menu.open(rect.left, rect.bottom);
    });
    this.menus.set(config.id, menu);
    return dropdownButton;
  }

  /**
   * 递归构建菜单项
   */
  private buildMenuItems(menu: Menu, items: DropdownMenuItem[]): void {
    items.forEach(item => {
      if (item.separator) {
        menu.addItem({ type: 'separator' });
        return;
      }
      // 添加子菜单
      if (item.submenu) {
        const submenu = new Menu({ commands: this.commands });
        this.buildMenuItems(submenu, item.submenu);
        menu.addItem({ type: 'submenu', submenu: submenu });
        return;
      }
      menu.addItem({ command: item.commandId });
    });
  }
}