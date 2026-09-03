import { Panel, TabBar, Title, StackedPanel, Widget, SplitPanel, BoxPanel, FocusTracker } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import { ReactWidget } from '../widgets/react-widget'
import { UUID } from '@lumino/coreutils';
import { ActivityToolbar } from './nav-activity-toolbar';
import { ActivityHandle, ActivityToolbarConfig, ActivityOptions } from './nav-activity-type';
import { ToolbarService } from '../shell/toolbar/toolbar-types';

/**
 * 统一的布局状态接口
 */
export interface LayoutState {
  // 活动状态
  activities: {
    left: { top: string | null; bottom: string | null };
    right: { top: string | null; bottom: string | null };
    bottom: string | null;
  };
  // 面板状态
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
      ratio: number;  // 改为 ratio 保持一致性
    };
  };
  // 记录各区域最后打开的活动ID（用于命令快速恢复）
  lastActiveActivity: {
    left: string | null;
    right: string | null;
    bottom: string | null;
  };
}

/**
 * 活动条目内部接口
 */
interface ActivityEntry {
  id: string;
  host: Panel;
  title: Title<Widget>;
  priority: number;
  closable: boolean;
  side: 'left' | 'right';
  position: 'top' | 'bottom';
  factory?: () => Widget | ReactWidget;
  toolbarConfig?: ActivityToolbarConfig;
  initialized: boolean;
  badgeNode: HTMLElement | null;
  toolbar: ActivityToolbar | null;
}

/**
 * 重构后的 ActivityManager
 * 职责清晰，支持布局状态持久化 + 命令同步活动显示
 */
export class ActivityManager {
  // 区域面板引用
  private leftSidePanel: Panel | null;
  private rightSidePanel: Panel | null;
  private leftStack: StackedPanel | null;
  private rightStack: StackedPanel | null;
  private bottomStack: StackedPanel | null;

  // TabBar 引用
  private leftTopBar: TabBar<Widget> | null = null;
  private leftBottomBar: TabBar<Widget> | null = null;
  private rightTopBar: TabBar<Widget> | null = null;
  private rightBottomBar: TabBar<Widget> | null = null;

  // 焦点追踪器引用
  private tracker: FocusTracker<Widget>;

  // 数据存储
  private activities: Map<string, ActivityEntry> = new Map();
  private layoutState: LayoutState = {
    activities: {
      left: { top: null, bottom: null },
      right: { top: null, bottom: null },
      bottom: null
    },
    panels: {
      left: { visible: true, ratio: 0.15 },
      right: { visible: true, ratio: 0.15 },
      bottom: { visible: true, ratio: 0.2 }
    },
    lastActiveActivity: { // 初始化：各区域最后活动为空
      left: null,
      right: null,
      bottom: null
    }
  };

  // 按区域分类存储活动（优化查找效率）
  private activitiesByRegion: Record<'left' | 'right' | 'bottom', string[]> = {
    left: [],
    right: [],
    bottom: []
  };

  // 新增面板控制相关属性
  private topContentMain: SplitPanel | null;
  private mainPanel: SplitPanel | null;
  public commands: CommandRegistry;

  // 事件信号
  public readonly activityOpened = new Signal<this, { id: string; region: string }>(this);
  public readonly activityClosed = new Signal<this, { id: string; region: string }>(this);
  public readonly regionActivated = new Signal<this, { region: string; active: boolean }>(this);

  private readonly toolbarService: ToolbarService;

  constructor(
    sideBarLeft: Panel | null,
    sideBarRight: Panel | null,
    leftContentPanel: StackedPanel | null,
    rightContentPanel: StackedPanel | null,
    bottomContentPanel: StackedPanel | null,
    topContentMain: SplitPanel | null,
    mainPanel: SplitPanel | null,
    commands: CommandRegistry,
    tracker: FocusTracker<Widget>,
    toolbarService: ToolbarService
  ) {
    this.leftSidePanel = sideBarLeft;
    this.rightSidePanel = sideBarRight;
    this.leftStack = leftContentPanel;
    this.rightStack = rightContentPanel;
    this.bottomStack = bottomContentPanel;
    this.topContentMain = topContentMain;
    this.mainPanel = mainPanel;
    this.commands = commands;
    this.tracker = tracker;
    this.toolbarService = toolbarService;

    this.initializeTabBars();
    this.loadLayoutState();
    this.initializePanelVisibilityFromLayout();
    this.setupPanelCommands(); // 重构命令逻辑
    this.wireSplitPanelEvents();
    this.applyLayoutState();
  }

