import { inject, injectable } from "inversify";
import {
  TabBar,
  Panel,
  SplitPanel,
  SplitLayout,
  StackedPanel,
  Widget,
  BoxPanel,
  FocusTracker,
  DockLayout,
  DockPanel,
  Title
} from "@lumino/widgets";
import { ArrayExt, find, toArray, each } from "@lumino/algorithm";
import { CommandRegistry } from "@lumino/commands";
import { Message } from "@lumino/messaging";
import {
  Deferred,
  Disposable,
  DisposableCollection,
  Emitter,
  isObject,
  IEvent as CommonEvent,
  isTauri
} from "../common";
import { KeybindingRegistry } from "../keybinding/keybinding-registry";
import { NavTabBar } from "../nav-activity/nav-tab-bar";
import { ActivityManager } from "../nav-activity/nav-activity-manager";
import { StatusBarWidget } from "../statusbar";
import { ToolbarWidget } from "./toolbar/toolbar-widget";
import { BreadcrumbWidget } from "./breadcrumb/breadcrumb-widget";
import { ToolbarService } from "./toolbar/toolbar-types";
import { ThemeService } from "../theme/theme-service";
import { SaveableService } from '../saveable-service';
import { Saveable, SaveableWidget, SaveOptions } from '../saveable';
import { NotificationCenterWidget } from "../notification/notification-widget";
import { TabBarToolbarRegistry, TabBarToolbarFactory } from './tab-bar-toolbar';

import {
  MainDockPanel as TheiaDockPanel,
  MAIN_AREA_ID,
} from "./main-dock-panel";
import {
  TabBarRendererFactory,
  SHELL_TABBAR_CONTEXT_MENU,
  ScrollableTabBar,
  ToolbarAwareTabBar,
} from "./tab-bars";
import {
  waitForRevealed,
  waitForClosed,
  PINNED_CLASS,
  UnsafeWidgetUtilities,
} from "../widgets";

/** The class name added to ApplicationShell instances. */
export const APPLICATION_SHELL_CLASS = "theia-ApplicationShell";
/** The class name added to the main and bottom area panels. */
export const MAIN_BOTTOM_AREA_CLASS = "theia-app-centers";
/** Status bar entry identifier for the bottom panel toggle button. */
export const BOTTOM_PANEL_TOGGLE_ID = "bottom-panel-toggle";
/** The class name added to the main area panel. */
export const MAIN_AREA_CLASS = "theia-app-main";
/** The class name added to the bottom area panel. */
export const BOTTOM_AREA_CLASS = "theia-app-bottom";

export type ApplicationShellLayoutVersion =
    /** layout versioning is introduced, unversioned layout are not compatible */
    2.0 |
    /** view containers are introduced, backward compatible to 2.0 */
    3.0 |
    /** git history view is replaced by a more generic scm history view, backward compatible to 3.0 */
    4.0 |
    /** Replace custom/font-awesome icons with codicons */
    5.0 |
    /** added the ability to drag and drop view parts between view containers */
    6.0;

/**
 * When a version is increased, make sure to introduce a migration (ApplicationShellLayoutMigration) to this version.
 */
export const applicationShellLayoutVersion: ApplicationShellLayoutVersion = 5.0;

export const DockPanelRendererFactory = Symbol("DockPanelRendererFactory");
export interface DockPanelRendererFactory {
  (document?: Document | ShadowRoot): DockPanelRenderer;
}

/**
 * A renderer for dock panels that supports context menus on tabs.
 */
@injectable()
export class DockPanelRenderer implements DockLayout.IRenderer {
  readonly tabBarClasses: string[] = [];

  /**
   * In case of DockPanels rendered in secondary windows, will be set
   * to the document of that window
   */
  document?: Document | ShadowRoot;

  private readonly onDidCreateTabBarEmitter = new Emitter<TabBar<Widget>>();

  constructor(
    @inject(TabBarRendererFactory)
    protected readonly tabBarRendererFactory: TabBarRendererFactory,
    @inject(TabBarToolbarRegistry) protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
    @inject(TabBarToolbarFactory) protected readonly tabBarToolbarFactory: TabBarToolbarFactory,
  ){ }

  get onDidCreateTabBar(): CommonEvent<TabBar<Widget>> {
    return this.onDidCreateTabBarEmitter.event;
  }

  createTabBar(): TabBar<Widget> {
    const getDynamicTabOptions: () =>
      | ScrollableTabBar.Options
      | undefined = () => {
        // if (this.corePreferences.get('workbench.tab.shrinkToFit.enabled')) {
        //   return {
        //     minimumTabSize: this.corePreferences.get('workbench.tab.shrinkToFit.minimumSize'),
        //     defaultTabSize: this.corePreferences.get('workbench.tab.shrinkToFit.defaultSize')
        //   };
        // } else {
        //   return undefined;
        // }
        return undefined;
      };

    const renderer = this.tabBarRendererFactory();
    const tabBar = new ToolbarAwareTabBar(
      this.tabBarToolbarRegistry,
      this.tabBarToolbarFactory,
      {
        document: this.document,
        renderer,
      },
      {
        // Scroll bar options
        handlers: ["drag-thumb", "keyboard", "wheel", "touch"],
        useBothWheelAxes: true,
        scrollXMarginOffset: 4,
        suppressScrollY: true,
      },
      getDynamicTabOptions()
    );
    this.tabBarClasses.forEach((c) => tabBar.addClass(c));
    renderer.tabBar = tabBar;
    renderer.contextMenuPath = SHELL_TABBAR_CONTEXT_MENU;
    tabBar.currentChanged.connect(this.onCurrentTabChanged, this);
    tabBar.disposed.connect(() => {
      renderer.dispose();
    });
    this.onDidCreateTabBarEmitter.fire(tabBar);
    return tabBar;
  }

  createHandle(): HTMLDivElement {
    return DockPanel.defaultRenderer.createHandle();
  }

  protected onCurrentTabChanged(
    sender: ToolbarAwareTabBar,
    { currentIndex }: TabBar.ICurrentChangedArgs<Widget>
  ): void {
    if (currentIndex >= 0) {
      sender.revealTab(currentIndex);
    }
  }
}


export const MAXIMIZED_CLASS = "theia-maximized";

/**
 * 应用布局组件
 */
