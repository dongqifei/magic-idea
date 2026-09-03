import { NavigatableWidgetOpenHandler, NavigatableWidgetOptions, WidgetOpenerOptions } from '..\core';
import { URI } from '..\core\common\uri';
import { RecursivePartial, Emitter, IEvent as Event } from '..\core\common';
import { PreferenceService } from '..\core\preferences\preference-service';
import { EditorWidget } from "./editor-widget";
import { Range, Selection } from './text-editor';
export interface WidgetId {
    id: number;
    uri: string;
}
export interface EditorOpenerOptions extends WidgetOpenerOptions {
    selection?: RecursivePartial<Selection>;
    preview?: boolean;
}
export declare class EditorManager extends NavigatableWidgetOpenHandler<EditorWidget> {
    protected readonly preferenceService: PreferenceService;
    readonly id: string;
    readonly label = "Text Editor";
    protected readonly editorCounters: Map<string, number>;
    protected readonly onActiveEditorChangedEmitter: Emitter<EditorWidget>;
    /**
     * Emit when the active editor is changed.
     */
    readonly onActiveEditorChanged: Event<EditorWidget | undefined>;
    protected readonly onCurrentEditorChangedEmitter: Emitter<EditorWidget>;
    /**
     * Emit when the current editor is changed.
     */
    readonly onCurrentEditorChanged: Event<EditorWidget | undefined>;
    protected _activeEditor: EditorWidget | undefined;
    protected _currentEditor: EditorWidget | undefined;
    protected readonly recentlyVisibleIds: string[];
    /**
     * The active editor.
     * If there is an active editor (one that has focus), active and current are the same.
     */
    get activeEditor(): EditorWidget | undefined;
    /**
     * The most recently activated editor (which might not have the focus anymore, hence it is not active).
     * If no editor has focus, e.g. when a context menu is shown, the active editor is `undefined`, but current might be the editor that was active before the menu popped up.
     */
    get currentEditor(): EditorWidget | undefined;
    constructor(preferenceService: PreferenceService);
    private fireCurrentEditorChangedEvent;
    protected init(): void;
    /**
     * Opens an editor to the side of the current editor. Defaults to opening to the right.
     * To modify direction, pass options with `{widgetOptions: {mode: ...}}`
     */
    openToSide(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget>;
    open(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget>;
    protected doOpen(widget: EditorWidget, uri: URI, options?: EditorOpenerOptions): Promise<void>;
    protected revealSelection(widget: EditorWidget, options?: EditorOpenerOptions): Promise<void>;
    protected getSelection(selection: RecursivePartial<Selection>): Selection | undefined;
    protected resolveSelection(options: EditorOpenerOptions): Promise<RecursivePartial<Range> | undefined>;
    canHandle(uri: URI, options?: WidgetOpenerOptions): number;
    protected checkCounterForWidget(widget: EditorWidget): void;
    protected removeFromCounter(widget: EditorWidget): void;
    protected getCounterForUri(uri: URI): number | undefined;
    protected extractIdFromWidget(widget: EditorWidget): WidgetId;
    protected createCounterForUri(uri: URI): number;
    protected setActiveEditor(active: EditorWidget | undefined): void;
    protected updateActiveEditor(): void;
    protected setCurrentEditor(current: EditorWidget | undefined): void;
    protected updateCurrentEditor(): void;
    protected get recentlyVisible(): EditorWidget | undefined;
    protected addRecentlyVisible(widget: EditorWidget): void;
    protected removeRecentlyVisible(widget: EditorWidget): void;
    protected getOrCreateCounterForUri(uri: URI): number;
    protected createWidgetOptions(uri: URI, options?: EditorOpenerOptions): NavigatableWidgetOptions;
}
