import { TabBar, Panel, StackedPanel, Widget, FocusTracker, DockLayout, DockPanel, Title } from "@lumino/widgets";
import { CommandRegistry } from "@lumino/commands";
import { DisposableCollection, Emitter, IEvent as CommonEvent } from "../common";
import { KeybindingRegistry } from "../keybinding/keybinding-registry";
import { ActivityManager } from "../nav-activity/nav-activity-manager";
import { StatusBarWidget } from "../statusbar";
import { ToolbarService } from "./toolbar/toolbar-types";
import { ThemeService } from "../theme/theme-service";
import { SaveableService } from '../saveable-service';
import { SaveOptions } from '../saveable';
import { NotificationCenterWidget } from "../notification/notification-widget";
import { TabBarToolbarRegistry, TabBarToolbarFactory } from './tab-bar-toolbar';
import { MainDockPanel as TheiaDockPanel } from "./main-dock-panel";
import { TabBarRendererFactory, ToolbarAwareTabBar } from "./tab-bars";
/** The class name added to ApplicationShell instances. */
export declare const APPLICATION_SHELL_CLASS = "theia-ApplicationShell";
/** The class name added to the main and bottom area panels. */
export declare const MAIN_BOTTOM_AREA_CLASS = "theia-app-centers";
/** Status bar entry identifier for the bottom panel toggle button. */
export declare const BOTTOM_PANEL_TOGGLE_ID = "bottom-panel-toggle";
/** The class name added to the main area panel. */
export declare const MAIN_AREA_CLASS = "theia-app-main";
/** The class name added to the bottom area panel. */
export declare const BOTTOM_AREA_CLASS = "theia-app-bottom";
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
export declare const applicationShellLayoutVersion: ApplicationShellLayoutVersion;
export declare const DockPanelRendererFactory: unique symbol;
export interface DockPanelRendererFactory {
    (document?: Document | ShadowRoot): DockPanelRenderer;
}
/**
 * A renderer for dock panels that supports context menus on tabs.
 */
export declare class DockPanelRenderer implements DockLayout.IRenderer {
    protected readonly tabBarRendererFactory: TabBarRendererFactory;
    protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry;
    protected readonly tabBarToolbarFactory: TabBarToolbarFactory;
    readonly tabBarClasses: string[];
    /**
     * In case of DockPanels rendered in secondary windows, will be set
     * to the document of that window
     */
    document?: Document | ShadowRoot;
    private readonly onDidCreateTabBarEmitter;
    constructor(tabBarRendererFactory: TabBarRendererFactory, tabBarToolbarRegistry: TabBarToolbarRegistry, tabBarToolbarFactory: TabBarToolbarFactory);
    get onDidCreateTabBar(): CommonEvent<TabBar<Widget>>;
    createTabBar(): TabBar<Widget>;
    createHandle(): HTMLDivElement;
    protected onCurrentTabChanged(sender: ToolbarAwareTabBar, { currentIndex }: TabBar.ICurrentChangedArgs<Widget>): void;
}
export declare const MAXIMIZED_CLASS = "theia-maximized";
/**
 * 应用布局组件
 */