  // ==================== 面板控制方法 ====================

  /**
   * 根据布局状态初始化面板可见性
   */
  private initializePanelVisibilityFromLayout(): void {
    // 检查活动状态，如果没有活动则隐藏对应面板
    const { activities } = this.layoutState;
    
    if (!activities.left.top && !activities.left.bottom && this.activitiesByRegion.left.length === 0) {
      this.hidePanel('left');
    }
    
    if (!activities.right.top && !activities.right.bottom && this.activitiesByRegion.right.length === 0) {
      this.hidePanel('right');
    }
    
    if (!activities.bottom && this.activitiesByRegion.bottom.length === 0) {
      this.hidePanel('bottom');
    }
  }

  /**
   * 重构：设置面板命令（同步控制活动显示）
   */
  private setupPanelCommands(): void {
    // ---------------- 左侧面板命令 ----------------
    this.commands.addCommand('panel:toggle-left', {
      label: '切换左侧面板',
      // 动态返回图标类名
      iconClass: () => {
        return !this.layoutState.panels.left.visible 
          ? 'codicon codicon-layout-sidebar-left-off'  // 面板打开时的图标
          : 'codicon codicon-layout-sidebar-left';     // 面板关闭时的图标
      },
      execute: () => {
        this.togglePanelWithActivity('left');
      }
    });
    
    this.commands.addCommand('panel:show-left', {
      label: 'Show Left Panel',
      isEnabled: () => !this.layoutState.panels.left.visible,
      execute: () => this.showPanelWithActivity('left')
    });

    this.commands.addCommand('panel:hide-left', {
      label: 'Hide Left Panel',
      isEnabled: () => this.layoutState.panels.left.visible,
      execute: () => this.hidePanelWithActivity('left')
    });

    // ---------------- 右侧面板命令 ----------------
    this.commands.addCommand('panel:toggle-right', {
      label: '切换右侧面板',
      iconClass: () => {
        return !this.layoutState.panels.right.visible 
          ? 'codicon codicon-layout-sidebar-right-off'  // 面板打开时的图标
          : 'codicon codicon-layout-sidebar-right';     // 面板关闭时的图标
      },
      execute: () => this.togglePanelWithActivity('right')
    });

    this.commands.addCommand('panel:show-right', {
      label: 'Show Right Panel',
      isEnabled: () => !this.layoutState.panels.right.visible,
      execute: () => this.showPanelWithActivity('right')
    });

    this.commands.addCommand('panel:hide-right', {
      label: 'Hide Right Panel',
      isEnabled: () => this.layoutState.panels.right.visible,
      execute: () => this.hidePanelWithActivity('right')
    });

    // ---------------- 底部面板命令 ----------------
    this.commands.addCommand('panel:toggle-bottom', {
      label: '切换底部面板',
      iconClass: () => {
        return !this.layoutState.panels.bottom.visible 
          ? 'codicon codicon-layout-panel-off'  // 面板打开时的图标
          : 'codicon codicon-layout-panel';     // 面板关闭时的图标
      },
      execute: () => this.togglePanelWithActivity('bottom')
    });

    this.commands.addCommand('panel:show-bottom', {
      label: 'Show Bottom Panel',
      isEnabled: () => !this.layoutState.panels.bottom.visible,
      execute: () => this.showPanelWithActivity('bottom')
    });

    this.commands.addCommand('panel:hide-bottom', {
      label: 'Hide Bottom Panel',
      isEnabled: () => this.layoutState.panels.bottom.visible,
      execute: () => this.hidePanelWithActivity('bottom')
    });

    // 添加工具栏项
    this.toolbarService.registerItem({
      id: "sample:toggle-left-panel-item",
      commandId: "panel:toggle-left",
      alignment: "right",
      rank: 10,
    });
    this.toolbarService.registerItem({
      id: "sample:toggle-bottom-panel-item",
      commandId: "panel:toggle-bottom",
      alignment: "right",
      rank: 10,
    });
    this.toolbarService.registerItem({
      id: "sample:toggle-right-panel-item",
      commandId: "panel:toggle-right",
      alignment: "right",
      rank: 10,
    });
  }

  /**
   * 重构：切换面板（同步控制活动显示）
   */
  private togglePanelWithActivity(panel: 'left' | 'right' | 'bottom'): void {
    const isVisible = this.layoutState.panels[panel].visible;
    if (isVisible) {
      this.hidePanelWithActivity(panel);
    } else {
      this.showPanelWithActivity(panel);
    }
  }

