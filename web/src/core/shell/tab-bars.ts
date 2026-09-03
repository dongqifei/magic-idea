import PerfectScrollbar from 'perfect-scrollbar';
import { Root, createRoot } from 'react-dom/client';
import { createElement } from 'react';

import { CommandRegistry } from '@lumino/commands';
import { TabBar, Title, Widget } from '@lumino/widgets';
import { Signal, Slot } from '@lumino/signaling';
import { Message } from '@lumino/messaging';
import { ArrayExt } from '@lumino/algorithm';
import { ElementExt } from '@lumino/domutils';
import { isContextMenuEvent } from '../common/browser';
import { LOCKED_CLASS, PINNED_CLASS } from '../widgets/widget';
import { NavigatableWidget } from '../navigatable-types';
import { WidgetDecoration } from '../widget-decoration';

import { ContextMenuRenderer } from '../context-menu-renderer';
import { ContextKeyService } from '../context-key-service';
import { SelectionService } from "../selection-service";
import { TabBarToolbarRegistry, TabBarToolbar } from './tab-bar-toolbar';
import { MainDockPanel as TheiaDockPanel, MAIN_AREA_ID } from './main-dock-panel';
import { VirtualElement, h, VirtualDOM, ElementInlineStyle } from '@lumino/virtualdom';
import { Disposable, DisposableCollection, ArrayUtils, MenuPath } from '../common';

/** Menu path for tab bars used throughout the application shell. */
export const SHELL_TABBAR_CONTEXT_MENU: MenuPath = ['shell-tabbar-context-menu'];
export const SHELL_TABBAR_CONTEXT_CLOSE: MenuPath = [...SHELL_TABBAR_CONTEXT_MENU, '0_close'];
export const SHELL_TABBAR_CONTEXT_COPY: MenuPath = [...SHELL_TABBAR_CONTEXT_MENU, '1_copy'];

export const SHELL_TABBAR_SPLIT_SUBMENU: MenuPath = [...SHELL_TABBAR_CONTEXT_MENU, '5_shell-tabbar-split-submenu'];

// Kept here in anticipation of tab pinning behavior implemented in tab-bars.ts
export const SHELL_TABBAR_CONTEXT_PIN: MenuPath = [...SHELL_TABBAR_CONTEXT_MENU, '4_pin'];
export const SHELL_TABBAR_CONTEXT_SPLIT: MenuPath = [...SHELL_TABBAR_SPLIT_SUBMENU, '5_split'];

export const TabBarRendererFactory = Symbol('TabBarRendererFactory');
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
    visible?: boolean
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
export class TabBarRenderer extends TabBar.Renderer {
  /**
   * The menu path used to render the context menu.
   */
  contextMenuPath?: MenuPath;

  protected readonly toDispose = new DisposableCollection();

  // TODO refactor shell, rendered should only receive props with event handlers
  // events should be handled by clients, like ApplicationShell
  // right now it is mess: (1) client logic belong to renderer, (2) cyclic dependencies between renderers and clients
  constructor(
    protected readonly contextMenuRenderer?: ContextMenuRenderer,
    protected readonly selectionService?: SelectionService,
    protected readonly commands?: CommandRegistry,
    protected readonly contextKeyService?: ContextKeyService,
  ) {
    super();
  }

  dispose(): void {
    this.toDispose.dispose();
  }

  protected _tabBar?: TabBar<Widget>;
  protected readonly toDisposeOnTabBar = new DisposableCollection();
  /**
   * A reference to the tab bar is required in order to activate it when a context menu
   * is requested.
   */
  set tabBar(tabBar: TabBar<Widget> | undefined) {
    // if (this.toDispose.disposed) {
    //   throw new Error('disposed');
    // }
    if (this._tabBar === tabBar) {
      return;
    }
    this.toDisposeOnTabBar.dispose();
    this.toDispose.push(this.toDisposeOnTabBar);
    this._tabBar = tabBar;
    if (tabBar) {
      const listener: Slot<Widget, TabBar.ITabCloseRequestedArgs<Widget>> = (_, { title }) => this.resetDecorations(title);
      tabBar.tabCloseRequested.connect(listener);
      this.toDisposeOnTabBar.push(Disposable.create(() => tabBar.tabCloseRequested.disconnect(listener)));
    }
    this.resetDecorations();
  }
  get tabBar(): TabBar<Widget> | undefined {
    return this._tabBar;
  }

