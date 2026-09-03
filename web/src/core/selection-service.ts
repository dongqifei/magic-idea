import { injectable } from 'inversify';
import { Emitter, IEvent as Event } from './common';

/**
 * `SelectionProvider` is implemented by services to notify listeners about selection changes.
 */
export interface SelectionProvider<T> {
    onSelectionChanged: Event<T | undefined>;
}

/**
 * Singleton service that is used to share the current selection globally in a Theia application.
 * On each change of selection, subscribers are notified and receive the updated selection object.
 */
@injectable()
export class SelectionService implements SelectionProvider<Object | undefined> {

    private currentSelection: Object | undefined;

    protected readonly onSelectionChangedEmitter = new Emitter<any>();
    readonly onSelectionChanged: Event<any> = this.onSelectionChangedEmitter.event;

    get selection(): Object | undefined {
        return this.currentSelection;
    }

    set selection(selection: Object | undefined) {
        this.currentSelection = selection;
        this.onSelectionChangedEmitter.fire(this.currentSelection);
    }

}