  /**
   * 重构：显示面板 + 自动打开活动（优先最后打开的，无则默认第一个）
   */
  private showPanelWithActivity(panel: 'left' | 'right' | 'bottom'): void {
    // 1. 先显示面板
    this.setPanelVisibility(panel, true);

    // 2. 获取该区域的活动列表
    const regionActivities = this.activitiesByRegion[panel];
    if (regionActivities.length === 0) return;

    // 3. 优先打开最后一次活动，无则打开第一个
    const targetActivityId = this.layoutState.lastActiveActivity[panel] || regionActivities[0];

    // 4. 打开活动（同步更新Tab选中状态）
    this.openActivity(targetActivityId);
  }

  /**
   * 重构：隐藏面板 + 同步隐藏区域内所有活动
   */
  private hidePanelWithActivity(panel: 'left' | 'right' | 'bottom'): void {
    // 1. 隐藏面板
    this.setPanelVisibility(panel, false);

    // 2. 隐藏该区域内所有活动
    const regionActivities = this.activitiesByRegion[panel];
    regionActivities.forEach(activityId => {
      const entry = this.activities.get(activityId);
      if (entry && !entry.host.isHidden) {
        this.hideActivity(entry);
        
        // 3. 清除对应TabBar的选中状态
        const bar = this.getTabBarForEntry(entry);
        if (bar && bar.currentTitle === entry.title) {
          bar.currentTitle = null;
        }
      }
    });
  }

  /**
   * 连接分割面板事件
   */
  private wireSplitPanelEvents(): void {
    if (this.topContentMain) {
      this.topContentMain.handleMoved.connect((sender, args) => {
        const sizes = this.topContentMain!.relativeSizes();
        this.updatePanelRatio('left', sizes[0]);
        this.updatePanelRatio('right', sizes[2]);
      });
    }
    if (this.mainPanel) {
      this.mainPanel.handleMoved.connect((sender, args) => {
        const sizes = this.mainPanel!.relativeSizes();
        this.updatePanelRatio('bottom', sizes[1]); // 底部面板的比例是第二个元素
      });
    }
  }

  /**
   * 切换面板显示/隐藏
   */
  private togglePanel(panel: 'left' | 'right' | 'bottom'): void {
    const shouldShow = !this.layoutState.panels[panel].visible;
    this.setPanelVisibility(panel, shouldShow);
  }

  /**
   * 显示面板（仅控制面板，不同步活动）
   */
  private showPanel(panel: 'left' | 'right' | 'bottom'): void {
    this.setPanelVisibility(panel, true);
  }

  /**
   * 隐藏面板（仅控制面板，不同步活动）
   */
  private hidePanel(panel: 'left' | 'right' | 'bottom'): void {
    this.setPanelVisibility(panel, false);
  }

  /**
   * 设置面板可见性
   */
  private setPanelVisibility(panel: 'left' | 'right' | 'bottom', visible: boolean): void {
    const state = this.layoutState.panels[panel];
    state.visible = visible;
    
    if (panel === 'bottom') {
      this.toggleVerticalPanel(visible);
    } else {
      this.toggleHorizontalPanel(panel, visible);
    }
    
    this.saveLayoutState();
  }

  /**
   * 切换水平面板
   */
  private toggleHorizontalPanel(position: 'left' | 'right', show: boolean): void {
    if (!this.topContentMain) return;

    const contentPanel = position === 'left' ? this.leftStack : this.rightStack;
    if (!contentPanel) return;

    if (show) {
      contentPanel.show();
    } else {
      contentPanel.hide();
    }
    
    const newSizes = this.calculateLayout();
    this.topContentMain.setRelativeSizes(newSizes);
  }

  /**
   * 切换垂直面板
   */
  private toggleVerticalPanel(show: boolean): void {
    if (!this.mainPanel || !this.bottomStack) return;

    if (show) {
      this.bottomStack.show();
      // 使用保存的比例恢复布局
      const topRatio = 1 - this.layoutState.panels.bottom.ratio;
      const newSizes = [topRatio, this.layoutState.panels.bottom.ratio];
      this.mainPanel.setRelativeSizes(newSizes);
    } else {
      this.bottomStack.hide();
      const newSizes = [1, 0];
      this.mainPanel.setRelativeSizes(newSizes);
    }
  }