  /**
   * Render tabs with the default DOM structure, but additionally register a context menu listener.
   * @param {SideBarRenderData} data Data used to render the tab.
   * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
   * @param {boolean} isPartOfHiddenTabBar An optional check which determines if the tab is in the hidden horizontal tab bar.
   * @returns {VirtualElement} The virtual element of the rendered tab.
   */
  override renderTab(data: SideBarRenderData, isInSidePanel?: boolean, isPartOfHiddenTabBar?: boolean): VirtualElement {
    // Putting the close icon at the start is only pertinent to the horizontal orientation
    const isHorizontal = this.tabBar?.orientation === 'horizontal';
    const tabCloseIconStart = false;

    const title = data.title;
    const id = this.createTabId(title, isPartOfHiddenTabBar);
    const key = this.createTabKey(data);
    const style = this.createTabStyle(data);
    const className = `${this.createTabClass(data)}${tabCloseIconStart ? ' closeIcon-start' : ''}`;
    const dataset = this.createTabDataset(data);
    const closeIconTitle = data.title.className.includes(PINNED_CLASS)
      ? 'Unpin'
      : 'Close';

    const hover = isHorizontal
      ? { title: title.caption }
      : {
        onmouseenter: this.handleMouseEnterEvent
      };

    const tabLabel = h.div(
      { className: 'theia-tab-icon-label' },
      this.renderIcon(data),
      this.renderLabel(data, isInSidePanel),
      this.renderLock(data, isInSidePanel)
    );
    const tabCloseIcon = h.div({
      className: 'lm-TabBar-tabCloseIcon action-label',
      title: closeIconTitle,
      onclick: this.handleCloseClickEvent,
    });

    const tabContents = tabCloseIconStart ? [tabCloseIcon, tabLabel] : [tabLabel, tabCloseIcon];

    return h.li(
      {
        ...hover,
        key, className, id, style, dataset,
        oncontextmenu: this.handleContextMenuEvent,
        // ondblclick: this.handleDblClickEvent,
        onauxclick: (e: MouseEvent) => {
          // If user closes the tab using mouse wheel, nothing should be pasted to an active editor
          e.preventDefault();
        }
      },
      ...tabContents
    );
  }

  override createTabClass(data: SideBarRenderData): string {
    let tabClass = super.createTabClass(data);
    if (!(data.visible ?? true)) {
      tabClass += ' lm-mod-invisible';
    }
    return tabClass;
  }

  /**
   * Generate ID for an entry in the tab bar
   * @param {Title<Widget>} title Title of the widget controlled by this tab bar
   * @param {boolean} isPartOfHiddenTabBar Tells us if this entry is part of the hidden horizontal tab bar.
   *      If yes, add a suffix to differentiate it's ID from the entry in the visible tab bar
   * @returns {string} DOM element ID
   */
  createTabId(title: Title<Widget>, isPartOfHiddenTabBar = false): string {
    return 'shell-tab-' + title.owner.id + (isPartOfHiddenTabBar ? '-hidden' : '');
  }

  /**
   * If size information is available for the label and icon, set an explicit height on the tab.
   * The height value also considers padding, which should be derived from CSS settings.
   */
  override createTabStyle(data: SideBarRenderData & ScrollableRenderData): ElementInlineStyle {
    const zIndex = `${data.zIndex}`;
    const labelSize = data.labelSize;
    const iconSize = data.iconSize;
    let height: string | undefined;
    let width: string | undefined;
    if (labelSize || iconSize) {
      const labelHeight = labelSize ? (this.tabBar && this.tabBar.orientation === 'horizontal' ? labelSize.height : labelSize.width) : 0;
      const iconHeight = iconSize ? iconSize.height : 0;
      let paddingTop = data.paddingTop || 0;
      if (labelHeight > 0 && iconHeight > 0) {
        // Leave some extra space between icon and label
        paddingTop = paddingTop * 1.5;
      }
      const paddingBottom = data.paddingBottom || 0;
      height = `${labelHeight + iconHeight + paddingTop + paddingBottom}px`;
    }
    if (data.tabWidth) {
      width = `${data.tabWidth}px`;
    } else {
      width = '';
    }
    return { zIndex, height, minWidth: width, maxWidth: width };
  }

  /**
   * If size information is available for the icon, set it as inline style. Tab padding
   * is also considered in the `top` position.
   * @param {SideBarRenderData} data Data used to render the tab icon.
   * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
   */
  override renderIcon(data: SideBarRenderData): VirtualElement {
      let top: string | undefined;
      if (data.paddingTop) {
          top = `${data.paddingTop || 0}px`;
      }
      const style: ElementInlineStyle = { top };
      const baseClassName = this.createIconClass(data);
      return  data?.title?.icon?.render() || h.div({ className: baseClassName, style }, data.title.iconLabel);
  }