@injectable()
export class ApplicationShellLayout extends Widget {
  private _statusBar: Widget;
  private _commands: CommandRegistry;
  private _keybindings: KeybindingRegistry;

  private _appShell: Panel;
  private _navBar: Widget;
  private _contentPanel: Panel;
  private _sideBarLeft: NavTabBar;
  private _sideBarRight: NavTabBar;
  private _mainPanel: SplitPanel;
  private _mainDockPanel: TheiaDockPanel;
  private _topContentMain: SplitPanel;
  private _leftContentPanel: StackedPanel;
  private _rightContentPanel: StackedPanel;
  private _bottomContentPanel: StackedPanel;
  private _activityManager: ActivityManager;

  /**
   * The fixed-size panel shown on top. This one usually holds the main menu.
   */
  topPanel: Panel;

  private _mainPanelRenderer: DockPanelRenderer;

  get mainPanelRenderer(): DockPanelRenderer {
    return this._mainPanelRenderer;
  }

  private spacing = 4;

  private readonly tracker = new FocusTracker<Widget>();

  protected readonly toDisposeOnActiveChanged = new DisposableCollection();

  protected readonly maximizedElement: HTMLElement;

  protected readonly onDidChangeActiveWidgetEmitter = new Emitter<
    FocusTracker.IChangedArgs<Widget>
  >();
  readonly onDidChangeActiveWidget = this.onDidChangeActiveWidgetEmitter.event;

  protected readonly onDidChangeCurrentWidgetEmitter = new Emitter<
    FocusTracker.IChangedArgs<Widget>
  >();
  readonly onDidChangeCurrentWidget =
    this.onDidChangeCurrentWidgetEmitter.event;

  private readonly activationTimeout = 2000;

  constructor(
    @inject(DockPanelRendererFactory)
    protected dockPanelRendererFactory: () => DockPanelRenderer,
    @inject(TheiaDockPanel.Factory)
    protected readonly dockPanelFactory: TheiaDockPanel.Factory,
    @inject(CommandRegistry) commands: CommandRegistry,
    @inject(KeybindingRegistry) keybindingRegistry: KeybindingRegistry,
    @inject(StatusBarWidget) statusbar: StatusBarWidget,
    @inject(ToolbarService) private toolbarService: ToolbarService,
    @inject(ThemeService) private themeService: ThemeService,
    @inject(NotificationCenterWidget)
    private notificationWidget: NotificationCenterWidget,
    @inject(SaveableService)
    protected readonly saveableService: SaveableService,
  ) {
    super();
    this.id = "applicon-layout";
    this._commands = commands;
    this._keybindings = keybindingRegistry;
    this._statusBar = statusbar;

    this.themeService.getCurrentTheme()?.spacing &&
      (this.spacing = this.themeService.getCurrentTheme()!.spacing!);

    this.themeService.onDidChangeTheme((event) => {
      event.newTheme?.spacing && (this.spacing = event.newTheme!.spacing!);
      // 更新布局间距
      this._mainPanel.spacing = this.spacing;
      this._topContentMain.spacing = this.spacing;
    });

    // 构建布局
    this._appShell = this.createAppShell();
    // 创建侧边栏和主面板
    this._sideBarLeft = this.createLeftSidebar();
    this._sideBarRight = this.createRightSidebar();
    this._mainPanel = this.createMainPanel();
    this._topContentMain = this.createTopContentMain();
    this._leftContentPanel = this.createLeftContentPanel();
    this._rightContentPanel = this.createRightContentPanel();
    this._bottomContentPanel = this.createBottomContentPanel();
    // 创建活动管理器
    this._activityManager = this.createActivityManager();
    this._navBar = this.createNavBar();
    this._contentPanel = this.createContentPanel();
    // 组装布局
    this.assembleLayout();

    this.tracker.currentChanged.connect(this.onCurrentChanged, this);
    this.tracker.activeChanged.connect(this.onActiveChanged, this);
  }

  /**
   * The current widget in the application shell. The current widget is the last widget that
   * was active and not yet closed. See the remarks to `activeWidget` on what _active_ means.
   */
  get currentWidget(): Widget | undefined {
    return this.tracker.currentWidget || undefined;
  }

  /**
   * The active widget in the application shell. The active widget is the one that has focus
   * (either the widget itself or any of its contents).
   *
   * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * does not take any focus; in that case the widget is never returned by this property.
   */
  get activeWidget(): Widget | undefined {
    return this.tracker.activeWidget || undefined;
  }

  /**
   * Handle a change to the current widget.
   */
  private onCurrentChanged(
    sender: FocusTracker<Widget>,
    args: FocusTracker.IChangedArgs<Widget>,
  ): void {
    this.onDidChangeCurrentWidgetEmitter.fire(args);
  }

  /**
   * Handle a change to the active widget.
   */
  private onActiveChanged(
    sender: FocusTracker<Widget>,
    args: FocusTracker.IChangedArgs<Widget>,
  ): void {
    this.toDisposeOnActiveChanged.dispose();
    const { newValue, oldValue } = args;
    if (oldValue) {
      let w: Widget | null = oldValue;
      while (w) {
        // Remove the mark of the previously active widget
        w.title.className = w.title.className.replace(" theia-mod-active", "");
        w = w.parent;
      }
    }
    if (newValue) {
      let w: Widget | null = newValue;
      while (w) {
        // Mark the tab of the active widget
        w.title.className += " theia-mod-active";
        w = w.parent;
      }
      // Reveal the title of the active widget in its tab bar
      const tabBar = this.getTabBarFor(newValue);
      if (tabBar instanceof ScrollableTabBar) {
        const index = tabBar.titles.indexOf(newValue.title);
        if (index >= 0) {
          tabBar.revealTab(index);
        }
      }
      const widget = this.toTrackedStack(newValue.id).pop();
      const panel = this.findPanel(widget);
      if (panel) {
        // if widget was undefined, we wouldn't have gotten a panel back before
        panel.markAsCurrent(widget!.title);
      }

      // activate another widget if an active widget will be closed
      const onCloseRequest = newValue["onCloseRequest"];
      newValue["onCloseRequest"] = (msg) => {
        const currentTabBar = this.currentTabBar;
        if (currentTabBar) {
          const recentlyUsedInTabBar = currentTabBar[
            "_previousTitle"
          ] as TabBar<Widget>["currentTitle"];
          if (recentlyUsedInTabBar && recentlyUsedInTabBar.owner !== newValue) {
            currentTabBar.currentIndex = ArrayExt.firstIndexOf(
              currentTabBar.titles,
              recentlyUsedInTabBar,
            );
            if (currentTabBar.currentTitle) {
              this.activateWidget(currentTabBar.currentTitle.owner.id);
            }
          } else if (!this.activateNextTabInTabBar(currentTabBar)) {
            if (!this.activatePreviousTabBar(currentTabBar)) {
              this.activateNextTabBar(currentTabBar);
            }
          }
        }
        newValue["onCloseRequest"] = onCloseRequest;
        newValue["onCloseRequest"](msg);
      };
      this.toDisposeOnActiveChanged.push(
        Disposable.create(() => (newValue["onCloseRequest"] = onCloseRequest)),
      );
      // if (PreviewableWidget.is(newValue)) {
      //     newValue.loaded = true;
      // }
    }
    this.onDidChangeActiveWidgetEmitter.fire(args);
  }

