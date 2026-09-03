import { inject, injectable } from 'inversify';
import { Menu } from '../widgets';
import { Anchor, ContextMenuAccess, ContextMenuRenderer, coordinateFromAnchor } from '../context-menu-renderer';
import { BrowserMainMenuFactory } from './browser-menu-plugin';
import { ContextMatcher } from '../context-key-service';
import { CompoundMenuNode, MenuPath } from '../common';

export class BrowserContextMenuAccess extends ContextMenuAccess {
    constructor(
        public readonly menu: Menu
    ) {
        super(menu);
    }
}

@injectable()
export class BrowserContextMenuRenderer extends ContextMenuRenderer {
    @inject(BrowserMainMenuFactory) private menuFactory: BrowserMainMenuFactory;

    protected doRender(params: {
        menuPath: MenuPath,
        menu: CompoundMenuNode,
        anchor: Anchor,
        contextMatcher: ContextMatcher,
        args?: unknown[],
        context?: HTMLElement,
        onHide?: () => void
    }): ContextMenuAccess {
        const contextMenu = this.menuFactory.createContextMenu(params.menuPath, params.menu, params.contextMatcher, params.args, params.context);
        const { x, y } = coordinateFromAnchor(params.anchor);
        if (params.onHide) {
            contextMenu.aboutToClose.connect(() => params.onHide!());
        }
        contextMenu.open(x, y, { host: params.context?.ownerDocument.body });
        return new BrowserContextMenuAccess(contextMenu);
    }

}