  /**
   * If size information is available for the label, set it as inline style.
   * Tab padding and icon size are also considered in the `top` position.
   * @param {SideBarRenderData} data Data used to render the tab.
   * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
   * @returns {VirtualElement} The virtual element of the rendered label.
   */
  override renderLabel(data: SideBarRenderData, isInSidePanel?: boolean): VirtualElement {
    const labelSize = data.labelSize;
    const iconSize = data.iconSize;
    let width: string | undefined;
    let height: string | undefined;
    let top: string | undefined;
    if (labelSize) {
      width = `${labelSize.width}px`;
      height = `${labelSize.height}px`;
    }
    if (data.paddingTop || iconSize) {
      const iconHeight = iconSize ? iconSize.height : 0;
      let paddingTop = data.paddingTop || 0;
      if (iconHeight > 0) {
        // Leave some extra space between icon and label
        paddingTop = paddingTop * 1.5;
      }
      top = `${paddingTop + iconHeight}px`;
    }
    const style: ElementInlineStyle = { width, height, top };
    // No need to check for duplicate labels if the tab is rendered in the side panel (title is not displayed),
    // or if there are less than two files in the tab bar.
    if (isInSidePanel || (this.tabBar && this.tabBar.titles.length < 2)) {
      return h.div({ className: 'lm-TabBar-tabLabel', style }, data.title.label);
    }
    const originalToDisplayedMap = this.findDuplicateLabels([...this.tabBar!.titles]);
    const labelDetails: string | undefined = originalToDisplayedMap.get(data.title.caption);
    if (labelDetails) {
      return h.div({ className: 'lm-TabBar-tabLabelWrapper' },
        h.div({ className: 'lm-TabBar-tabLabel', style }, data.title.label),
        h.div({ className: 'lm-TabBar-tabLabelDetails', style }, labelDetails));
    }
    return h.div({ className: 'lm-TabBar-tabLabel', style }, data.title.label);
  }


  renderLock(data: SideBarRenderData, isInSidePanel?: boolean): VirtualElement {
    return !isInSidePanel && data.title.className.includes(LOCKED_CLASS)
      ? h.div({ className: 'lm-TabBar-tabLock' })
      : h.div({});
  }

  protected readonly decorations = new Map<Title<Widget>, WidgetDecoration.Data[]>();

  protected resetDecorations(title?: Title<Widget>): void {
    if (title) {
      this.decorations.delete(title);
    } else {
      this.decorations.clear();
    }
    if (this.tabBar) {
      this.tabBar.update();
    }
  }

