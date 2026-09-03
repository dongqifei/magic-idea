import { isFunction, isObject } from '../common';

export interface PreviewableWidget {
    loaded?: boolean;
    getPreviewNode(): Node | undefined;
}

export namespace PreviewableWidget {
    export function is(arg: unknown): arg is PreviewableWidget {
        return isObject<PreviewableWidget>(arg) && isFunction(arg.getPreviewNode);
    }
    export function isPreviewable(arg: unknown): arg is PreviewableWidget {
        return isObject<PreviewableWidget>(arg) && isFunction(arg.getPreviewNode) && arg.loaded === true;
    }
}