export declare class ApplicationShellLayout extends Widget {
    protected dockPanelRendererFactory: () => DockPanelRenderer;
    protected readonly dockPanelFactory: TheiaDockPanel.Factory;
    private toolbarService;
    private themeService;
    private notificationWidget;
    protected readonly saveableService: SaveableService;
    private _statusBar;
    private _commands;
    private _keybindings;
    private _appShell;
    private _navBar;
    private _contentPanel;
    private _sideBarLeft;
    private _sideBarRight;
    private _mainPanel;
    private _mainDockPanel;
    private _topContentMain;
    private _leftContentPanel;
    private _rightContentPanel;
    private _bottomContentPanel;
    private _activityManager;
    /**
     * The fixed-size panel shown on top. This one usually holds the main menu.
     */
    topPanel: Panel;
    private _mainPanelRenderer;
    get mainPanelRenderer(): DockPanelRenderer;
    private spacing;
    private readonly tracker;
    protected readonly toDisposeOnActiveChanged: DisposableCollection;
    protected readonly maximizedElement: HTMLElement;
    protected readonly onDidChangeActiveWidgetEmitter: Emitter<FocusTracker.IChangedArgs<Widget>>;
    readonly onDidChangeActiveWidget: CommonEvent<FocusTracker.IChangedArgs<Widget>>;
    protected readonly onDidChangeCurrentWidgetEmitter: Emitter<FocusTracker.IChangedArgs<Widget>>;
    readonly onDidChangeCurrentWidget: CommonEvent<FocusTracker.IChangedArgs<Widget>>;
    private readonly activationTimeout;
    constructor(dockPanelRendererFactory: () => DockPanelRenderer, dockPanelFactory: TheiaDockPanel.Factory, commands: CommandRegistry, keybindingRegistry: KeybindingRegistry, statusbar: StatusBarWidget, toolbarService: ToolbarService, themeService: ThemeService, notificationWidget: NotificationCenterWidget, saveableService: SaveableService);
    /**
     * The current widget in the application shell. The current widget is the last widget that
     * was active and not yet closed. See the remarks to `activeWidget` on what _active_ means.
     */
    get currentWidget(): Widget | undefined;
    /**
     * The active widget in the application shell. The active widget is the one that has focus
     * (either the widget itself or any of its contents).
     *
     * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
     * widget implementation which DOM element will get the focus. The default implementation
     * does not take any focus; in that case the widget is never returned by this property.
     */
    get activeWidget(): Widget | undefined;
    /**
     * Handle a change to the current widget.
     */
    private onCurrentChanged;
    /**
     * Handle a change to the active widget.
     */
    private onActiveChanged;
    /**
     * Find the shell panel this top-level widget is part of
     */
    protected findPanel(widget: Widget | undefined): TheiaDockPanel | undefined;
    /**
     * Return the tab bar that has the currently active widget, or undefined.
     */
    get currentTabBar(): TabBar<Widget> | undefined;
    activateNextTabBar(current?: TabBar<Widget> | undefined): boolean;
    /**
     * Return the tab bar next to the given tab bar; return the given tab bar if there is no adjacent one.
     */
    nextTabBar(current?: TabBar<Widget> | undefined): TabBar<Widget> | undefined;
    activateNextTabInTabBar(current?: TabBar<Widget> | undefined): boolean;
    nextTabIndexInTabBar(current?: TabBar<Widget> | undefined): number;
    activatePreviousTabBar(current?: TabBar<Widget> | undefined): boolean;
    /**
     * Return the tab bar previous to the given tab bar; return the given tab bar if there is no adjacent one.
     */
    previousTabBar(current?: TabBar<Widget> | undefined): TabBar<Widget> | undefined;
    /**
     * Track all widgets that are referenced by the given layout data.
     */
    protected registerWithFocusTracker(data: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig): void;
    /**
     * Add a widget to the application shell. The given widget must have a unique `id` property,
     * which will be used as the DOM id.
     *
     * Widgets are removed from the shell by calling their `close` or `dispose` methods.
     *
     * Widgets added to the top area are not tracked regarding the _current_ and _active_ states.
     */
    addWidget(widget: Widget, options?: Readonly<ApplicationShellLayout.WidgetOptions>): Promise<void>;
    /**
     * Track the given widget so it is considered in the `current` and `active` state of the shell.
     */
    protected track(widget: Widget): void;
    /**
     * Focus is taken by a widget through the `onActivateRequest` method. It is up to the
     * widget implementation which DOM element will get the focus. The default implementation
     * of Widget does not take any focus. This method can help finding such problems by logging
     * a warning in case a widget was explicitly activated, but did not trigger a change of the
     * `activeWidget` property.
     */
    private checkActivation;
    private readonly toDisposeOnActivationCheck;
    private assertActivated;
    /**
     * Reveal a widget in the application shell. This makes the widget visible,
     * but does not activate it.
     *
     * @returns the revealed widget if it was found
     */
    revealWidget(id: string): Promise<Widget | undefined>;
    /**
     * Reveal top-level area widget.
     */
    protected doRevealWidget(id: string): Widget | undefined;
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
    activateWidget(id: string): Promise<Widget | undefined>;
    waitForActivation(id: string): Promise<void>;
    /**
     * Activate top-level area widget.
     */
    protected doActivateWidget(id: string): Widget | undefined;
    getInsertionOptions(options?: Readonly<ApplicationShellLayout.WidgetOptions>): {
        area: string;
        addOptions: TheiaDockPanel.AddOptions;
    };
    /**
     * The widgets contained in the given shell area.
     */
    getWidgets(area: ApplicationShellLayout.Area): Widget[];
    /**
     * Find the widget that contains the given HTML element. The returned widget may be one
     * that is managed by the application shell, or one that is embedded in another widget and
     * not directly managed by the shell, or a tab bar.
     */
    findWidgetForElement(element: HTMLElement): Widget | undefined;
    private findWidgetForNode;
    /**
     * Finds the title widget from the tab-bar.
     * @param tabBar used for providing an array of titles.
     * @returns the selected title widget, else returns the currentTitle or undefined.
     */
    findTitle(tabBar: TabBar<Widget>, event?: Event): Title<Widget> | undefined;
    /**
     * Finds the tab-bar widget.
     * @returns the selected tab-bar, else returns the currentTabBar.
     */
    findTabBar(event?: Event): TabBar<Widget> | undefined;
    /**
     *  @returns the widget whose title has been targeted by a DOM event on a tabbar, or undefined if none can be found.
     */
    findTargetedWidget(event?: Event): Widget | undefined;
    /**
     * Return the tab bar in the given shell area, or the tab bar that has the given widget, or undefined.
     */
    getTabBarFor(widgetOrArea: Widget | ApplicationShellLayout.Area): TabBar<Widget> | undefined;
    /**
     * The tab bars contained in the main shell area. If there is no widget in the main area, the
     * returned array is empty.
     */
    get mainAreaTabBars(): TabBar<Widget>[];
    /**
     * The shell area name of the currently active tab, or undefined.
     */
    get currentTabArea(): ApplicationShellLayout.Area | undefined;
    /**
     * Determine the name of the shell area where the given widget resides. The result is
     * undefined if the widget does not reside directly in the shell.
     */
    getAreaFor(input: TabBar<Widget> | Widget): ApplicationShellLayout.Area | undefined;
    /**
     * Test whether there is a dirty widget.
     */
    canSaveAll(): boolean;
    /**
     * Save all dirty widgets.
     */
    saveAll(options?: SaveOptions): Promise<void>;
    /**
     * Returns a snapshot of all tracked widgets to allow async modifications.
     */
    get widgets(): ReadonlyArray<Widget>;
    getWidgetById(id: string): Widget | undefined;
    /**
     * @returns an array of Widgets, all of which are tracked by the focus tracker
     * The first member of the array is the widget whose id is passed in, and the other widgets
     * are its tracked parents in ascending order
     */
    protected toTrackedStack(id: string): Widget[];
    /**
     * Close all tabs or a selection of tabs in a specific part of the application shell.
     *
     * @param tabBarOrArea
     *      Either the name of a shell area or a `TabBar` that is contained in such an area.
     * @param filter
     *      If undefined, all tabs are closed; otherwise only those tabs that match the filter are closed.
     */
    closeTabs(tabBarOrArea: TabBar<Widget> | ApplicationShellLayout.Area, filter?: (title: Title<Widget>, index: number) => boolean): Promise<void>;
    saveTabs(tabBarOrArea: TabBar<Widget> | ApplicationShellLayout.Area, filter?: (title: Title<Widget>, index: number) => boolean): void;
    /**
     * Collects all widget titles for the given tab bar or area and optionally filters them.
     *
     * @param tabBarOrArea The tab bar or area to retrieve the widget titles for
     * @param filter The filter to apply to the result
     * @returns The filtered array of widget titles or an empty array
     */
    protected getWidgetTitles(tabBarOrArea: TabBar<Widget> | ApplicationShellLayout.Area, filter?: (title: Title<Widget>, index: number) => boolean): Title<Widget>[];
    /**
     * @param targets the widgets to be closed
     * @return an array of all the widgets that were actually closed.
     */
    closeMany(targets: Widget[], options?: ApplicationShellLayout.CloseOptions): Promise<Widget[]>;
    /**
     * @returns the widget that was closed, if any, `undefined` otherwise.
     *
     * If your use case requires closing multiple widgets, use {@link ApplicationShell#closeMany} instead. That method handles closing saveable widgets more reliably.
     */
    closeWidget(id: string, options?: ApplicationShellLayout.CloseOptions): Promise<Widget | undefined>;
    /**
     * 创建应用外壳
     */
    private createAppShell;
    /**
     * 创建导航栏
     */
    private createNavBar;
    /**
     * 创建内容面板
     */
    private createContentPanel;
    /**
     * 创建左侧边栏
     */
    private createLeftSidebar;
    /**
     * 创建右侧边栏
     */
    private createRightSidebar;
    /**
     * 创建主面板
     */
    private createMainPanel;
    /**
     * 创建顶部内容区域
     */
    private createTopContentMain;
    /**
     * 创建左侧内容面板
     */
    private createLeftContentPanel;
    /**
     * 创建右侧内容面板
     */
    private createRightContentPanel;
    /**
     * 创建底部内容面板
     */
    private createBottomContentPanel;
    /**
     * 组装布局
     */
    private assembleLayout;
    protected readonly onDidAddWidgetEmitter: Emitter<Widget>;
    readonly onDidAddWidget: CommonEvent<Widget>;
    protected fireDidAddWidget(widget: Widget): void;
    protected readonly onDidRemoveWidgetEmitter: Emitter<Widget>;
    readonly onDidRemoveWidget: CommonEvent<Widget>;
    protected fireDidRemoveWidget(widget: Widget): void;
    /**
     * Create the dock panel in the main shell area.
     */
    protected createMainDockPanel(): TheiaDockPanel;
    protected readonly onDidToggleMaximizedEmitter: Emitter<Widget>;
    readonly onDidToggleMaximized: CommonEvent<Widget>;
    protected unmaximize: (() => void) | undefined;
    doToggleMaximized(area: TheiaDockPanel): void;
    /**
     * 创建活动管理器
     */
    private createActivityManager;
    /**
     * 获取活动管理器
     */
    get activityManager(): ActivityManager;
    /**
     * 获取命令管理器
     */
    get commands(): CommandRegistry;
    /**
     * 获取快捷键管理器
     */
    get keybindings(): KeybindingRegistry;
    /**
     * 获取主面板
     */
    get mainPanel(): TheiaDockPanel;
    /**
     * 获取左侧内容面板
     */
    get leftContentPanel(): StackedPanel;
    /**
     * 获取右侧内容面板
     */
    get rightContentPanel(): StackedPanel;
    /**
     * 获取底部内容面板
     */
    get bottomContentPanel(): StackedPanel;
    /**
     * 更新布局尺寸
     */
    updateLayout(): void;
    /**
     * Create an object that describes the current shell layout. This object may contain references
     * to widgets; these need to be transformed before the layout can be serialized.
     */
    getLayoutData(): ApplicationShellLayout.LayoutData;
    /**
     * Apply a shell layout that has been previously created with `getLayoutData`.
     */
    setLayoutData(layoutData: ApplicationShellLayout.LayoutData): Promise<void>;
    /**
     * 附加到DOM
     */
    attachTo(container: HTMLElement): void;
    /**
     * 处理窗口大小变化
     */
    handleResize(): void;
    dispose(): void;
}
export declare namespace ApplicationShellLayout {
    /**
     * The areas of the application shell where widgets can reside.
     */
    type Area = "main" | "top" | "left" | "right" | "bottom" | "secondaryWindow";
    /**
     * Options for adding a widget to the application shell.
     */
    interface WidgetOptions {
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
    interface CloseOptions {
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
    interface LayoutData {
        version?: string | ApplicationShellLayoutVersion;
        mainPanel?: DockPanel.ILayoutConfig;
        mainPanelPinned?: boolean[];
        activeWidgetId?: string;
    }
    /**
     * Whether a widget should be opened to the side tab bar relatively to the reference widget.
     */
    type OpenToSideMode = "open-to-left" | "open-to-right";
    function isOpenToSideMode(mode: unknown): mode is OpenToSideMode;
    /**
     * Whether the `ref` of the options widget should be replaced.
     */
    type ReplaceMode = "tab-replace";
    function isReplaceMode(mode: unknown): mode is ReplaceMode;
    /**
     * Exposes widgets which activation state should be tracked by shell.
     */
    interface TrackableWidgetProvider {
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
    namespace TrackableWidgetProvider {
        function is(widget: unknown): widget is TrackableWidgetProvider;
    }
}