  /**
   * Get the class of an icon.
   * @param {string | string[]} iconName The name of the icon.
   * @param {string[]} additionalClasses Additional classes of the icon.
   */
  protected getIconClass(iconName: string | string[], additionalClasses: string[] = []): string {
    const iconClass = (typeof iconName === 'string') ? ['a', 'fa', `fa-${iconName}`] : ['a'].concat(iconName);
    return iconClass.concat(additionalClasses).join(' ');
  }

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
  findDuplicateLabels(titles: Title<Widget>[]): Map<string, string> {
    // Filter from all tabs to group them by the distinct label (file name).
    // E.g., 'foo.js' => {0 (index) => 'a/b/foo.js', '2 => a/c/foo.js' },
    //       'bar.js' => {1 => 'a/d/bar.js', ...}
    const labelGroups = new Map<string, Map<number, string>>();
    titles.forEach((title, index) => {
      if (!labelGroups.has(title.label)) {
        labelGroups.set(title.label, new Map<number, string>());
      }
      labelGroups.get(title.label)!.set(index, title.caption);
    });

    const originalToDisplayedMap = new Map<string, string>();
    // Parse each group of editors with the same label.
    labelGroups.forEach(labelGroup => {
      // Filter to get groups that have duplicates.
      if (labelGroup.size > 1) {
        const paths: string[][] = [];
        let maxPathLength = 0;
        labelGroup.forEach((pathStr, index) => {
          const steps = pathStr.split('/');
          maxPathLength = Math.max(maxPathLength, steps.length);
          paths[index] = (steps.slice(0, steps.length - 1));
          // By default, show at maximum three levels from the end.
          let defaultDisplayedPath = steps.slice(-4, -1).join('/');
          if (steps.length > 4) {
            defaultDisplayedPath = '.../' + defaultDisplayedPath;
          }
          originalToDisplayedMap.set(pathStr, defaultDisplayedPath);
        });

        // Iterate through the steps of the path from the left to find the step that can distinguish it.
        // E.g., ['root', 'foo', 'c'], ['root', 'bar', 'd'] => 'foo', 'bar'
        let i = 0;
        while (i < maxPathLength - 1) {
          // Store indexes of all paths that have the identical element in each step.
          const stepOccurrences = new Map<string, number[]>();
          // Compare the current step of all paths
          paths.forEach((path, index) => {
            const step = path[i];
            if (path.length > 0) {
              if (i > path.length - 1) {
                paths[index] = [];
              } else if (!stepOccurrences.has(step)) {
                stepOccurrences.set(step, [index]);
              } else {
                stepOccurrences.get(step)!.push(index);
              }
            }
          });
          // Set the displayed path for each tab.
          stepOccurrences.forEach((indexArr, displayedPath) => {
            if (indexArr.length === 1) {
              const originalPath = labelGroup.get(indexArr[0]);
              if (originalPath) {
                const originalElements = originalPath.split('/');
                const displayedElements = displayedPath.split('/');
                if (originalElements.slice(-2)[0] !== displayedElements.slice(-1)[0]) {
                  displayedPath += '/...';
                }
                if (originalElements[0] !== displayedElements[0]) {
                  displayedPath = '.../' + displayedPath;
                }
                originalToDisplayedMap.set(originalPath, displayedPath);
                paths[indexArr[0]] = [];
              }
            }
          });
          i++;
        }
      }
    });
    return originalToDisplayedMap;
  }

  protected handleMouseEnterEvent = (event: MouseEvent) => {
  }

  protected handleContextMenuEvent = (event: MouseEvent) => {
    if (this.contextMenuRenderer && this.contextMenuPath && event.currentTarget instanceof HTMLElement) {
      event.stopPropagation();
      event.preventDefault();
      let widget: Widget | undefined = undefined;
      if (this.tabBar) {
          const titleIndex = Array.from(this.tabBar.contentNode.getElementsByClassName('lm-TabBar-tab'))
              .findIndex(node => node.contains(event.currentTarget as HTMLElement));
          if (titleIndex !== -1) {
              widget = this.tabBar.titles[titleIndex].owner;
          }
      }

      const oldSelection = this.selectionService?.selection;
      if (widget && this.selectionService) {
          this.selectionService.selection = NavigatableWidget.is(widget) ? { uri: widget.getResourceUri() } : widget;
      }

      this.contextMenuRenderer.render({
          menuPath: this.contextMenuPath!,
          anchor: event,
          args: [event],
          context: event.currentTarget,
          // We'd like to wait until the command triggered by the context menu has been run, but this should let it get through the preamble, at least.
          onHide: () => setTimeout(() => { if (this.selectionService) { this.selectionService.selection = oldSelection; } })
      });
    }
  }

  protected handleCloseClickEvent = (event: MouseEvent) => {
    if (this.tabBar && event.currentTarget instanceof HTMLElement) {
      const id = event.currentTarget.parentElement!.id;
      const title = this.tabBar.titles.find(t => this.createTabId(t) === id);
      if (title?.closable === false && title?.className.includes(PINNED_CLASS) && this.commands) {
        this.commands?.execute('workbench.action.unpinEditor');
      }
    }
  };

  protected handleDblClickEvent = (event: MouseEvent) => {
    if (this.tabBar && event.currentTarget instanceof HTMLElement) {
      const id = event.currentTarget.id;
      const title = this.tabBar.titles.find(t => this.createTabId(t) === id);
      const area = title?.owner.parent;
      if (area instanceof TheiaDockPanel && (area.id === MAIN_AREA_ID)) {
        area.toggleMaximized();
      }
    }
  };

}

export interface TabBarPrivateMethods {
  _releaseMouse(): void;
}

/**
 * A specialized tab bar for the main and bottom areas.
 */
export class ScrollableTabBar extends TabBar<Widget> {

  protected scrollBar: PerfectScrollbar | undefined;

  protected pendingReveal?: Promise<void>;
  protected isMouseOver = false;
  protected needsRecompute = false;
  protected tabSize = 0;
  protected _dynamicTabOptions?: ScrollableTabBar.Options;
  protected contentContainer: HTMLElement;
  protected topRow: HTMLElement;