  /**
   * Find the shell panel this top-level widget is part of
   */
  protected findPanel(widget: Widget | undefined): TheiaDockPanel | undefined {
    if (!widget) {
      return undefined;
    }
    const title = widget.title;
    const mainPanelTabBar = this.mainPanel.findTabBar(title);
    if (mainPanelTabBar) {
      return this.mainPanel;
    }
    // const bottomPanelTabBar = this.bottomPanel.findTabBar(title);
    // if (bottomPanelTabBar) {
    //     return this.bottomPanel;
    // }
    // if (ArrayExt.firstIndexOf(this.leftPanelHandler.tabBar.titles, title) > -1) {
    //     return this.leftPanelHandler.dockPanel;
    // }
    // if (ArrayExt.firstIndexOf(this.rightPanelHandler.tabBar.titles, title) > -1) {
    //     return this.rightPanelHandler.dockPanel;
    // }
    return undefined;
  }

  /**
   * Return the tab bar that has the currently active widget, or undefined.
   */
  get currentTabBar(): TabBar<Widget> | undefined {
    const currentWidget = this.currentWidget;
    if (currentWidget) {
      return this.getTabBarFor(currentWidget);
    }
  }

  activateNextTabBar(
    current: TabBar<Widget> | undefined = this.currentTabBar,
  ): boolean {
    const nextBar = this.nextTabBar(current);
    if (nextBar) {
      nextBar.currentIndex = 0;
      if (nextBar.currentTitle) {
        this.activateWidget(nextBar.currentTitle.owner.id);
      }
      return true;
    }
    return false;
  }

  /**
   * Return the tab bar next to the given tab bar; return the given tab bar if there is no adjacent one.
   */
  nextTabBar(
    current: TabBar<Widget> | undefined = this.currentTabBar,
  ): TabBar<Widget> | undefined {
    const bars = toArray(this.mainPanel.tabBars());
    const len = bars.length;
    const ci = ArrayExt.firstIndexOf(bars, current);
    if (ci >= 0 && ci < len - 1) {
      return bars[ci + 1];
    } else if (ci >= 0 && ci === len - 1) {
      return bars[0];
    } else {
      return current;
    }
  }

  /*
   * Activate the next tab in the current tab bar.
   */
  activateNextTabInTabBar(
    current: TabBar<Widget> | undefined = this.currentTabBar,
  ): boolean {
    const index = this.nextTabIndexInTabBar(current);
    if (!current || index === -1) {
      return false;
    }
    current.currentIndex = index;
    if (current.currentTitle) {
      this.activateWidget(current.currentTitle.owner.id);
    }
    return true;
  }

  nextTabIndexInTabBar(
    current: TabBar<Widget> | undefined = this.currentTabBar,
  ): number {
    if (!current || current.titles.length <= 1) {
      return -1;
    }
    const index = current.currentIndex;
    if (index === -1) {
      return -1;
    }
    if (index < current.titles.length - 1) {
      return index + 1;
    }
    // last item in tab bar. select the previous one.
    if (index === current.titles.length - 1) {
      return index - 1;
    }
    return 0;
  }

  activatePreviousTabBar(
    current: TabBar<Widget> | undefined = this.currentTabBar,
  ): boolean {
    const prevBar = this.previousTabBar(current);
    if (!prevBar) {
      return false;
    }
    if (!prevBar.currentTitle) {
      prevBar.currentIndex = prevBar.titles.length - 1;
    }
    if (prevBar.currentTitle) {
      this.activateWidget(prevBar.currentTitle.owner.id);
    }
    return true;
  }

  /**
   * Return the tab bar previous to the given tab bar; return the given tab bar if there is no adjacent one.
   */
  previousTabBar(
    current: TabBar<Widget> | undefined = this.currentTabBar,
  ): TabBar<Widget> | undefined {
    const bars = toArray(this.mainPanel.tabBars());
    const len = bars.length;
    const ci = ArrayExt.firstIndexOf(bars, current);
    if (ci > 0) {
      return bars[ci - 1];
    } else if (ci === 0) {
      return bars[len - 1];
    } else {
      return current;
    }
  }

  /**
   * Track all widgets that are referenced by the given layout data.
   */
  protected registerWithFocusTracker(data: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig): void {
    if (data) {
      if (data.type === 'tab-area') {
        for (const widget of data.widgets) {
          if (widget) {
              this.track(widget);
          }
        }
      } else if (data.type === 'split-area') {
        for (const child of data.children) {
            this.registerWithFocusTracker(child);
        }
      }
    }
  }

  /**
   * Add a widget to the application shell. The given widget must have a unique `id` property,
   * which will be used as the DOM id.
   *
   * Widgets are removed from the shell by calling their `close` or `dispose` methods.
   *
   * Widgets added to the top area are not tracked regarding the _current_ and _active_ states.
   */
  async addWidget(
    widget: Widget,
    options?: Readonly<ApplicationShellLayout.WidgetOptions>,
  ): Promise<void> {
    if (!widget.id) {
      console.error(
        "Widgets added to the application shell must have a unique id property.",
      );
      return;
    }
    const { area, addOptions } = this.getInsertionOptions(options);
    switch (area) {
      case "main":
        this.mainPanel.addWidget(widget, addOptions);
        break;
      case 'top':
        this.topPanel.addWidget(widget);
        break;
      default:
        throw new Error("Unexpected area: " + options?.area);
    }
    this.track(widget);
  }

