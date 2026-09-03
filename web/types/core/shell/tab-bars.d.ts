import PerfectScrollbar from 'perfect-scrollbar';
import { Root } from 'react-dom/client';
import { CommandRegistry } from '@lumino/commands';
import { TabBar, Title, Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { WidgetDecoration } from '../widget-decoration';
import { ContextMenuRenderer } from '../context-menu-renderer';
import { ContextKeyService } from '../context-key-service';
import { SelectionService } from "../selection-service";
import { TabBarToolbarRegistry, TabBarToolbar } from './tab-bar-toolbar';
import { MainDockPanel as TheiaDockPanel } from './main-dock-panel';
import { VirtualElement, ElementInlineStyle } from '@lumino/virtualdom';
import { DisposableCollection, MenuPath } from '../common';
/** Menu path for tab bars used throughout the application shell. */
export declare const SHELL_TABBAR_CONTEXT_MENU: MenuPath;
export declare const SHELL_TABBAR_CONTEXT_CLOSE: MenuPath;
export declare const SHELL_TABBAR_CONTEXT_COPY: MenuPath;
export declare const SHELL_TABBAR_SPLIT_SUBMENU: MenuPath;
export declare const SHELL_TABBAR_CONTEXT_PIN: MenuPath;
export declare const SHELL_TABBAR_CONTEXT_SPLIT: MenuPath;
export declare const TabBarRendererFactory: unique symbol;
export type TabBarRendererFactory = () => TabBarRenderer;
/**
 * Size information of DOM elements used for rendering tabs in side bars.
 */
export interface SizeData {
    width: number;
    height: number;
}
/**
 * Extension of the rendering data used for tabs in side bars of the application shell.
 */
export interface SideBarRenderData extends TabBar.IRenderData<Widget> {
    labelSize?: SizeData;
    iconSize?: SizeData;
    paddingTop?: number;
    paddingBottom?: number;
    visible?: boolean;
}
export interface ScrollableRenderData extends TabBar.IRenderData<Widget> {
    tabWidth?: number;
}
/**
 * A tab bar renderer that offers a context menu. In addition, this renderer is able to
 * set an explicit position and size on the icon and label of each tab in a side bar.
 * This is necessary because the elements of side bar tabs are rotated using the CSS
 * `transform` property, disrupting the browser's ability to arrange those elements
 * automatically.
 */
export declare class TabBarRenderer extends TabBar.Renderer {
    protected readonly contextMenuRenderer?: ContextMenuRenderer;
    protected readonly selectionService?: SelectionService;
    protected readonly commands?: CommandRegistry;
    protected readonly contextKeyService?: ContextKeyService;
    /**
     * The menu path used to render the context menu.
     */
    contextMenuPath?: MenuPath;
    protected readonly toDispose: DisposableCollection;
    constructor(contextMenuRenderer?: ContextMenuRenderer, selectionService?: SelectionService, commands?: CommandRegistry, contextKeyService?: ContextKeyService);
    dispose(): void;
    protected _tabBar?: TabBar<Widget>;
    protected readonly toDisposeOnTabBar: DisposableCollection;
    /**
     * A reference to the tab bar is required in order to activate it when a context menu
     * is requested.
     */
    set tabBar(tabBar: TabBar<Widget> | undefined);
    get tabBar(): TabBar<Widget> | undefined;
    /**
     * Render tabs with the default DOM structure, but additionally register a context menu listener.
     * @param {SideBarRenderData} data Data used to render the tab.
     * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
     * @param {boolean} isPartOfHiddenTabBar An optional check which determines if the tab is in the hidden horizontal tab bar.
     * @returns {VirtualElement} The virtual element of the rendered tab.
     */
    renderTab(data: SideBarRenderData, isInSidePanel?: boolean, isPartOfHiddenTabBar?: boolean): VirtualElement;
    createTabClass(data: SideBarRenderData): string;
    /**
     * Generate ID for an entry in the tab bar
     * @param {Title<Widget>} title Title of the widget controlled by this tab bar
     * @param {boolean} isPartOfHiddenTabBar Tells us if this entry is part of the hidden horizontal tab bar.
     *      If yes, add a suffix to differentiate it's ID from the entry in the visible tab bar
     * @returns {string} DOM element ID
     */
    createTabId(title: Title<Widget>, isPartOfHiddenTabBar?: boolean): string;
    /**
     * If size information is available for the label and icon, set an explicit height on the tab.
     * The height value also considers padding, which should be derived from CSS settings.
     */
    createTabStyle(data: SideBarRenderData & ScrollableRenderData): ElementInlineStyle;
    /**
     * If size information is available for the icon, set it as inline style. Tab padding
     * is also considered in the `top` position.
     * @param {SideBarRenderData} data Data used to render the tab icon.
     * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
     */
    renderIcon(data: SideBarRenderData): VirtualElement;
    /**
     * If size information is available for the label, set it as inline style.
     * Tab padding and icon size are also considered in the `top` position.
     * @param {SideBarRenderData} data Data used to render the tab.
     * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
     * @returns {VirtualElement} The virtual element of the rendered label.
     */
    renderLabel(data: SideBarRenderData, isInSidePanel?: boolean): VirtualElement;
    renderLock(data: SideBarRenderData, isInSidePanel?: boolean): VirtualElement;
    protected readonly decorations: Map<Title<Widget>, WidgetDecoration.Data[]>;
    protected resetDecorations(title?: Title<Widget>): void;
    /**
     * Get the class of an icon.
     * @param {string | string[]} iconName The name of the icon.
     * @param {string[]} additionalClasses Additional classes of the icon.
     */
    protected getIconClass(iconName: string | string[], additionalClasses?: string[]): string;
    /**
     * Find duplicate labels from the currently opened tabs in the tab bar.
     * Return the appropriate partial paths that can distinguish the identical labels.
     *
     * E.g., a/p/index.ts => a/..., b/p/index.ts => b/...
     *
     * To prevent excessively long path displayed, show at maximum three levels from the end by default.
     * @param {Title<Widget>[]} titles Array of titles in the current tab bar.
     * @returns {Map<string, string>} A map from each tab's original path to its displayed partial path.
     */
    findDuplicateLabels(titles: Title<Widget>[]): Map<string, string>;
    protected handleMouseEnterEvent: (event: MouseEvent) => void;
    protected handleContextMenuEvent: (event: MouseEvent) => void;
    protected handleCloseClickEvent: (event: MouseEvent) => void;
    protected handleDblClickEvent: (event: MouseEvent) => void;
}
export interface TabBarPrivateMethods {
    _releaseMouse(): void;
}
/**
 * A specialized tab bar for the main and bottom areas.
 */
export declare class ScrollableTabBar extends TabBar<Widget> {
    protected readonly scrollbarOptions?: PerfectScrollbar.Options;
    protected scrollBar: PerfectScrollbar | undefined;
    protected pendingReveal?: Promise<void>;
    protected isMouseOver: boolean;
    protected needsRecompute: boolean;
    protected tabSize: number;
    protected _dynamicTabOptions?: ScrollableTabBar.Options;
    protected contentContainer: HTMLElement;
    protected topRow: HTMLElement;
    protected readonly toDispose: DisposableCollection;
    protected openTabsContainer: HTMLDivElement;
    protected openTabsRoot: Root;
    constructor(options?: TabBar.IOptions<Widget>, scrollbarOptions?: PerfectScrollbar.Options, dynamicTabOptions?: ScrollableTabBar.Options);
    set dynamicTabOptions(options: ScrollableTabBar.Options | undefined);
    get dynamicTabOptions(): ScrollableTabBar.Options | undefined;
    dispose(): void;
    protected onBeforeAttach(msg: Message): void;
    protected onAfterDetach(msg: Message): void;
    protected doReleaseMouse(): void;
    protected onAfterAttach(msg: Message): void;
    protected onBeforeDetach(msg: Message): void;
    protected onUpdateRequest(msg: Message): void;
    protected updateTabs(): void;
    protected onResize(msg: Widget.ResizeMessage): void;
    /**
     * Reveal the tab with the given index by moving the scroll bar if necessary.
     */
    revealTab(index: number): Promise<void>;
}
export declare namespace ScrollableTabBar {
    interface Options {
        minimumTabSize: number;
        defaultTabSize: number;
    }
    namespace Styles {
        const TAB_BAR_CONTENT_CONTAINER = "lm-TabBar-content-container";
    }
}
/**
 * Specialized scrollable tab-bar which comes with toolbar support.
 * Instead of the following DOM structure.
 *
 * +-------------------------+
 * |[TAB_0][TAB_1][TAB_2][TAB|
 * +-------------Scrollable--+
 *
 * There is a dedicated HTML element for toolbar which does **not** contained in the scrollable element.
 *
 * +-------------------------+-----------------+
 * |[TAB_0][TAB_1][TAB_2][TAB|         Toolbar |
 * +-------------Scrollable--+-Non-Scrollable-+
 *
 */
export declare class ToolbarAwareTabBar extends ScrollableTabBar {
    protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry;
    protected readonly tabBarToolbarFactory: () => TabBarToolbar;
    protected toolbar: TabBarToolbar | undefined;
    protected dockPanel: TheiaDockPanel;
    constructor(tabBarToolbarRegistry: TabBarToolbarRegistry, tabBarToolbarFactory: () => TabBarToolbar, options?: TabBar.IOptions<Widget>, scrollbarOptions?: PerfectScrollbar.Options, dynamicTabOptions?: ScrollableTabBar.Options);
    setDockPanel(panel: TheiaDockPanel): void;
    protected onAfterAttach(msg: Message): void;
    protected onBeforeDetach(msg: Message): void;
    protected onUpdateRequest(msg: Message): void;
    protected updateToolbar(): void;
    handleEvent(event: Event): void;
    protected isOver(event: Event, element: Element): boolean;
}
