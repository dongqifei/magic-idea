import { injectable, inject } from "inversify";
import URI from "@MagicIdea/core/common/uri";
import * as monaco from "monaco-editor";
import { Event, Emitter } from '@MagicIdea/core';
import { FileSystemService } from '@MagicIdea/core/filesystem/file-system-types';
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
import { IModelService } from 'monaco-editor/esm/vs/editor/common/services/model';
import { ILanguageService } from 'monaco-editor/esm/vs/editor/common/languages/language';

type Disposable = monaco.IDisposable | { dispose: () => void };

/**
 * Configuration for the service
 */
export interface IDocumentModelServiceOptions {
  cacheTTL?: number; // milliseconds before an unpinned model is disposed (default 5min)
  cacheSize?: number; // max number of cached models when unpinned (LRU) (default 50)
}

/**
 * DocumentModelService
 */
@injectable()
export class DocumentModelService {
  private modelRegistry = new Map<string, monaco.editor.ITextModel>();
  private modelDisposables = new Map<string, Disposable>();
  protected readonly onDisposedEmitter = new Emitter<monaco.editor.ITextModel>();

  // reference counting + LRU cache for models
  private refCount = new Map<string, number>();
  private lruQueue: URI[] = [];
  private cacheTimers = new Map<string, number>(); // resourceUri -> timeout id

  // config
  private cacheTTL: number;
  private cacheSize: number;

  constructor(
    @inject(FileSystemService) private fileSystemService: FileSystemService
  ) {
    this.cacheTTL = 0;
    this.cacheSize = 50;
  }

  get onDisposed(): Event<monaco.editor.ITextModel> {
    return this.onDisposedEmitter.event;
  }

  // 获取模型的方法
  getModel(resourceUri: URI): monaco.editor.ITextModel | undefined {
    const model = this.modelRegistry.get(this._parseResourceUri(resourceUri));
    return model && !model.isDisposed() ? model : undefined;
  }

  /**
   * Create or return an existing model. Does NOT alter pin/refcount.
   * Use pinModel/releaseModel to manage lifecycle.
   */
  createOrGetModel(resourceUri: URI, value?: string | null): monaco.editor.ITextModel {
    const _resourceUri = this._parseResourceUri(resourceUri);
    let model = this.modelRegistry.get(_resourceUri);
    if (model && !model.isDisposed()) {
      return model;
    }else{
      let firstLine;
      if (typeof value === 'string') {
          firstLine = value;
          const firstLF = value.indexOf('\n');
          if (firstLF !== -1) {
              firstLine = value.substring(0, firstLF);
          }
      }
      const languageSelection = StandaloneServices.get(ILanguageService).createByFilepathOrFirstLine(resourceUri['codeUri'], firstLine);
      const languageId = StandaloneServices.get(ILanguageService).guessLanguageIdByFilepathOrFirstLine(resourceUri['codeUri']);
      const monacoUri = monaco.Uri.parse(resourceUri.toString());
      model = StandaloneServices.get(IModelService).createModel(value || '', languageSelection?.language || languageId, monacoUri);
    }
    // register
    this.modelRegistry.set(_resourceUri, model);

    // subscribe changes -> update dirty state
    const disp = model.onDidChangeContent(() => {
      this._onModelContentChanged(resourceUri);
    });
    // track dispose to cleanup maps
    const w = model.onWillDispose(() => {
      try { disp.dispose(); } catch {}
      this._cleanupModel(resourceUri);
    });

    this.modelDisposables.set(_resourceUri, w);

    return model;
  }

  /**
   * Pin a model (increase refcount). EditorFactory should call this when creating a view.
   */
  pinModel(resourceUri: URI, value?: string | null): monaco.editor.ITextModel {
    const _resourceUri = this._parseResourceUri(resourceUri);
    const model = this.modelRegistry.get(_resourceUri) || this.createOrGetModel(resourceUri, value);

    // cancel any pending eviction if present
    this._cancelEviction(_resourceUri);
    this._touchLRU(resourceUri);
    return model;
  }

  getRefCount(resourceUri: URI): number { 
    const _resourceUri = this._parseResourceUri(resourceUri);
    return this.refCount.get(_resourceUri) ?? 0;
  }

  /**
   * 模型引用计数 +1
   * @param _resourceUri 模型资源唯一标识
   */
  incrementRefCount(resourceUri: URI): void {
    const _resourceUri = this._parseResourceUri(resourceUri);
    const prevCount = this.refCount.get(_resourceUri) ?? 0;
    this.refCount.set(_resourceUri, prevCount + 1);
  }

