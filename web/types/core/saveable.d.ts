import { Widget } from "@lumino/widgets";
import { IEvent as Event } from "./common";
import { MaybePromise } from "./common/types";
import { Dialog } from "./dialogs/dialog";
export type AutoSaveMode = "off" | "afterDelay" | "onFocusChange" | "onWindowChange";
export interface Saveable {
    readonly dirty: boolean;
    /** If false, the saveable will not participate in autosaving. */
    readonly autosaveable?: boolean;
    /**
     * This event is fired when the content of the `dirty` variable changes.
     */
    readonly onDirtyChanged: Event<void>;
    /**
     * This event is fired when the content of the saveable changes.
     * While `onDirtyChanged` is fired to notify the UI that the widget is dirty,
     * `onContentChanged` is used for the auto save throttling.
     */
    readonly onContentChanged: Event<void>;
    /**
     * Saves dirty changes.
     */
    save(options?: SaveOptions): MaybePromise<void>;
    /**
     * Reverts dirty changes.
     */
    revert?(options?: Saveable.RevertOptions): Promise<void>;
}
export interface SaveableSource {
    readonly saveable: Saveable;
}
export declare namespace Saveable {
    interface RevertOptions {
        /**
         * If soft then only dirty flag should be updated, otherwise
         * the underlying data should be reverted as well.
         */
        soft?: boolean;
    }
    /**
     * A snapshot of a saveable item.
     * Applying a snapshot of a saveable on another (of the same type) using the `applySnapshot` should yield the state of the original saveable.
     */
    type Snapshot = {
        value: string;
    } | {
        read(): string | null;
    };
    namespace Snapshot {
        function read(snapshot: Snapshot): string | undefined;
    }
    function isSource(arg: unknown): arg is SaveableSource;
    function is(arg: unknown): arg is Saveable;
    function get(arg: unknown): Saveable | undefined;
    function getDirty(arg: unknown): Saveable | undefined;
    function isDirty(arg: unknown): boolean;
    function save(arg: unknown, options?: SaveOptions): Promise<void>;
    function confirmSaveBeforeClose(toClose: Iterable<Widget>, others: Widget[]): Promise<boolean | undefined>;
    function closingWidgetWouldLoseSaveable(widget: Widget, others: Widget[]): boolean;
}
export interface SaveableWidget extends Widget {
    /**
     * 不保存关闭
     * @param doRevert whether the saveable should be reverted before being saved. Defaults to `true`.
     */
    closeWithoutSaving(doRevert?: boolean): Promise<void>;
    /**
     * 保存后关闭
     * @param options
     */
    closeWithSaving(options?: SaveableWidget.CloseOptions): Promise<void>;
}
export declare const close: unique symbol;
/**
 * An interface describing saveable widgets that are created by the `Saveable.apply` function.
 * The original `close` function is reassigned to a locally-defined `Symbol`
 */
export interface PostCreationSaveableWidget extends SaveableWidget {
    /**
     * The original `close` function of the widget
     */
    [close](): void;
}
export declare namespace SaveableWidget {
    function is(widget: Widget | undefined): widget is SaveableWidget;
    function getDirty<T extends Widget>(widgets: Iterable<T>): IterableIterator<SaveableWidget & T>;
    function get<T extends Widget>(widgets: Iterable<T>, filter?: (widget: T) => boolean): IterableIterator<SaveableWidget & T>;
    interface CloseOptions {
        shouldSave?(): MaybePromise<boolean | undefined>;
    }
}
/**
 * Possible formatting types when saving.
 */
export declare const enum FormatType {
    /**
     * Formatting should occur (default).
     */
    ON = 1,
    /**
     * Formatting should not occur.
     */
    OFF = 2,
    /**
     * Formatting should only occur if the resource is dirty.
     */
    DIRTY = 3
}
export declare enum SaveReason {
    Manual = 1,
    AfterDelay = 2,
    FocusChange = 3
}
export declare namespace SaveReason {
    function isManual(reason?: number): reason is typeof SaveReason.Manual;
}
export interface SaveOptions {
    /**
     * Formatting type to apply when saving.
     */
    readonly formatType?: FormatType;
    /**
     * The reason for saving the resource.
     */
    readonly saveReason?: SaveReason;
}
export declare function setDirty(widget: Widget, dirty: boolean): void;
export type SaveConfirmResult = true | false | undefined;
export declare class ShouldSaveDialog extends Dialog<SaveConfirmResult> {
    constructor(widget: Widget);
    static openSaveConfirm(widget: Widget): Promise<SaveConfirmResult>;
}
