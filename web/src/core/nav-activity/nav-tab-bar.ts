// src/nav-tabbar.ts
import { Panel, TabBar, Widget } from '@lumino/widgets';

/**
 * NavTabBar: a vertical flex container that exposes a top TabBar and a bottom TabBar.
 * It extends Panel so it can host Lumino TabBar widgets and still use DOM flex layout.
 *
 * Layout:
 *   [ topBar ]
 *   [  spacer expanding  ]
 *   [ bottomBar ]
 *
 * topBar and bottomBar are Lumino TabBar<Widget> instances and will participate in DOM flow.
 */
export class NavTabBar extends Panel {
  readonly topBar: TabBar<Widget>;
  readonly bottomBar: TabBar<Widget>;

  constructor() {
    super();
    this.addClass('magic-idea-side-tab-bar');
    

    // Make the panel a CSS flex column so children (TabBars) are laid out by the browser.
    const nd = this.node as HTMLElement;
    nd.style.display = 'flex';
    nd.style.flexDirection = 'column';
    nd.style.alignItems = 'stretch';
    nd.style.boxSizing = 'border-box';

    // create top and bottom TabBars
    this.topBar = new TabBar<Widget>({ orientation: 'vertical' });
    this.topBar.addClass('nav-top-tabbar');
    this.topBar.tabsMovable = false;

    this.bottomBar = new TabBar<Widget>({ orientation: 'vertical' });
    this.bottomBar.addClass('nav-bottom-tabbar');
    this.bottomBar.tabsMovable = false;

    // make sure bars don't expand by default
    (this.topBar.node as HTMLElement).style.flex = '0 0 auto';
    (this.bottomBar.node as HTMLElement).style.flex = '0 0 auto';

    // add in DOM order
    this.addWidget(this.topBar);
    this.addWidget(this.bottomBar);
  }

  getBar(position: 'top' | 'bottom') {
    return position === 'top' ? this.topBar : this.bottomBar;
  }
}