  /**
   * 计算布局比例
   */
  private calculateLayout(): number[] {
    const leftRatio = this.layoutState.panels.left.visible ? this.layoutState.panels.left.ratio : 0;
    const rightRatio = this.layoutState.panels.right.visible ? this.layoutState.panels.right.ratio : 0;
    
    const middleRatio = 1 - leftRatio - rightRatio;
    
    if (middleRatio < 0) {
      const total = leftRatio + rightRatio;
      const adjustedLeft = leftRatio / total;
      const adjustedRight = rightRatio / total;
      return [adjustedLeft, 0, adjustedRight];
    }
    
    return [leftRatio, middleRatio, rightRatio];
  }

  /**
   * 更新面板比例
   */
  private updatePanelRatio(position: 'left' | 'right' | 'bottom', newRatio: number): void {
    if (this.layoutState.panels[position].visible) {
      this.layoutState.panels[position].ratio = newRatio;
      this.saveLayoutState();
    }
  }

  /**
   * 获取面板状态
   */
  public getPanelState() {
    return { ...this.layoutState.panels };
  }

  /**
   * 设置面板状态
   */
  public setPanelState(state: LayoutState['panels']): void {
    this.layoutState.panels = { ...state };
    this.applyPanelState();
    this.saveLayoutState();
  }

  /**
   * 应用面板状态
   */
  private applyPanelState(): void {
    // 应用水平面板状态
    if (this.leftStack) {
      this.layoutState.panels.left.visible ? this.leftStack.show() : this.leftStack.hide();
    }
    if (this.rightStack) {
      this.layoutState.panels.right.visible ? this.rightStack.show() : this.rightStack.hide();
    }
    if (this.bottomStack) {
      this.layoutState.panels.bottom.visible ? this.bottomStack.show() : this.bottomStack.hide();
    }

    // 更新布局
    if (this.topContentMain) {
      const newSizes = this.calculateLayout();
      this.topContentMain.setRelativeSizes(newSizes);
    }
    if (this.mainPanel) {
      if (this.layoutState.panels.bottom.visible) {
        const topRatio = 1 - this.layoutState.panels.bottom.ratio;
        const newSizes = [topRatio, this.layoutState.panels.bottom.ratio];
        this.mainPanel.setRelativeSizes(newSizes);
      } else {
        this.mainPanel.setRelativeSizes([1, 0]);
      }
    }
  }

  // ==================== 公共 API ====================

  /**
   * 注册活动（按区域分类存储）
   */
  public registerActivity(options: ActivityOptions): ActivityHandle {
    this.validateActivityOptions(options);

    const { side, position } = this.parseLocation(options.location);
    const entry = this.createActivityEntry(options, side, position);
    const region = this.getRegionForEntry(entry); // 获取活动所属区域

    // 按区域分类存储活动ID
    if (!this.activitiesByRegion[region].includes(entry.id)) {
      this.activitiesByRegion[region].push(entry.id);
    }
    
    this.activities.set(options.id, entry);
    this.addToContentStack(entry);
    this.addToTabBar(entry);

    // 如果是区域第一个活动，自动设为最后打开的活动
    if (this.activitiesByRegion[region].length === 1) {
      this.layoutState.lastActiveActivity[region] = entry.id;
      this.saveLayoutState();
    }

    return this.createActivityHandle(entry);
  }

  /**
   * 获取当前布局状态
   */
  public getLayoutState(): LayoutState {
    return JSON.parse(JSON.stringify(this.layoutState));
  }

  /**
   * 设置布局状态
   */
  public setLayoutState(state: LayoutState): void {
    this.layoutState = JSON.parse(JSON.stringify(state));
    // 同步更新 activitiesByRegion（从布局状态反向推导）
    this.syncActivitiesByRegion();
    this.applyLayoutState();
    this.saveLayoutState();
  }

  /**
   * 打开特定活动（更新最后打开的活动记录）
   */
  public openActivity(id: string): boolean {
    const entry = this.activities.get(id);
    if (!entry) return false;

    const bar = this.getTabBarForEntry(entry);
    if (bar) {
      this.showActivity(entry);
      bar.currentTitle = entry.title;
      
      // 更新该区域最后打开的活动ID
      const region = this.getRegionForEntry(entry);
      this.layoutState.lastActiveActivity[region] = id;
      this.saveLayoutState();
      
      return true;
    }
    return false;
  }