  protected readonly toDispose = new DisposableCollection();
  protected openTabsContainer: HTMLDivElement;
  protected openTabsRoot: Root;

  constructor(options?: TabBar.IOptions<Widget>, protected readonly scrollbarOptions?: PerfectScrollbar.Options, dynamicTabOptions?: ScrollableTabBar.Options) {
    super(options);
    this._dynamicTabOptions = dynamicTabOptions;
    this.topRow = document.createElement('div');
    this.topRow.classList.add('theia-tabBar-tab-row');
    this.node.appendChild(this.topRow);

    const contentNode = this.contentNode;
    if (!contentNode) {
      throw new Error('tab bar does not have the content node.');
    }
    this.node.removeChild(contentNode);
    this.contentContainer = document.createElement('div');
    this.contentContainer.classList.add(ScrollableTabBar.Styles.TAB_BAR_CONTENT_CONTAINER);
    this.contentContainer.appendChild(contentNode);
    this.topRow.appendChild(this.contentContainer);

    this.openTabsContainer = document.createElement('div');
    this.openTabsContainer.classList.add('theia-tabBar-open-tabs');
    this.openTabsRoot = createRoot(this.openTabsContainer);
    this.topRow.appendChild(this.openTabsContainer);
  }

  set dynamicTabOptions(options: ScrollableTabBar.Options | undefined) {
    this._dynamicTabOptions = options;
    this.updateTabs();
  }

  get dynamicTabOptions(): ScrollableTabBar.Options | undefined {
    return this._dynamicTabOptions;
  }

  override dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    this.toDispose.dispose();
  }

  protected override onBeforeAttach(msg: Message): void {
    this.contentNode.addEventListener('pointerdown', this);
    this.contentNode.addEventListener('dblclick', this);
    this.contentNode.addEventListener('keydown', this);
  }

  protected override onAfterDetach(msg: Message): void {
    this.contentNode.removeEventListener('pointerdown', this);
    this.contentNode.removeEventListener('dblclick', this);
    this.contentNode.removeEventListener('keydown', this);
    this.doReleaseMouse();
  }

  protected doReleaseMouse(): void {
    (this as unknown as TabBarPrivateMethods)._releaseMouse();
  }

  protected override onAfterAttach(msg: Message): void {
    this.node.addEventListener('mouseenter', () => { this.isMouseOver = true; });
    this.node.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
      if (this.needsRecompute) {
        this.updateTabs();
      }
    });

    super.onAfterAttach(msg);
    this.scrollBar = new PerfectScrollbar(this.contentContainer, this.scrollbarOptions);
  }

  protected override onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.scrollBar?.destroy();
  }

  protected override onUpdateRequest(msg: Message): void {
    this.updateTabs();
  }

  protected updateTabs(): void {
    const content = [];
    if (this.dynamicTabOptions) {

      // this.openTabsRoot.render(createElement(SelectComponent, {
      //     options: this.titles,
      //     onChange: (option, index) => {
      //         this.currentIndex = index;
      //     },
      //     alignment: 'right'
      // }));

      if (this.isMouseOver) {
        this.needsRecompute = true;
      } else {
        this.needsRecompute = false;
        if (this.orientation === 'horizontal') {
          let availableWidth = this.contentNode.clientWidth;
          let effectiveWidth = availableWidth;
          if (!this.openTabsContainer.classList.contains('lm-mod-hidden')) {
            availableWidth += this.openTabsContainer.getBoundingClientRect().width;
          }
          if (this.dynamicTabOptions.minimumTabSize * this.titles.length <= availableWidth) {
            effectiveWidth += this.openTabsContainer.getBoundingClientRect().width;
            this.openTabsContainer.classList.add('lm-mod-hidden');
          } else {
            this.openTabsContainer.classList.remove('lm-mod-hidden');
          }
          this.tabSize = Math.max(Math.min(effectiveWidth / this.titles.length,
            this.dynamicTabOptions.defaultTabSize), this.dynamicTabOptions.minimumTabSize);
        }
      }
      this.node.classList.add('dynamic-tabs');
    } else {
      this.openTabsContainer.classList.add('lm-mod-hidden');
      this.node.classList.remove('dynamic-tabs');
    }
    for (let i = 0, n = this.titles.length; i < n; ++i) {
      const title = this.titles[i];
      const current = title === this.currentTitle;
      const zIndex = current ? n : n - i - 1;
      const renderData: ScrollableRenderData = { title: title, current: current, zIndex: zIndex };
      if (this.dynamicTabOptions && this.orientation === 'horizontal') {
        renderData.tabWidth = this.tabSize;
      }
      content[i] = this.renderer.renderTab(renderData);
    }
    VirtualDOM.render(content, this.contentNode);
    if (this.scrollBar) {
      if (!(this.dynamicTabOptions && this.isMouseOver)) {
        this.scrollBar.update();
      }
    }
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    if (this.dynamicTabOptions) {
      this.updateTabs();
    }
    if (this.scrollBar) {
      if (this.currentIndex >= 0) {
        this.revealTab(this.currentIndex);
      }
      this.scrollBar.update();
    }
  }

  /**
   * Reveal the tab with the given index by moving the scroll bar if necessary.
   */
  revealTab(index: number): Promise<void> {
    if (this.pendingReveal) {
      // A reveal has already been scheduled
      return this.pendingReveal;
    }
    const result = new Promise<void>((resolve, reject) => {
      // The tab might not have been created yet, so wait until the next frame
      window.requestAnimationFrame(() => {
        const tab = this.contentNode.children[index] as HTMLElement;
        if (tab && this.isVisible) {
          const parent = this.contentContainer;
          if (this.orientation === 'horizontal') {
            const scroll = parent.scrollLeft;
            const left = tab.offsetLeft;
            if (scroll > left) {
              parent.scrollLeft = left;
            } else {
              const right = left + tab.clientWidth - parent.clientWidth;
              if (scroll < right && tab.clientWidth < parent.clientWidth) {
                parent.scrollLeft = right;
              }
            }
          } else {
            const scroll = parent.scrollTop;
            const top = tab.offsetTop;
            if (scroll > top) {
              parent.scrollTop = top;
            } else {
              const bottom = top + tab.clientHeight - parent.clientHeight;
              if (scroll < bottom && tab.clientHeight < parent.clientHeight) {
                parent.scrollTop = bottom;
              }
            }
          }
        }
        if (this.pendingReveal === result) {
          this.pendingReveal = undefined;
        }
        resolve();
      });
    });
    this.pendingReveal = result;
    return result;
  }
}

