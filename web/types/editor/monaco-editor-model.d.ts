import * as monaco from "monaco-editor";
import URI from '..\core\common\uri';
import { DisposableCollection, CancellationTokenSource, CancellationToken, Emitter, IEvent as Event } from '..\core\common';
import { TextEditorDocument } from "./text-editor";
import { Saveable, SaveOptions } from '..\core\saveable';
import { FileState, FileData, FileSystemService } from '..\core\filesystem';
import { ITextModel, ITextSnapshot } from 'monaco-editor/esm/vs/editor/common/model';
import { IResolvedTextEditorModel } from 'monaco-editor/esm/vs/editor/common/services/resolverService';
export interface MonacoModelContentChangedEvent {
    readonly model: MonacoEditorModel;
    readonly fileData?: FileData;
}
export interface MonacoTextDocumentContentChange {
    readonly range: monaco.IRange;
    readonly rangeOffset: number;
    readonly rangeLength: number;
    readonly text: string;
}
export declare class MonacoEditorModel implements IResolvedTextEditorModel, TextEditorDocument {
    readonly resource: URI;
    readonly model: monaco.editor.ITextModel;
    readonly fileSystemService: FileSystemService;
    protected readonly toDispose: DisposableCollection;
    readonly onWillSaveLoopTimeOut = 1500;
    protected bufferSavedVersionId: number;
    protected readonly toDisposeOnAutoSave: DisposableCollection;
    protected readonly onDidChangeContentEmitter: Emitter<MonacoModelContentChangedEvent>;
    readonly onDidChangeContent: Event<MonacoModelContentChangedEvent>;
    constructor(resource: URI, model: monaco.editor.ITextModel, fileSystemService: FileSystemService);
    get uri(): string;
    protected _languageId: string | undefined;
    get languageId(): string;
    getLanguageId(): string | undefined;
    /**
     * It's a hack to dispatch close notification with an old language id; don't use it.
     */
    setLanguageId(languageId: string | undefined): void;
    protected fireDidChangeContent(event: FileState): void;
    protected asContentChangedEvent(event: FileState): MonacoModelContentChangedEvent;
    protected asTextDocumentContentChangeEvent(change: monaco.editor.IModelContentChange): MonacoTextDocumentContentChange;
    protected ignoreDirtyEdits: boolean;
    protected markAsDirty(): void;
    get onContentChanged(): Event<void>;
    load(): Promise<MonacoEditorModel>;
    save(options?: SaveOptions): Promise<void>;
    revert(): Promise<void>;
    protected saveCancellationTokenSource: CancellationTokenSource;
    protected cancelSave(): CancellationToken;
    createSnapshot(preserveBOM?: boolean): ITextSnapshot;
    applySnapshot(snapshot: Saveable.Snapshot): void;
    protected scheduleSave(token?: CancellationToken, overwriteEncoding?: boolean, options?: SaveOptions): Promise<void>;
    protected doSave(token: CancellationToken, overwriteEncoding?: boolean, options?: SaveOptions): Promise<void>;
    protected pendingOperation: Promise<void>;
    protected run(operation: () => Promise<void>): Promise<void>;
    dispose(): void;
    get onDispose(): monaco.IEvent<void>;
    get onWillDispose(): Event<void>;
    get textEditorModel(): monaco.editor.ITextModel & ITextModel;
    get readOnly(): boolean;
    isReadonly(): boolean;
    protected _dirty: boolean;
    get dirty(): boolean;
    protected setDirty(dirty: boolean): void;
    private updateSavedVersionId;
    protected readonly onDirtyChangedEmitter: Emitter<void>;
    get onDirtyChanged(): Event<void>;
}