  /**
   * 关闭特定活动（如果关闭的是最后打开的活动，自动切换到下一个）
   */
  public closeActivity(id: string): boolean {
    const entry = this.activities.get(id);
    if (!entry || !entry.closable) return false;

    const bar = this.getTabBarForEntry(entry);
    if (bar) {
      
      this.hideActivity(entry);
      
      // 如果关闭的是最后打开的活动，自动打开区域内下一个活动
      // const region = this.getRegionForEntry(entry);
      // const isLastActive = this.layoutState.lastActiveActivity[region] === id;
      // if (isLastActive) {
      //   const regionActivities = this.activitiesByRegion[region];
      //   const nextIndex = regionActivities.findIndex(actId => actId === id) + 1;
      //   const targetActivityId = regionActivities[nextIndex] || regionActivities[0];
        
      //   if (targetActivityId && targetActivityId !== id) {
      //     this.openActivity(targetActivityId);
      //   } else {
      //     // 区域内无其他活动，隐藏面板
      //     this.hidePanelWithActivity(region);
      //   }
      // }

      // 只有当当前选中的是这个标签时才清除选中状态
      if (bar.currentTitle === entry.title) {
        bar.currentTitle = null;
      }
      return true;
    }
    return false;
  }

  // ==================== 初始化方法 ====================

  /**
   * 初始化 TabBar
   */
  private initializeTabBars(): void {
    if (this.leftSidePanel) {
      const bars = this.findTabBarsInPanel(this.leftSidePanel);
      this.leftTopBar = bars.top;
      this.leftBottomBar = bars.bottom;
      this.wireTabBarPair(this.leftTopBar, this.leftBottomBar);
    }

    if (this.rightSidePanel) {
      const bars = this.findTabBarsInPanel(this.rightSidePanel);
      this.rightTopBar = bars.top;
      this.rightBottomBar = bars.bottom;
      this.wireTabBarPair(this.rightTopBar, this.rightBottomBar);
    }
  }

  /**
   * 连接 TabBar 事件
   */
  private wireTabBarPair(topBar: TabBar<Widget> | null, bottomBar: TabBar<Widget> | null): void {
    if (topBar) this.wireTabBar(topBar);
    if (bottomBar) this.wireTabBar(bottomBar);
  }

  /**
   * 连接单个 TabBar 事件
   */
  private wireTabBar(bar: TabBar<Widget>): void {
    bar.currentTitle = null;
    bar.tabActivateRequested.connect((_, args) => {
      this.handleTabActivation(bar, args.title);
    });
  }

  // ==================== 活动管理 ====================

  /**
   * 验证活动选项
   */
  private validateActivityOptions(options: ActivityOptions): void {
    if (!options?.id) {
      throw new Error('Activity must have an id');
    }
    if (this.activities.has(options.id)) {
      throw new Error(`Activity id already registered: ${options.id}`);
    }
  }

  /**
   * 解析位置配置
   */
  private parseLocation(location: string = 'left-top'): { side: 'left' | 'right'; position: 'top' | 'bottom' } {
    const loc = location.toLowerCase();
    if (loc === 'left-top') {
      return { side: 'left', position: 'top' };
    }
    if (loc === 'right-top') {
      return { side: 'right', position: 'top' };
    }

    const side = loc.includes('right') ? 'right' : 'left';
    const position = loc.includes('bottom') ? 'bottom' : 'top';
    
    return { side, position };
  }

  /**
   * 创建活动条目
   */
  private createActivityEntry(options: ActivityOptions, side: 'left' | 'right', position: 'top' | 'bottom'): ActivityEntry {
    const host = new BoxPanel({ direction: 'top-to-bottom', spacing: 0});
    host.id = `activity-${UUID.uuid4()}`;
    host.addClass('magic-idea-side-panel');
    host.title.label = options.title;
    host.title.caption = options.title;
    if (options.iconClass) {
      host.title.iconClass = options.iconClass;
    }

    return {
      id: options.id,
      host,
      title: host.title,
      priority: options.priority ?? 100,
      closable: options.closable ?? true,
      side,
      position,
      factory: options.factory,
      initialized: false,
      badgeNode: null,
      toolbarConfig: options.toolbarConfig, // 保存插件传入的工具栏配置
      toolbar: null
    };
  }

  /**
   * 添加到内容面板
   */
  private addToContentStack(entry: ActivityEntry): void {
    const stack = this.getContentStackForEntry(entry);
    if (stack) {
      stack.addWidget(entry.host);
      entry.host.hide(); // 默认隐藏
    }
  }

  /**
   * 添加到 TabBar
   */
  private addToTabBar(entry: ActivityEntry): void {
    const bar = this.getTabBarForEntry(entry);
    if (!bar) {
      console.warn(`No TabBar found for activity ${entry.id} at ${entry.side}-${entry.position}`);
      return;
    }

    try {
      bar.addTab(entry.title);
      this.setupTabDom(entry, bar);
      // 确保新添加的标签不会自动被选中
      if (bar.currentTitle === entry.title) {
        bar.currentTitle = null;
      }
    } catch (error) {
      console.error(`Failed to add tab for activity ${entry.id}:`, error);
    }
  }