export namespace ScrollableTabBar {

  export interface Options {
    minimumTabSize: number;
    defaultTabSize: number;
  }
  export namespace Styles {

    export const TAB_BAR_CONTENT_CONTAINER = 'lm-TabBar-content-container';

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
export class ToolbarAwareTabBar extends ScrollableTabBar {
  protected toolbar: TabBarToolbar | undefined;
  protected dockPanel: TheiaDockPanel;

  constructor(
    protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
    protected readonly tabBarToolbarFactory: () => TabBarToolbar,
    options?: TabBar.IOptions<Widget>,
    scrollbarOptions?: PerfectScrollbar.Options,
    dynamicTabOptions?: ScrollableTabBar.Options
  ) {
    super(options, scrollbarOptions, dynamicTabOptions);

    this.toolbar = this.tabBarToolbarFactory();
    this.toDispose.push(this.toolbar);
    this.toDispose.push(this.tabBarToolbarRegistry.onDidChange(() => this.update()));
  }

  setDockPanel(panel: TheiaDockPanel): void {
    this.dockPanel = panel;
  }

  protected override onAfterAttach(msg: Message): void {
    if (this.toolbar) {
      if (this.toolbar.isAttached) {
        Widget.detach(this.toolbar);
      }
      Widget.attach(this.toolbar, this.topRow);
    }
    super.onAfterAttach(msg);
  }

  protected override onBeforeDetach(msg: Message): void {
    if (this.toolbar && this.toolbar.isAttached) {
      Widget.detach(this.toolbar);
    }
    super.onBeforeDetach(msg);
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.updateToolbar();
  }

  protected updateToolbar(): void {
    if (!this.toolbar) {
      return;
    }
    const widget = this.currentTitle?.owner ?? undefined;
    this.toolbar.updateTarget(widget);
    this.updateTabs();
  }

  override handleEvent(event: Event): void {
    if (event instanceof MouseEvent) {
      if (isContextMenuEvent(event)) {
        // Let this bubble up to handle the context menu
        return;
      }
      if (this.isOver(event, this.openTabsContainer)) {
        // if the mouse event is over the toolbar part don't handle it.
        return;
      }
    }
    super.handleEvent(event);
  }

  protected isOver(event: Event, element: Element): boolean {
    return element && event.target instanceof Element && element.contains(event.target);
  }
}
