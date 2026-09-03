import { inject, injectable, optional } from 'inversify';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Disposable, DisposableCollection } from '../common';

export type RendererHost = HTMLElement;
export const RendererHost = Symbol('RendererHost');

@injectable()
export class ReactRenderer implements Disposable {
    protected readonly toDispose = new DisposableCollection();
    readonly host: HTMLElement;
    protected hostRoot: Root;

    constructor(
        @inject(RendererHost) @optional() host?: RendererHost
    ) {
        this.host = host || document.createElement('div');
        this.hostRoot = createRoot(this.host);
        this.toDispose.push(Disposable.create(() => this.hostRoot.unmount()));
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    render(): void {
        // Ignore all render calls after the host element has unmounted
        if (!this.toDispose.disposed) {
            this.hostRoot.render(<React.Fragment>{this.doRender()}</React.Fragment>);
        }
    }

    protected doRender(): React.ReactNode {
        return undefined;
    }
}