  /**
   * 创建活动句柄
   */
  private createActivityHandle(entry: ActivityEntry): ActivityHandle {
    return {
      id: entry.id,
      setBadge: (value) => this.setActivityBadge(entry.id, value),
      open: () => this.openActivity(entry.id),
      close: () => this.closeActivity(entry.id),
      toggle: () => {
        const isVisible = !entry.host.isHidden;
        if (isVisible) {
          this.closeActivity(entry.id);
        } else {
          this.openActivity(entry.id);
        }
      },
      isInitialized: () => entry.initialized,
      isVisible: () => !entry.host.isHidden,
      updateToolbar: () => {
        entry.toolbar?.initialize();
      },
    };
  }

  // ==================== 显示/隐藏逻辑 ====================

  /**
   * 处理标签激活（更新最后打开的活动记录）
   */
  private handleTabActivation(bar: TabBar<Widget>, title: Title<Widget>): void {
    const entry = this.findEntryByTitle(title);
    if (!entry) return;

    const isCurrentlyVisible = !entry.host.isHidden;
    // 如果当前可见，则隐藏；否则显示
    if (isCurrentlyVisible) {
      this.hideActivity(entry);
      bar.currentTitle = null;
    } else {
      this.showActivity(entry);
      bar.currentTitle = title;
    }
  }

  /**
   * 显示活动
   */
  private async showActivity(entry: ActivityEntry): Promise<void> {
    await this.initializeActivity(entry);
    
    const stack = this.getContentStackForEntry(entry);
    if (!stack) return;

    // 隐藏同区域的其他活动
    this.hideOtherActivitiesInStack(entry, stack);

    entry.host.show();
    entry.host.activate();
    stack.update();

    const region = this.getRegionForEntry(entry);
    this.updateActivityLayoutState(entry, true);
    // 更新区域最后打开的活动
    this.layoutState.lastActiveActivity[region] = entry.id;
    this.saveLayoutState();

    this.activityOpened.emit({ id: entry.id, region: region });
    this.updateRegionActivation(entry, true);
    this.showPanel(region);
  }

  /**
   * 隐藏活动
   */
  private hideActivity(entry: ActivityEntry): void {
    entry.host.hide();
    
    const stack = this.getContentStackForEntry(entry);
    if (stack) stack.update();

    const region = this.getRegionForEntry(entry);
    this.activityClosed.emit({ id: entry.id, region: region });
    this.updateActivityLayoutState(entry, false);
    this.updateRegionActivation(entry, false);

    // 优化：如果区域内无可见活动，且面板是通过命令打开的，保持面板显示（避免闪烁）
    const hasVisibleActivity = this.activitiesByRegion[region].some(
      actId => this.activities.get(actId)?.host.isHidden === false
    );
    if (!hasVisibleActivity && this.layoutState.panels[region].visible) {
      // 不自动隐藏面板，让用户手动关闭或切换活动
      this.hidePanel(region);
    }
  }

  /**
   * 隐藏同区域的其他活动
   */
  private hideOtherActivitiesInStack(currentEntry: ActivityEntry, stack: StackedPanel): void {
    for (const entry of this.activities.values()) {
      if (entry.id !== currentEntry.id && this.getContentStackForEntry(entry) === stack) {
        entry.host.hide();
      }
    }
  }

  // ==================== 布局状态管理 ====================

  /**
   * 加载布局状态（同步 activitiesByRegion）
   */
  private loadLayoutState(): void {
    try {
      const saved = localStorage.getItem('activity-layout-state');
      if (saved) {
        const parsedState = JSON.parse(saved);
        // 合并保存的状态和默认状态，确保新字段有默认值
        this.layoutState = {
          activities: { ...this.layoutState.activities, ...parsedState.activities },
          panels: { ...this.layoutState.panels, ...parsedState.panels },
          lastActiveActivity: { ...this.layoutState.lastActiveActivity, ...parsedState.lastActiveActivity }
        };
        // 同步 activitiesByRegion
        this.syncActivitiesByRegion();
      }
    } catch (error) {
      console.warn('Failed to load layout state:', error);
    }
  }

  /**
   * 保存布局状态
   */
  private saveLayoutState(): void {
    try {
      localStorage.setItem('activity-layout-state', JSON.stringify(this.layoutState));
    } catch (error) {
      console.warn('Failed to save layout state:', error);
    }
  }

