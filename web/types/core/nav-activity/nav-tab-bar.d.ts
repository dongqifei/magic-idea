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
export declare class NavTabBar extends Panel {
    readonly topBar: TabBar<Widget>;
    readonly bottomBar: TabBar<Widget>;
    constructor();
    getBar(position: 'top' | 'bottom'): TabBar<Widget>;
}
