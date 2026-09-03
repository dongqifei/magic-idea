import { Widget } from "@lumino/widgets";
import { Emitter, IEvent as Event, isObject } from "./common";
import { MaybePromise } from "./common/types";
import { Dialog, DialogButton } from "./dialogs/dialog";

export type AutoSaveMode =
  | "off"
  | "afterDelay"
  | "onFocusChange"
  | "onWindowChange";

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

export namespace Saveable {
  export interface RevertOptions {
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
  export type Snapshot = { value: string } | { read(): string | null };
  export namespace Snapshot {
    export function read(snapshot: Snapshot): string | undefined {
      return "value" in snapshot
        ? snapshot.value
        : snapshot.read() ?? undefined;
    }
  }
  export function isSource(arg: unknown): arg is SaveableSource {
    return isObject<SaveableSource>(arg) && is(arg.saveable);
  }
  export function is(arg: unknown): arg is Saveable {
    return isObject(arg) && "dirty" in arg && "onDirtyChanged" in arg;
  }
  export function get(arg: unknown): Saveable | undefined {
    if (is(arg)) {
      return arg;
    }
    if (isSource(arg)) {
      return arg.saveable;
    }
    return undefined;
  }
  export function getDirty(arg: unknown): Saveable | undefined {
    const saveable = get(arg);
    if (saveable && saveable.dirty) {
      return saveable;
    }
    return undefined;
  }
  export function isDirty(arg: unknown): boolean {
    return !!getDirty(arg);
  }
  export async function save(
    arg: unknown,
    options?: SaveOptions
  ): Promise<void> {
    const saveable = get(arg);
    if (saveable) {
      await saveable.save(options);
    }
  }

  export async function confirmSaveBeforeClose(
    toClose: Iterable<Widget>,
    others: Widget[]
  ): Promise<boolean | undefined> {
    for (const widget of toClose) {
      const saveable = Saveable.get(widget);
      if (saveable?.dirty) {
        if (!closingWidgetWouldLoseSaveable(widget, others)) {
          continue;
        }
        const userWantsToSave = await ShouldSaveDialog.openSaveConfirm(widget);;
        if (userWantsToSave === undefined) {
          // User clicked cancel.
          return undefined;
        } else if (userWantsToSave) {
          await saveable.save();
        } else {
          await saveable.revert?.();
        }
      }
    }
    return true;
  }

  export function closingWidgetWouldLoseSaveable(
    widget: Widget,
    others: Widget[]
  ): boolean {
    const saveable = Saveable.get(widget);
    return (
      !!saveable &&
      !others.some(
        (otherWidget) =>
          otherWidget !== widget && Saveable.get(otherWidget) === saveable
      )
    );
  }
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

export const close = Symbol("close");
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

export namespace SaveableWidget {
  export function is(widget: Widget | undefined): widget is SaveableWidget {
    return !!widget && "closeWithoutSaving" in widget;
  }
  export function getDirty<T extends Widget>(
    widgets: Iterable<T>
  ): IterableIterator<SaveableWidget & T> {
    return get<T>(widgets, Saveable.isDirty);
  }
  export function* get<T extends Widget>(
    widgets: Iterable<T>,
    filter: (widget: T) => boolean = () => true
  ): IterableIterator<SaveableWidget & T> {
    for (const widget of widgets) {
      if (SaveableWidget.is(widget) && filter(widget)) {
        yield widget;
      }
    }
  }
  export interface CloseOptions {
    shouldSave?(): MaybePromise<boolean | undefined>;
  }
}

/**
 * Possible formatting types when saving.
 */
export const enum FormatType {
  /**
   * Formatting should occur (default).
   */
  ON = 1,
  /**
   * Formatting should not occur.
   */
  OFF,
  /**
   * Formatting should only occur if the resource is dirty.
   */
  DIRTY,
}

export enum SaveReason {
  Manual = 1,
  AfterDelay = 2,
  FocusChange = 3,
}

export namespace SaveReason {
  export function isManual(
    reason?: number
  ): reason is typeof SaveReason.Manual {
    return reason === SaveReason.Manual;
  }
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

/**
 * The class name added to the dirty widget's title.
 */
const DIRTY_CLASS = "theia-mod-dirty";

export function setDirty(widget: Widget, dirty: boolean): void {
  const dirtyClass = ` ${DIRTY_CLASS}`;
  widget.title.className = widget.title.className.replace(dirtyClass, "");
  if (dirty) {
    widget.title.className += dirtyClass;
  }
}

export type SaveConfirmResult = true | false | undefined;

export class ShouldSaveDialog extends Dialog<SaveConfirmResult> {

  constructor(widget: Widget) {
    const buttons: DialogButton<SaveConfirmResult>[] = [
      {
        label: '保存',
        className: 'magic-idea-dialog-save',
        primary: true,
        callback: () => {
          return true;
        }
      },
      {
        label: '不保存',
        className: 'magic-idea-dialog-discard',
        callback: () => {
          return false;
        }
      },
      {
        label: '取消',
        className: 'magic-idea-dialog-cancel',
        callback: () => {
          return undefined;
        }
      },
    ];

    super({
      title: `是否要保存对 ${widget.title.label || widget.title.caption} 的更改?`,
      buttons,
      width: 400,
      modal: true
    });
    const content = `如果你不保存，你所做的更改将会丢失。`;
    this.renderContent(content);
  }

  static async openSaveConfirm(widget: Widget): Promise<SaveConfirmResult> {
    const dialog = new ShouldSaveDialog(widget);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<SaveConfirmResult>(dialog);
    return result;
  }
}