  /**
   * 应用布局状态
   */
  private applyLayoutState(): void {
    setTimeout(() => {
      // 先应用面板状态
      this.applyPanelState();
      
      // 再清除所有 TabBar 的选中状态
      this.clearAllTabBarSelections();
      // 应用活动状态
      const { activities } = this.layoutState;
      if (activities.left.top) {
        this.openActivity(activities.left.top);
      }
      if (activities.left.bottom) {
        this.openActivity(activities.left.bottom);
      }
      if (activities.right.top) {
        this.openActivity(activities.right.top);
      }
      if (activities.right.bottom) {
        this.openActivity(activities.right.bottom);
      }
      if (activities.bottom) {
        this.openActivity(activities.bottom);
      }
    }, 300);
  }

  /**
   * 同步 activitiesByRegion（从所有活动中按区域分类）
   */
  private syncActivitiesByRegion(): void {
    // 重置分类
    this.activitiesByRegion = { left: [], right: [], bottom: [] };
    
    // 重新分类所有活动
    this.activities.forEach(entry => {
      const region = this.getRegionForEntry(entry);
      if (!this.activitiesByRegion[region].includes(entry.id)) {
        this.activitiesByRegion[region].push(entry.id);
      }
    });
  }

  /**
   * 清除所有 TabBar 的选中状态
   */
  private clearAllTabBarSelections(): void {
    const bars = [this.leftTopBar, this.leftBottomBar, this.rightTopBar, this.rightBottomBar];
    
    bars.forEach(bar => {
      if (bar) {
        bar.currentTitle = null;
      }
    });
  }

  /**
   * 更新活动布局状态
   */
  private updateActivityLayoutState(entry: ActivityEntry, visible: boolean): void {
    const region = this.getRegionForEntry(entry);
    
    if (visible) {
      if (region === 'left') {
        this.layoutState.activities.left[entry.position] = entry.id;
      } else if (region === 'right') {
        this.layoutState.activities.right[entry.position] = entry.id;
      } else if (region === 'bottom') {
        this.layoutState.activities.bottom = entry.id;
      }
    } else {
      if (region === 'left' && this.layoutState.activities.left[entry.position] === entry.id) {
        this.layoutState.activities.left[entry.position] = null;
      } else if (region === 'right' && this.layoutState.activities.right[entry.position] === entry.id) {
        this.layoutState.activities.right[entry.position] = null;
      } else if (region === 'bottom' && this.layoutState.activities.bottom === entry.id) {
        this.layoutState.activities.bottom = null;
      }
    }

    this.saveLayoutState();
  }

  // ==================== 工具方法 ====================

  /**
   * 初始化活动内容
   */
  private async initializeActivity(entry: ActivityEntry): Promise<void> {
    if (entry.initialized || !entry.factory) return;

    try {
      const result = entry.factory();
      // 标记为已初始化并追踪组件销毁事件
      this.tracker.add(result);
      // ========== 工具栏渲染：完全基于插件传入的配置 ==========
      const toolbarConfig = this.getActivityToolbarConfig(entry.id);
      //补全工具栏默认配置（标题默认使用活动 title）
      const finalToolbarConfig: ActivityToolbarConfig = {
        id: `${entry.id}-toolbar`,
        title: entry.title.label,
        ...toolbarConfig || { items: []}
      };
      // 创建工具栏组件
      const toolbar = new ActivityToolbar(finalToolbarConfig, this.commands);
      entry.toolbar = toolbar;
      // 添加工具栏到活动面板
      entry.host.addWidget(toolbar);
      // 添加内容组件
      entry.host.addWidget(result);
      entry.initialized = true;
    } catch (error) {
      console.error(`Activity factory error for ${entry.id}:`, error);
    }
  }

  /**
   * 获取活动的工具栏配置（仅从插件注册的 ActivityOptions 中读取）
   */
  private getActivityToolbarConfig(activityId: string): ActivityToolbarConfig | undefined {
    const entry = this.activities.get(activityId);
    if (!entry) return undefined;

    return (entry as ActivityEntry & { toolbarConfig?: ActivityToolbarConfig }).toolbarConfig;
  }

