import * as monaco from "monaco-editor";
import URI from '..\core\common\uri';
import { Disposable, DisposableCollection, Emitter, IEvent as Event } from '..\core\common';
import { EditorManager } from './editor-manager';
import { EditorWidget } from './editor-widget';
import { TextEditor, Selection, Position, Range, DeltaDecorationParams } from "./text-editor";
import { MonacoEditorModel } from "./monaco-editor-model";
import { IInstantiationService, ServiceIdentifier } from 'monaco-editor/esm/vs/platform/instantiation/common/instantiation';
import { IStandaloneEditorConstructionOptions } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneCodeEditor';
import { MonacoTextModelService } from './monaco-text-model-service';
import { DocumentModelService } from './monaco-document-model-service';
export type ServicePair<T> = [ServiceIdentifier<T>, T];
export interface EditorServiceOverrides extends Iterable<ServicePair<unknown>> {
}
export declare class MonacoEditorServices {
    protected readonly monacoModelService: MonacoTextModelService;
    protected readonly modelService: DocumentModelService;
    constructor(services: MonacoEditorServices);
}
export declare class MonacoEditor extends MonacoEditorServices implements TextEditor {
    readonly uri: URI;
    readonly document: MonacoEditorModel;
    readonly node: HTMLElement;
    readonly options: MonacoEditor.IOptions;
    protected readonly toDispose: DisposableCollection;
    protected editor: monaco.editor.IStandaloneCodeEditor;
    protected savedViewState: monaco.editor.IEditorViewState | null;
    protected readonly onCursorPositionChangedEmitter: Emitter<monaco.Position>;
    protected readonly onSelectionChangedEmitter: Emitter<monaco.Selection>;
    protected readonly onFocusChangedEmitter: Emitter<boolean>;
    protected readonly onDocumentContentChangedEmitter: Emitter<any>;
    static create(uri: URI, document: MonacoEditorModel, node: HTMLElement, options: MonacoEditor.IOptions, services: MonacoEditorServices): Promise<MonacoEditor>;
    constructor(uri: URI, document: MonacoEditorModel, node: HTMLElement, options: MonacoEditor.IOptions, services: MonacoEditorServices);
    protected init(): Promise<void>;
    protected create(options?: monaco.editor.IStandaloneEditorConstructionOptions | IStandaloneEditorConstructionOptions): Disposable;
    protected getInstantiatorWithOverrides(): IInstantiationService;
    protected addHandlers(codeEditor: monaco.editor.IStandaloneCodeEditor): void;
    protected mapModelContentChange(change: monaco.editor.IModelContentChange): any;
    get cursor(): Position;
    set cursor(cursor: Position);
    get selection(): Selection;
    set selection(selection: Selection);
    get onSelectionChanged(): Event<Selection>;
    getControl(): monaco.editor.IStandaloneCodeEditor;
    get onDispose(): Event<void>;
    get onDocumentContentChanged(): Event<any>;
    get isReadonly(): boolean;
    revealPosition(raw: Position): void;
    revealRange(raw: Range): void;
    focus(): void;
    refresh(): void;
    getResourceUri(): URI | undefined;
    createMoveToUri(resourceUri: URI): URI | undefined;
    isFocused(): boolean;
    get onFocusChanged(): Event<boolean>;
    storeViewState(): object;
    restoreViewState(state: monaco.editor.IEditorViewState): void;
    handleVisibilityChanged(nowVisible: boolean): void;
    deltaDecorations(params: DeltaDecorationParams): string[];
    /**
     * This property allows working with the underlying editor instance
     * through the base editor interface, `monaco.editor.IEditor`.
     *
     * This property is intended to be overriden in subclasses as needed,
     * e.g. it returns the underlying diff editor in `MonacoDiffEditor`.
     */
    protected get baseEditor(): monaco.editor.IEditor;
    /**
     * This property allows working with the underlying editor model instance
     * through the base editor model interface, `monaco.editor.IEditorModel`.
     *
     * This property is intended to be overriden in subclasses as needed,
     * e.g. it returns the underlying diff editor model in `MonacoDiffEditor`.
     */
    protected get baseModel(): monaco.editor.IEditorModel;
    dispose(): void;
}
export declare namespace MonacoEditor {
    interface IEditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {
    }
    interface ICommonOptions {
        /**
         * Whether an editor should be auto resized on a content change.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        autoSizing?: boolean;
        /**
         * A minimal height of an editor in lines.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        minHeight?: number;
        /**
         * A maximal height of an editor in lines.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        maxHeight?: number;
    }
    interface IOptions extends ICommonOptions, monaco.editor.IStandaloneEditorConstructionOptions {
    }
    function getAll(manager: EditorManager): MonacoEditor[];
    function getCurrent(manager: EditorManager): MonacoEditor | undefined;
    function getActive(manager: EditorManager): MonacoEditor | undefined;
    function get(editorWidget: EditorWidget | undefined): MonacoEditor | undefined;
}
