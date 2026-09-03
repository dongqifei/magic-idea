import * as monaco from "monaco-editor";
import URI from "@MagicIdea/core/common/uri";
import {
  Disposable,
  DisposableCollection,
  CancellationTokenSource,
  CancellationToken,
  Emitter,
  IEvent as Event,
} from "@MagicIdea/core/common";
import { TextEditor, TextEditorDocument, Selection, Position, Range } from "./text-editor";
import { Saveable, SaveOptions, SaveReason } from "@MagicIdea/core/saveable";
import { FileState, FileData, FileSystemService } from "@MagicIdea/core/filesystem";
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

export class MonacoEditorModel implements IResolvedTextEditorModel, TextEditorDocument {
  protected readonly toDispose = new DisposableCollection();

  /* @deprecated there is no general save timeout, each participant should introduce a sensible timeout  */
  readonly onWillSaveLoopTimeOut = 1500;
  protected bufferSavedVersionId: number;

  protected readonly toDisposeOnAutoSave = new DisposableCollection();

  protected readonly onDidChangeContentEmitter =
    new Emitter<MonacoModelContentChangedEvent>();
  readonly onDidChangeContent = this.onDidChangeContentEmitter.event;

  constructor(
    readonly resource: URI,
    readonly model: monaco.editor.ITextModel,
    readonly fileSystemService: FileSystemService
  ) {
    this.toDispose.trackEvent(
      (cb) => this.fileSystemService.onDidFileStateChange.connect(cb),
      (cb) => this.fileSystemService.onDidFileStateChange.disconnect(cb),
      (_, data) => {
        if(data.uri.toString() === this.uri.toString()){
          this.fireDidChangeContent(data);
        }
      }
    );
  }

  get uri(): string {
    return this.resource.toString();
  }
  
  protected _languageId: string | undefined;
  get languageId(): string {
      return this._languageId !== undefined ? this._languageId : this.model.getLanguageId();
  }

  getLanguageId(): string | undefined {
      return this.languageId;
  }

  /**
   * It's a hack to dispatch close notification with an old language id; don't use it.
   */
  setLanguageId(languageId: string | undefined): void {
      this._languageId = languageId;
  }
  
  protected fireDidChangeContent(
    event: FileState,
  ): void {
    if (!event.isDirty) {
      this.setDirty(false);
    } else {
      this.markAsDirty();
    }

    const changeContentEvent = this.asContentChangedEvent(event);
    this.onDidChangeContentEmitter.fire(changeContentEvent);
  }

  protected asContentChangedEvent(
    event: FileState,
  ): MonacoModelContentChangedEvent {
    return { model: this, fileData: event.fileData };
  }

  protected asTextDocumentContentChangeEvent(
    change: monaco.editor.IModelContentChange,
  ): MonacoTextDocumentContentChange {
    const range = change.range;
    const rangeOffset = change.rangeOffset;
    const rangeLength = change.rangeLength;
    const text = change.text;
    return { range, rangeOffset, rangeLength, text };
  }

  protected ignoreDirtyEdits = false;
  protected markAsDirty(): void {
    if (this.ignoreDirtyEdits) {
      return;
    }
    this.setDirty(true);
  }

  get onContentChanged(): Event<void> {
    return (listener, thisArgs) =>
      this.onDidChangeContent(() => listener(), thisArgs);
  }

  async load(): Promise<MonacoEditorModel> {
    // await this.resolveModel;
    return this;
  }

  save(options?: SaveOptions): Promise<void> {
    return this.scheduleSave(undefined, undefined, {
      saveReason: SaveReason.Manual,
      ...options,
    });
  }

  revert(): Promise<void> {
    return this.fileSystemService.revert(this.resource);
  }

  protected saveCancellationTokenSource = new CancellationTokenSource();
  protected cancelSave(): CancellationToken {
    this.saveCancellationTokenSource.cancel();
    this.saveCancellationTokenSource = new CancellationTokenSource();
    return this.saveCancellationTokenSource.token;
  }

  createSnapshot(preserveBOM?: boolean): ITextSnapshot {
    return { read: () => this.model.getValue(undefined, preserveBOM) };
  }

  applySnapshot(snapshot: Saveable.Snapshot): void {
    const value = Saveable.Snapshot.read(snapshot) ?? '';
    this.model.setValue(value);
  }
  
  protected scheduleSave(
    token: CancellationToken = this.cancelSave(),
    overwriteEncoding?: boolean,
    options?: SaveOptions,
  ): Promise<void> {
    return this.run(() => this.doSave(token, overwriteEncoding, options));
  }

  protected async doSave(token: CancellationToken, overwriteEncoding?: boolean, options?: SaveOptions): Promise<void> {
    const fileData = this.fileSystemService.getFileData(this.resource);
    if(!fileData){
      return;
    }
    try {
      const auto = options?.saveReason === SaveReason.Manual ? '0': '1';
      await this.fileSystemService.writeFile(this.resource, fileData, auto);
      this.setDirty(false);
    } catch (error) {
      console.error(error);
    }
  }

  protected pendingOperation = Promise.resolve();
  protected async run(operation: () => Promise<void>): Promise<void> {
    if (this.toDispose.disposed) {
        return;
    }
    return this.pendingOperation = this.pendingOperation.then(async () => {
      try {
        await operation();
      } catch (e) {
        console.error(e);
      }
    });
  }
  
  dispose(): void {
    this.toDispose.dispose();
  }

  get onDispose(): monaco.IEvent<void> {
    return this.toDispose.onDispose;
  }
  
  get onWillDispose(): Event<void> {
    return this.toDispose.onDispose;
  }

  // We have a TypeScript problem here. There is a const enum `DefaultEndOfLine` used for ITextModel and a non-const redeclaration of that enum in the public API in
  // Monaco.editor. The values will be the same, but TS won't accept that the two enums are equivalent, so it says these types are irreconcilable.
  get textEditorModel(): monaco.editor.ITextModel & ITextModel {
    // @ts-expect-error ts(2322)
    return this.model;
  }

  get readOnly(): boolean {
    return this.fileSystemService.readOnly ?? false;
  }

  isReadonly(): boolean {
    return this.readOnly;
  }

  protected _dirty = false;
  get dirty(): boolean {
    return this._dirty;
  }

  protected setDirty(dirty: boolean): void {
    if (dirty === this._dirty) {
      return;
    }
    this._dirty = dirty;
    if (dirty === false) {
      this.updateSavedVersionId();
    }
    this.onDirtyChangedEmitter.fire(undefined);
  }

  private updateSavedVersionId(): void {  
    this.bufferSavedVersionId = this.model.getAlternativeVersionId();
  }

  protected readonly onDirtyChangedEmitter = new Emitter<void>();
  get onDirtyChanged(): Event<void> {
    return this.onDirtyChangedEmitter.event;
  }
}