  /**
   * 设置活动徽章
   */
  private setActivityBadge(id: string, value: number | string | boolean | null): void {
    const entry = this.activities.get(id);
    if (!entry) return;

    const bar = this.getTabBarForEntry(entry);
    if (!bar) return;

    this.ensureBadgeNode(entry, bar);
    
    if (!entry.badgeNode) return;

    if (value === null || value === undefined || value === 0 || value === '0' || value === '' || value === false) {
      entry.badgeNode.style.display = 'none';
      entry.badgeNode.textContent = '';
    }else if (typeof value === 'boolean') {
      // 布尔值：true 显示小红点，false 隐藏
      entry.badgeNode.style.display = '';
      entry.badgeNode.classList.remove('badge-icon', 'badge-text');
      entry.badgeNode.classList.add('badge-dot'); // 添加小红点样式类
    } else if (typeof value === 'number'){
      entry.badgeNode.style.display = '';
      entry.badgeNode.classList.remove('badge-dot', 'badge-icon');
      entry.badgeNode.classList.add('badge-text'); // 添加文本徽章样式类
      entry.badgeNode.textContent = String(value);
    } else {
      entry.badgeNode.style.display = '';
      entry.badgeNode.classList.add('badge-icon'); 
      entry.badgeNode.classList.remove('badge-dot', 'badge-text'); // 移除其他样式类
      entry.badgeNode.classList.add('codicon');
      entry.badgeNode.classList.add(value); // value 是一个 CSS 类名
      entry.badgeNode.classList.add('spinning'); // 添加旋转动画类
    }
  }

  /**
   * 设置标签 DOM
   */
  private setupTabDom(entry: ActivityEntry, bar: TabBar<Widget>): void {
    const tabNode = this.findTabNode(entry, bar);
    if (!tabNode) {
      requestAnimationFrame(() => this.setupTabDom(entry, bar));
      return;
    }

    tabNode.dataset.activityId = entry.id;
    this.ensureBadgeNode(entry, bar);
  }

  /**
   * 确保徽章节点存在
   */
  private ensureBadgeNode(entry: ActivityEntry, bar: TabBar<Widget>): void {
    const tabNode = this.findTabNode(entry, bar);
    if (!tabNode) return;

    if (!entry.badgeNode) {
      let badge = tabNode.querySelector('.activity-badge') as HTMLElement;
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'activity-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.style.display = 'none';
        tabNode.appendChild(badge);
      }
      entry.badgeNode = badge;
    }
  }

  /**
   * 查找标签节点
   */
  private findTabNode(entry: ActivityEntry, bar: TabBar<Widget>): HTMLElement | null {
    const nodes = bar.node.querySelectorAll('.lm-TabBar-tab');
    
    for (const node of nodes) {
      const element = node as HTMLElement;
      if (element.dataset.activityId === entry.id) {
        return element;
      }
      if (entry.title.label && element.textContent?.includes(entry.title.label)) {
        return element;
      }
    }
    
    return null;
  }

  /**
   * 通过标题查找条目
   */
  private findEntryByTitle(title: Title<Widget>): ActivityEntry | undefined {
    for (const entry of this.activities.values()) {
      if (entry.title === title) {
        return entry;
      }
    }
    return undefined;
  }

  /**
   * 获取条目对应的区域
   */
  private getRegionForEntry(entry: ActivityEntry): 'bottom' | 'left' | 'right' {
    if (entry.position === 'bottom') return 'bottom';
    return entry.side;
  }

  /**
   * 获取条目对应的内容面板
   */
  private getContentStackForEntry(entry: ActivityEntry): StackedPanel | null {
    if (entry.side === 'left' && entry.position === 'top') return this.leftStack;
    if (entry.side === 'right' && entry.position === 'top') return this.rightStack;
    return this.bottomStack; // 其他情况使用底部面板
  }

  /**
   * 获取条目对应的 TabBar
   */
  private getTabBarForEntry(entry: ActivityEntry): TabBar<Widget> | null {
    if (entry.side === 'left') {
      return entry.position === 'top' ? this.leftTopBar : this.leftBottomBar;
    } else if (entry.side === 'right') {
      return entry.position === 'top' ? this.rightTopBar : this.rightBottomBar;
    }
    return null;
  }

  /**
   * 在面板中查找 TabBar
   */
  private findTabBarsInPanel(panel: Panel): { top: TabBar<Widget> | null; bottom: TabBar<Widget> | null } {
    let top: TabBar<Widget> | null = null;
    let bottom: TabBar<Widget> | null = null;
    
    for (const widget of panel.widgets) {
      if (widget instanceof TabBar) {
        if (!top) top = widget;
        bottom = widget;
      }
    }
    
    return { top, bottom };
  }

  /**
   * 更新区域激活状态
   */
  private updateRegionActivation(entry: ActivityEntry, active: boolean): void {
    const region = this.getRegionForEntry(entry);
    this.regionActivated.emit({ region, active });
  }
}