  /**
   * Track the given widget so it is considered in the `current` and `active` state of the shell.
   */
  protected track(widget: Widget): void {
    if (this.tracker.widgets.indexOf(widget) !== -1) {
      return;
    }
    this.tracker.add(widget);
    this.checkActivation(widget);
    if (ApplicationShellLayout.TrackableWidgetProvider.is(widget)) {
      for (const toTrack of widget.getTrackableWidgets()) {
        this.track(toTrack);
      }
      if (widget.onDidChangeTrackableWidgets) {
        widget.onDidChangeTrackableWidgets((widgets) =>
          widgets.forEach((w) => this.track(w)),
        );
      }
    }
  }

  /**
   * Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * of Widget does not take any focus. This method can help finding such problems by logging
   * a warning in case a widget was explicitly activated, but did not trigger a change of the
   * `activeWidget` property.
   */
  private checkActivation(widget: Widget): Widget {
    const onActivateRequest = widget["onActivateRequest"].bind(widget);
    widget["onActivateRequest"] = (msg: Message) => {
      onActivateRequest(msg);
      this.assertActivated(widget);
    };
    return widget;
  }

  private readonly toDisposeOnActivationCheck = new DisposableCollection();
  private assertActivated(widget: Widget): void {
    this.toDisposeOnActivationCheck.dispose();

    const onDispose = () => this.toDisposeOnActivationCheck.dispose();
    widget.disposed.connect(onDispose);
    this.toDisposeOnActivationCheck.push(
      Disposable.create(() => widget.disposed.disconnect(onDispose)),
    );

    let start = 0;
    const step: FrameRequestCallback = () => {
      const activeElement = widget.node.ownerDocument.activeElement;
      if (activeElement && widget.node.contains(activeElement)) {
        return;
      }
      const now = Date.now();
      if (!start) {
        start = now;
      }
      const delta = now - start;
      if (delta < this.activationTimeout) {
        request = setTimeout(step, 0);
      } else {
        console.warn(
          `Widget was activated, but did not accept focus after ${this.activationTimeout}ms: ${widget.id}`,
        );
      }
    };
    let request = setTimeout(step, 0);
    this.toDisposeOnActivationCheck.push(
      Disposable.create(() => window.cancelAnimationFrame(request)),
    );
  }

  /**
   * Reveal a widget in the application shell. This makes the widget visible,
   * but does not activate it.
   *
   * @returns the revealed widget if it was found
   */
  async revealWidget(id: string): Promise<Widget | undefined> {
    const stack = this.toTrackedStack(id);
    let current = stack.pop();
    if (current && !this.doRevealWidget(current.id)) {
      return undefined;
    }
    while (current && stack.length) {
      const child = stack.pop()!;
      if (
        ApplicationShellLayout.TrackableWidgetProvider.is(current) &&
        current.revealWidget
      ) {
        current = current.revealWidget(child.id);
      } else {
        current = child;
      }
    }
    if (!current) {
      return undefined;
    }
    await Promise.all([waitForRevealed(current)]);
    return current;
  }