  /**
   * Release a model (decrease refcount). When refcount reaches 0, schedule eviction (TTL).
   */
  releaseModel(resourceUri: URI): number {
    const _resourceUri = this._parseResourceUri(resourceUri);
    const prev = this.refCount.get(_resourceUri) ?? 0;
    const next = Math.max(0, prev - 1);
    if (next === 0) {
      this.refCount.delete(_resourceUri);
      this._scheduleEviction(resourceUri);
    } else {
      this.refCount.set(_resourceUri, next);
    }
    this._touchLRU(resourceUri);
    return next;
  }

  /**
   * Dispose model immediately (force).
   */
  disposeModel(resourceUri: URI): void {
    const _resourceUri = this._parseResourceUri(resourceUri);
    const model = this.modelRegistry.get(_resourceUri);
    if (!model) return;
    if (!model.isDisposed()) {
      try {
        this.fileSystemService.cleanupState(resourceUri);
        this.onDisposedEmitter.fire(model);
        model.dispose(); 
      } catch(e) {
        console.error(e);
      }
    }
    // cleanup maps done in model dispose handlers
  }

  // --------------------
  // Internal helpers
  // --------------------
  private async _onModelContentChanged(resourceUri: URI): Promise<void> {
    const model = this.modelRegistry.get(this._parseResourceUri(resourceUri));
    if (!model || model.isDisposed()) return;
    // 获取当前内容并更新哈希
    const content = model.getValue();
    this.fileSystemService.updateFileData(resourceUri, { script: content });
  }

  /** schedule eviction of model after TTL if refcount is zero; uses LRU semantics */
  private _scheduleEviction(resourceUri: URI) {
    const _resourceUri = this._parseResourceUri(resourceUri);
    if (this.refCount.get(_resourceUri)) return; // someone pinned meanwhile
    if (this.cacheTTL <= 0) {
      this.disposeModel(resourceUri);
      return;
    }
    // ensure it's in LRU
    this._touchLRU(resourceUri);
    // schedule a timeout
    const tid = window.setTimeout(() => {
      // if still unpinned and still LRU beyond cacheSize, dispose
      if (!this.refCount.get(_resourceUri)) {
        // enforce cache size
        this._ensureCacheSize();
        // if resourceUri still in lruQueue tail beyond allowed size or TTL expired, dispose
        if (!this.refCount.get(_resourceUri)) {
          this.disposeModel(resourceUri);
        }
      }
      this.cacheTimers.delete(_resourceUri);
    }, this.cacheTTL);
    this.cacheTimers.set(_resourceUri, tid);
  }

  private _cancelEviction(resourceUri: string) {
    const tid = this.cacheTimers.get(resourceUri);
    if (tid !== undefined) {
      clearTimeout(tid);
      this.cacheTimers.delete(resourceUri);
    }
  }

  /** Update LRU queue (move resourceUri to front) */
  private _touchLRU(resourceUri: URI) {
    const idx = this.lruQueue.indexOf(resourceUri);
    if (idx !== -1) this.lruQueue.splice(idx, 1);
    this.lruQueue.unshift(resourceUri);
    // enforce size
    this._ensureCacheSize();
  }

  private _ensureCacheSize() {
    while (this.lruQueue.length > this.cacheSize) {
      const tail = this.lruQueue.pop();
      if (!tail) break;
      // if unpinned, dispose, else skip
      const _resourceUri = this._parseResourceUri(tail);
      if (!this.refCount.get(_resourceUri)) {
        this.disposeModel(tail);
      }
    }
  }

  /** Clean up model records when underlying model disposed */
  private _cleanupModel(resourceUri: URI) {
    const _resourceUri = this._parseResourceUri(resourceUri);
    try {
      this.modelRegistry.delete(_resourceUri);
      const d = this.modelDisposables.get(_resourceUri);
      if (d) try { (d as any).dispose?.(); } catch {}
      this.modelDisposables.delete(_resourceUri);
      this.refCount.delete(_resourceUri);
      const idx = this.lruQueue.indexOf(resourceUri);
      if (idx !== -1) this.lruQueue.splice(idx, 1);
      const tid = this.cacheTimers.get(_resourceUri);
      if (tid !== undefined) { clearTimeout(tid); this.cacheTimers.delete(_resourceUri); }
      // snapshots kept by default; optionally clear them here if desired
    } catch (e) {
      // ignore
    }
  }

  private _parseResourceUri(resourceUri: URI): string {
    try {
      return resourceUri.resourceId;
    } catch {
      throw new Error(`Invalid resource URI: ${resourceUri.toString()}`);
    }
  }
}