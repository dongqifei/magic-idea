import URI from './common/uri';
import { WidgetOpenHandler, WidgetOpenerOptions } from './widget-open-handler';
import { NavigatableWidget, NavigatableWidgetOptions } from './navigatable-types';
export * from './navigatable-types';

export abstract class NavigatableWidgetOpenHandler<W extends NavigatableWidget> extends WidgetOpenHandler<W> {

    protected createWidgetOptions(uri: URI, options?: WidgetOpenerOptions): NavigatableWidgetOptions {
        return {
            kind: 'navigatable',
            uri: this.serializeUri(uri),
        };
    }

    protected serializeUri(uri: URI): string {
        if (uri.scheme === 'file') {
            return uri.withoutFragment().normalizePath().toString();
        } else {
            return uri.withoutFragment().toString();
        }
    }

}