  /**
   * Reveal top-level area widget.
   */
  protected doRevealWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), (w) => w.id === id);

    if (widget) {
      const tabBar = this.getTabBarFor(widget);
      if (tabBar) {
        tabBar.currentTitle = widget.title;
      }
    }
    if (widget) {
      return widget;
    }
    return undefined;
  }

  /**
   * Activate a widget in the application shell. This makes the widget visible and usually
   * also assigns focus to it.
   *
   * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * does not take any focus.
   *
   * @returns the activated widget if it was found
   */
  async activateWidget(id: string): Promise<Widget | undefined> {
    const stack = this.toTrackedStack(id);
    let current = stack.pop();
    if (current && !this.doActivateWidget(current.id)) {
      return undefined;
    }
    while (current && stack.length) {
      const child = stack.pop()!;
      if (
        ApplicationShellLayout.TrackableWidgetProvider.is(current) &&
        current.activateWidget
      ) {
        current = current.activateWidget(child.id);
      } else {
        child.activate();
        current = child;
      }
    }
    if (!current) {
      return undefined;
    }
    return Promise.all([
      this.waitForActivation(current.id),
      waitForRevealed(current),
    ]).then(
      () => current,
      () => undefined,
    );
  }

  waitForActivation(id: string): Promise<void> {
    if (this.activeWidget && this.activeWidget.id === id) {
      return Promise.resolve();
    }
    const activation = new Deferred();
    const success = this.onDidChangeActiveWidget(() => {
      if (this.activeWidget && this.activeWidget.id === id) {
        activation.resolve();
      }
    });
    const failure = setTimeout(
      () =>
        activation.reject(
          new Error(`Widget with id '${id}' failed to activate.`),
        ),
      this.activationTimeout + 250,
    );
    return activation.promise.finally(() => {
      success.dispose();
      clearTimeout(failure);
    });
  }

  /**
   * Activate top-level area widget.
   */
  protected doActivateWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), (w) => w.id === id);
    if (widget) {
      this.mainPanel.activateWidget(widget);
      return widget;
    }
    return undefined;
  }

  getInsertionOptions(
    options?: Readonly<ApplicationShellLayout.WidgetOptions>,
  ): { area: string; addOptions: TheiaDockPanel.AddOptions } {
    let ref: Widget | undefined = options?.ref;
    let area: ApplicationShellLayout.Area = options?.area || "main";
    if (!ref && area === "main") {
      const tabBar = this.getTabBarFor(area);
      ref =
        (tabBar && tabBar.currentTitle && tabBar.currentTitle.owner) ||
        undefined;
    }
    // make sure that ref belongs to area
    area = (ref && this.getAreaFor(ref)) || area;
    const addOptions: TheiaDockPanel.AddOptions = {};
    if (ApplicationShellLayout.isOpenToSideMode(options?.mode)) {
      const areaPanel = area === "main" ? this.mainPanel : undefined;
      const sideRef =
        areaPanel &&
        ref &&
        (options?.mode === "open-to-left"
          ? areaPanel.previousTabBarWidget(ref)
          : areaPanel.nextTabBarWidget(ref));
      if (sideRef) {
        addOptions.ref = sideRef;
      } else {
        addOptions.ref = ref;
        addOptions.mode =
          options?.mode === "open-to-left" ? "split-left" : "split-right";
      }
    } else if (ApplicationShellLayout.isReplaceMode(options?.mode)) {
      addOptions.ref = options?.ref;
      addOptions.closeRef = true;
      addOptions.mode = "tab-after";
    } else {
      addOptions.ref = ref;
      addOptions.mode = options?.mode;
    }
    return { area, addOptions };
  }

  /**
   * The widgets contained in the given shell area.
   */
  getWidgets(area: ApplicationShellLayout.Area): Widget[] {
    switch (area) {
      case "main":
        return toArray(this.mainPanel.widgets());
      default:
        throw new Error("Illegal argument: " + area);
    }
  }

  /**
   * Find the widget that contains the given HTML element. The returned widget may be one
   * that is managed by the application shell, or one that is embedded in another widget and
   * not directly managed by the shell, or a tab bar.
   */
  findWidgetForElement(element: HTMLElement): Widget | undefined {
    let widgetNode: HTMLElement | null = element;
    while (widgetNode && !widgetNode.classList.contains("lm-Widget")) {
      widgetNode = widgetNode.parentElement;
    }
    if (widgetNode) {
      return this.findWidgetForNode(widgetNode, this);
    }
    return undefined;
  }

  private findWidgetForNode(
    widgetNode: HTMLElement,
    widget: Widget,
  ): Widget | undefined {
    if (widget.node === widgetNode) {
      return widget;
    }
    let result: Widget | undefined;
    each(widget.children(), (child) => {
      result = this.findWidgetForNode(widgetNode, child);
      return !result;
    });
    return result;
  }

  /**
   * Finds the title widget from the tab-bar.
   * @param tabBar used for providing an array of titles.
   * @returns the selected title widget, else returns the currentTitle or undefined.
   */
  findTitle(tabBar: TabBar<Widget>, event?: Event): Title<Widget> | undefined {
    if (event?.target instanceof HTMLElement) {
      const tabNode = event.target;

      const titleIndex = Array.from(
        tabBar.contentNode.getElementsByClassName("lm-TabBar-tab"),
      ).findIndex((node) => node.contains(tabNode));

      if (titleIndex !== -1) {
        return tabBar.titles[titleIndex];
      }
    }
    return tabBar.currentTitle || undefined;
  }

  /**
   * Finds the tab-bar widget.
   * @returns the selected tab-bar, else returns the currentTabBar.
   */
  findTabBar(event?: Event): TabBar<Widget> | undefined {
    if (event?.target instanceof HTMLElement) {
      const tabBar = this.findWidgetForElement(event.target);
      if (tabBar instanceof TabBar) {
        return tabBar;
      }
    }
    return this.currentTabBar;
  }

  /**
   *  @returns the widget whose title has been targeted by a DOM event on a tabbar, or undefined if none can be found.
   */
  findTargetedWidget(event?: Event): Widget | undefined {
    if (event) {
      const tab = this.findTabBar(event);
      const title = tab && this.findTitle(tab, event);
      return title && title.owner;
    }
  }

  /**
   * Return the tab bar in the given shell area, or the tab bar that has the given widget, or undefined.
   */
  getTabBarFor(
    widgetOrArea: Widget | ApplicationShellLayout.Area,
  ): TabBar<Widget> | undefined {
    if (typeof widgetOrArea === "string") {
      switch (widgetOrArea) {
        case "main":
          return this.mainPanel.currentTabBar;
        default:
          throw new Error("Illegal argument: " + widgetOrArea);
      }
    }
    const widget = this.toTrackedStack(widgetOrArea.id).pop();
    if (!widget) {
      return undefined;
    }
    const widgetTitle = widget.title;
    const mainPanelTabBar = this.mainPanel.findTabBar(widgetTitle);
    if (mainPanelTabBar) {
      return mainPanelTabBar;
    }
    return undefined;
  }

  /**
   * The tab bars contained in the main shell area. If there is no widget in the main area, the
   * returned array is empty.
   */
  get mainAreaTabBars(): TabBar<Widget>[] {
      return toArray(this.mainPanel.tabBars());
  }

  /**
   * The shell area name of the currently active tab, or undefined.
   */
  get currentTabArea(): ApplicationShellLayout.Area | undefined {
    const currentWidget = this.currentWidget;
    if (currentWidget) {
        return this.getAreaFor(currentWidget);
    }
  }
  
  /**
   * Determine the name of the shell area where the given widget resides. The result is
   * undefined if the widget does not reside directly in the shell.
   */
  getAreaFor(
    input: TabBar<Widget> | Widget,
  ): ApplicationShellLayout.Area | undefined {
    if (input instanceof TabBar) {
      if (find(this.mainPanel.tabBars(), (tb) => tb === input)) {
        return "main";
      }
    }
    const widget = this.toTrackedStack(input.id).pop();
    if (!widget) {
      return undefined;
    }
    const title = widget.title;
    const mainPanelTabBar = this.mainPanel.findTabBar(title);
    if (mainPanelTabBar) {
      return "main";
    }
    return;
  }

  /**
   * Test whether there is a dirty widget.
   */
  canSaveAll(): boolean {
    return this.tracker.widgets.some((widget) =>
      this.saveableService.canSave(widget),
    );
  }

  /**
   * Save all dirty widgets.
   */
  async saveAll(options?: SaveOptions): Promise<void> {
    for (const widget of this.widgets) {
      if (
        Saveable.isDirty(widget) &&
        this.saveableService.canSaveNotSaveAs(widget)
      ) {
        await this.saveableService.save(widget, options);
      }
    }
  }

  /**
   * Returns a snapshot of all tracked widgets to allow async modifications.
   */
  get widgets(): ReadonlyArray<Widget> {
    return [...this.tracker.widgets];
  }

  getWidgetById(id: string): Widget | undefined {
    for (const widget of this.tracker.widgets) {
      if (widget.id === id) {
        return widget;
      }
    }
    return undefined;
  }

  /**
   * @returns an array of Widgets, all of which are tracked by the focus tracker
   * The first member of the array is the widget whose id is passed in, and the other widgets
   * are its tracked parents in ascending order
   */
  protected toTrackedStack(id: string): Widget[] {
    const tracked = new Map<string, Widget>(
      this.tracker.widgets.map((w) => [w.id, w] as [string, Widget]),
    );
    let current = tracked.get(id);
    const stack: Widget[] = [];
    while (current) {
      if (tracked.has(current.id)) {
        stack.push(current);
      }
      current = current.parent || undefined;
    }
    return stack;
  }

  /**
   * Close all tabs or a selection of tabs in a specific part of the application shell.
   *
   * @param tabBarOrArea
   *      Either the name of a shell area or a `TabBar` that is contained in such an area.
   * @param filter
   *      If undefined, all tabs are closed; otherwise only those tabs that match the filter are closed.
   */
  async closeTabs(tabBarOrArea: TabBar<Widget> | ApplicationShellLayout.Area,
      filter?: (title: Title<Widget>, index: number) => boolean): Promise<void> {
      const titles: Array<Title<Widget>> = this.getWidgetTitles(tabBarOrArea, filter);
      if (titles.length) {
          await this.closeMany(titles.map(title => title.owner));
      }
  }

  saveTabs(tabBarOrArea: TabBar<Widget> | ApplicationShellLayout.Area,
      filter?: (title: Title<Widget>, index: number) => boolean): void {

      const titles = this.getWidgetTitles(tabBarOrArea, filter);
      for (let i = 0; i < titles.length; i++) {
          const widget = titles[i].owner;
          const saveable = Saveable.get(widget);
          saveable?.save();
      }
  }

  /**
   * Collects all widget titles for the given tab bar or area and optionally filters them.
   *
   * @param tabBarOrArea The tab bar or area to retrieve the widget titles for
   * @param filter The filter to apply to the result
   * @returns The filtered array of widget titles or an empty array
   */
  protected getWidgetTitles(tabBarOrArea: TabBar<Widget> | ApplicationShellLayout.Area,
      filter?: (title: Title<Widget>, index: number) => boolean): Title<Widget>[] {

      const titles: Title<Widget>[] = [];
      if (tabBarOrArea === 'main') {
          this.mainAreaTabBars.forEach(tabbar => titles.push(...toArray(tabbar.titles)));
      } else if (typeof tabBarOrArea === 'string') {
          const tabbar = this.getTabBarFor(tabBarOrArea);
          if (tabbar) {
              titles.push(...toArray(tabbar.titles));
          }
      } else if (tabBarOrArea) {
          titles.push(...toArray(tabBarOrArea.titles));
      }

      return filter ? titles.filter(filter) : titles;
  }

  /**
   * @param targets the widgets to be closed
   * @return an array of all the widgets that were actually closed.
   */
  async closeMany(
    targets: Widget[],
    options?: ApplicationShellLayout.CloseOptions,
  ): Promise<Widget[]> {
    // if (
    //   options?.save === false ||
    //   (await Saveable.confirmSaveBeforeClose(
    //     targets,
    //     this.widgets.filter((widget) => !targets.includes(widget)),
    //   ))
    if (
      !options?.save
    ) {
      return (
        await Promise.all(
          targets.map((target) => this.closeWidget(target.id, options)),
        )
      ).filter((widget): widget is Widget => widget !== undefined);
    }
    return [];
  }

  /**
   * @returns the widget that was closed, if any, `undefined` otherwise.
   *
   * If your use case requires closing multiple widgets, use {@link ApplicationShell#closeMany} instead. That method handles closing saveable widgets more reliably.
   */
  async closeWidget(
    id: string,
    options?: ApplicationShellLayout.CloseOptions,
  ): Promise<Widget | undefined> {
    // TODO handle save for composite widgets, i.e. the preference widget has 2 editors
    const stack = this.toTrackedStack(id);
    const current = stack.pop();
    if (!current) {
      return undefined;
    }
    const saveableOptions = options && { shouldSave: () => options.save };
    const pendingClose = SaveableWidget.is(current)
      ? current.closeWithSaving(saveableOptions)
      : (current.close(), waitForClosed(current));
    await Promise.all([pendingClose]);
    return stack[0] || current;
  }

  /**
   * 创建应用外壳
   */
  private createAppShell(): Panel {
    const appShell = new Panel();
    appShell.id = "applicon-shell";
    appShell.addClass("applicon-shell");
    appShell.addClass("monaco-component");
    appShell.node.style.height = "100vh";
    appShell.node.style.display = "flex";
    appShell.node.style.flexDirection = "column";
    return appShell;
  }

  /**
   * 创建导航栏
   */
  private createNavBar(): Panel {
    const topPanel = new BoxPanel({ direction: "left-to-right" });
    topPanel.id = "magic-idea-top-panel";
    topPanel.addClass("nav-bar");
    topPanel.node.style.height = "40px";
    // 整个顶部面板可拖拽
    if(isTauri()){
      topPanel.node.setAttribute("data-tauri-drag-region", "");
    }
    // 菜单栏组件
    // const leftTopPanel = new MenubarWidget(this._commands, this._menuManager);
    const leftTopPanel = new Panel();
    leftTopPanel.id = 'left-top-panel';
    this.topPanel = leftTopPanel;
    // 导航组件
    const breadcrumbWidget = new BreadcrumbWidget(this.commands);
    // 工具栏组件
    const toolbarWidget = new ToolbarWidget(
      this._commands,
      this.toolbarService,
      this.activityManager,
    );
    topPanel.addWidget(leftTopPanel);
    topPanel.addWidget(breadcrumbWidget);
    topPanel.addWidget(toolbarWidget);
    // 设置尺寸
    BoxPanel.setStretch(leftTopPanel, 1);
    BoxPanel.setStretch(breadcrumbWidget, 1);
    BoxPanel.setStretch(toolbarWidget, 1);
    return topPanel;
  }

  /**
   * 创建内容面板
   */
  private createContentPanel(): Panel {
    const contentPanel = new Panel();
    contentPanel.id = "content-panel";
    contentPanel.addClass("content-panel");
    contentPanel.node.style.display = "flex";
    contentPanel.node.style.flexDirection = "row";
    return contentPanel;
  }

  /**
   * 创建左侧边栏
   */
  private createLeftSidebar(): NavTabBar {
    const sideBarLeft = new NavTabBar();
    sideBarLeft.id = "side-bar-left";
    sideBarLeft.addClass("side-bar-left");
    sideBarLeft.addClass("left-container");
    sideBarLeft.node.style.width = "48px";
    return sideBarLeft;
  }

  /**
   * 创建右侧边栏
   */
  private createRightSidebar(): NavTabBar {
    const sideBarRight = new NavTabBar();
    sideBarRight.id = "side-bar-right";
    sideBarRight.addClass("side-bar-right");
    sideBarRight.node.style.width = "48px";
    return sideBarRight;
  }

  /**
   * 创建主面板
   */
  private createMainPanel(): SplitPanel {
    const mainPanel = new SplitPanel({
      orientation: "vertical",
      spacing: this.spacing,
    });
    mainPanel.id = "main-panel";
    mainPanel.addClass("main-panel");
    mainPanel.node.style.width = "100%";
    mainPanel.node.style.height = "calc(100vh - 69px)";
    mainPanel.node.style.display = "flex";
    return mainPanel;
  }

  /**
   * 创建顶部内容区域
   */
  private createTopContentMain(): SplitPanel {
    const topContentMain = new SplitPanel({
      orientation: "horizontal",
      spacing: this.spacing,
    });
    topContentMain.id = "top-content-main";
    return topContentMain;
  }

  /**
   * 创建左侧内容面板
   */
  private createLeftContentPanel(): StackedPanel {
    const leftContentPanel = new StackedPanel();
    leftContentPanel.id = "left-content-panel";
    leftContentPanel.title.label = "左侧面板";
    leftContentPanel.addClass("left-content-panel");
    leftContentPanel.node.style.minWidth = "100px";
    return leftContentPanel;
  }

  /**
   * 创建右侧内容面板
   */
  private createRightContentPanel(): StackedPanel {
    const rightContentPanel = new StackedPanel();
    rightContentPanel.id = "right-content-panel";
    rightContentPanel.title.label = "右侧面板";
    rightContentPanel.addClass("right-content-panel");
    rightContentPanel.node.style.minWidth = "100px";
    return rightContentPanel;
  }

  /**
   * 创建底部内容面板
   */
  private createBottomContentPanel(): StackedPanel {
    const bottomContentPanel = new StackedPanel();
    bottomContentPanel.id = "bottom-content-panel";
    bottomContentPanel.addClass("bottom-content-panel");
    bottomContentPanel.node.style.minHeight = "100px";
    return bottomContentPanel;
  }

  /**
   * 组装布局
   */
  private assembleLayout(): void {
    // 组装顶部内容区域
    this._topContentMain.addWidget(this._leftContentPanel);
    const mainDockPanel = this.createMainDockPanel();
    // this.tracker.add(mainDockPanel);
    this._topContentMain.addWidget(mainDockPanel);
    this._topContentMain.addWidget(this._rightContentPanel);

    // 组装主面板
    this._mainPanel.addWidget(this._topContentMain);
    this._mainPanel.addWidget(this._bottomContentPanel);

    // 组装内容面板
    if (this._sideBarLeft) {
      this._contentPanel.addWidget(this._sideBarLeft);
    }
    this._contentPanel.addWidget(this._mainPanel);
    if (this._sideBarRight) {
      this._contentPanel.addWidget(this._sideBarRight);
    }

    // 组装应用外壳（React Widget 也遵循 Lumino Widget）
    if (this._navBar) {
      this._appShell.addWidget(this._navBar);
    }
    this._appShell.addWidget(this._contentPanel);
    if (this._statusBar) {
      this._appShell.addWidget(this._statusBar);
    }

    // 设置当前widget
    this.node.appendChild(this._appShell.node);
  }

  protected readonly onDidAddWidgetEmitter = new Emitter<Widget>();
  readonly onDidAddWidget = this.onDidAddWidgetEmitter.event;
  protected fireDidAddWidget(widget: Widget): void {
    this.onDidAddWidgetEmitter.fire(widget);
  }

  protected readonly onDidRemoveWidgetEmitter = new Emitter<Widget>();
  readonly onDidRemoveWidget = this.onDidRemoveWidgetEmitter.event;
  protected fireDidRemoveWidget(widget: Widget): void {
    this.onDidRemoveWidgetEmitter.fire(widget);
  }

  /**
   * Create the dock panel in the main shell area.
   */
  protected createMainDockPanel(): TheiaDockPanel {
    const renderer = this.dockPanelRendererFactory();
    renderer.tabBarClasses.push(MAIN_BOTTOM_AREA_CLASS);
    renderer.tabBarClasses.push(MAIN_AREA_CLASS);
    this._mainPanelRenderer = renderer;
    const dockPanel = this.dockPanelFactory(
      {
        mode: "multiple-document",
        renderer,
        spacing: 0,
      },
      (area) => this.doToggleMaximized(area),
    );
    dockPanel.id = MAIN_AREA_ID;
    dockPanel.widgetAdded.connect((_, widget) => this.fireDidAddWidget(widget));
    dockPanel.widgetRemoved.connect((_, widget) =>
      this.fireDidRemoveWidget(widget),
    );
    this._mainDockPanel = dockPanel;
    
    const handler = (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "link";
        e.preventDefault();
        e.stopPropagation();
      }
    };
    dockPanel.node.addEventListener("dragover", handler);
    dockPanel.node.addEventListener("dragenter", handler);

    return dockPanel;
  }

  protected readonly onDidToggleMaximizedEmitter = new Emitter<Widget>();
  readonly onDidToggleMaximized = this.onDidToggleMaximizedEmitter.event;

  protected unmaximize: (() => void) | undefined;

  doToggleMaximized(area: TheiaDockPanel): void {
    if (this.unmaximize) {
      this.unmaximize();
      this.unmaximize = undefined;
      return;
    }

    const removedListener = () => {
      if (!area.widgets().next().value) {
        this.doToggleMaximized(area);
      }
    };

    const parent = area.parent as SplitPanel;
    const layout = area.parent?.layout as SplitLayout;
    const sizes = layout.relativeSizes().slice();
    const stretch = SplitPanel.getStretch(area);
    const index = parent.widgets.indexOf(area);
    parent.layout?.removeWidget(area);

    // eslint-disable-next-line no-null/no-null
    this.maximizedElement.style.display = "block";
    area.addClass(MAXIMIZED_CLASS);
    const topRect = this._navBar.node.getBoundingClientRect();
    UnsafeWidgetUtilities.attach(area, this.maximizedElement);
    this.maximizedElement.style.top = `${topRect.bottom}px`;
    area.fit();
    const observer = new ResizeObserver((entries) => {
      area.fit();
    });
    observer.observe(this.maximizedElement);

    this.unmaximize = () => {
      observer.unobserve(this.maximizedElement);
      observer.disconnect();
      this.maximizedElement.style.display = "none";
      area.removeClass(MAXIMIZED_CLASS);
      if (area.isAttached) {
        UnsafeWidgetUtilities.detach(area);
      }
      parent?.insertWidget(index, area);
      SplitPanel.setStretch(area, stretch);
      layout.setRelativeSizes(sizes);
      parent.fit();
      this.onDidToggleMaximizedEmitter.fire(area);
      area.widgetRemoved.disconnect(removedListener);
    };

    area.widgetRemoved.connect(removedListener);
    this.onDidToggleMaximizedEmitter.fire(area);
  }

  /**
   * 创建活动管理器
   */
  private createActivityManager(): ActivityManager {
    return new ActivityManager(
      this._sideBarLeft,
      this._sideBarRight,
      this._leftContentPanel,
      this._rightContentPanel,
      this._bottomContentPanel,
      this._topContentMain,
      this._mainPanel,
      this._commands,
      this.tracker,
      this.toolbarService,
    );
  }

  /**
   * 获取活动管理器
   */
  get activityManager(): ActivityManager {
    return this._activityManager;
  }

  /**
   * 获取命令管理器
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * 获取快捷键管理器
   */
  get keybindings(): KeybindingRegistry {
    return this._keybindings;
  }

  /**
   * 获取主面板
   */
  get mainPanel(): TheiaDockPanel {
    return this._mainDockPanel;
  }

  /**
   * 获取左侧内容面板
   */
  get leftContentPanel(): StackedPanel {
    return this._leftContentPanel;
  }

  /**
   * 获取右侧内容面板
   */
  get rightContentPanel(): StackedPanel {
    return this._rightContentPanel;
  }

  /**
   * 获取底部内容面板
   */
  get bottomContentPanel(): StackedPanel {
    return this._bottomContentPanel;
  }

  /**
   * 更新布局尺寸
   */
  updateLayout(): void {
    this._appShell.update();
  }

  /**
   * Create an object that describes the current shell layout. This object may contain references
   * to widgets; these need to be transformed before the layout can be serialized.
   */
  getLayoutData(): ApplicationShellLayout.LayoutData {
    return {
      version: applicationShellLayoutVersion,
      mainPanel: this.mainPanel.saveLayout(),
      activeWidgetId: this.activeWidget ? this.activeWidget.id : undefined
    };
  }

  /**
   * Apply a shell layout that has been previously created with `getLayoutData`.
   */
  async setLayoutData(layoutData: ApplicationShellLayout.LayoutData): Promise<void> {
      const { mainPanel, activeWidgetId } = layoutData;
      if (mainPanel && mainPanel.main) {
        this.mainPanel.restoreLayout(mainPanel);
        this.registerWithFocusTracker(mainPanel.main);
        const widgets = toArray(this.mainPanel.widgets());
        // We don't store information about the last active tabbar
        // So we simply mark the first as being active
        this.mainPanel.markActiveTabBar(widgets[0]?.title);
      }
      if (activeWidgetId) {
        this.activateWidget(activeWidgetId);
      }
  }

  /**
   * 附加到DOM
   */
  attachTo(container: HTMLElement): void {
    Widget.attach(this._appShell, container);
    // 添加通知中心UI（同样挂载到 Dom 容器）
    Widget.attach(this.notificationWidget, container);
    this.updateLayout();
  }

  /**
   * 处理窗口大小变化
   */
  handleResize(): void {
    this.updateLayout();
  }

  dispose(): void {
    super.dispose();
    this.toDisposeOnActiveChanged.dispose();
    this.notificationWidget.dispose();
    // 如果容器有其他 Lumino Widget，也需要在这里 dispose 掉
  }
}

export namespace ApplicationShellLayout {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area =
    | "main"
    | "top"
    | "left"
    | "right"
    | "bottom"
    | "secondaryWindow";

  /**
   * Options for adding a widget to the application shell.
   */
  export interface WidgetOptions {
    /**
     * The area of the application shell where the widget will reside.
     */
    area?: Area;
    /**
     * The insertion mode for adding the widget.
     *
     * The default is `'tab-after'`.
     */
    mode?: DockLayout.InsertMode;
    /**
     * The reference widget for the insert location.
     *
     * The default is `undefined`.
     */
    ref?: Widget;

    /**
     * The rank order of the widget among its siblings.
     */
    rank?: number;
  }

  export interface CloseOptions {
    /**
     * if optional then a user will be prompted
     * if undefined then close will be canceled
     * if true then will be saved on close
     * if false then won't be saved on close
     */
    save?: boolean | undefined;
  }

  /**
   * Data to save and load the application shell layout.
   */
  export interface LayoutData {
    version?: string | ApplicationShellLayoutVersion,
    mainPanel?: DockPanel.ILayoutConfig;
    mainPanelPinned?: boolean[];
    activeWidgetId?: string;
  }

  /**
   * Whether a widget should be opened to the side tab bar relatively to the reference widget.
   */
  export type OpenToSideMode = "open-to-left" | "open-to-right";

  export function isOpenToSideMode(mode: unknown): mode is OpenToSideMode {
    return mode === "open-to-left" || mode === "open-to-right";
  }

  /**
   * Whether the `ref` of the options widget should be replaced.
   */
  export type ReplaceMode = "tab-replace";

  export function isReplaceMode(mode: unknown): mode is ReplaceMode {
    return mode === "tab-replace";
  }

  /**
   * Exposes widgets which activation state should be tracked by shell.
   */
  export interface TrackableWidgetProvider {
    getTrackableWidgets(): Widget[];
    readonly onDidChangeTrackableWidgets?: CommonEvent<Widget[]>;
    /**
     * Make visible and focus a trackable widget for the given id.
     * If not implemented then `activate` request will be sent to a child widget directly.
     */
    activateWidget?(id: string): Widget | undefined;
    /**
     * Make visible a trackable widget for the given id.
     * If not implemented then a widget should be always visible when an owner is visible.
     */
    revealWidget?(id: string): Widget | undefined;
  }

  export namespace TrackableWidgetProvider {
    export function is(widget: unknown): widget is TrackableWidgetProvider {
      return isObject(widget) && "getTrackableWidgets" in widget;
    }
  }
}
