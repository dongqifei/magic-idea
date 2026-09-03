import URI from '..\core\common\uri';
import * as monaco from "monaco-editor";
import { Event, Emitter } from '..\core';
import { FileSystemService } from '..\core\filesystem\file-system-types';
/**
 * Configuration for the service
 */
export interface IDocumentModelServiceOptions {
    cacheTTL?: number;
    cacheSize?: number;
}
/**
 * DocumentModelService
 */
export declare class DocumentModelService {
    private fileSystemService;
    private modelRegistry;
    private modelDisposables;
    protected readonly onDisposedEmitter: Emitter<monaco.editor.ITextModel>;
    private refCount;
    private lruQueue;
    private cacheTimers;
    private cacheTTL;
    private cacheSize;
    constructor(fileSystemService: FileSystemService);
    get onDisposed(): Event<monaco.editor.ITextModel>;
    getModel(resourceUri: URI): monaco.editor.ITextModel | undefined;
    /**
     * Create or return an existing model. Does NOT alter pin/refcount.
     * Use pinModel/releaseModel to manage lifecycle.
     */
    createOrGetModel(resourceUri: URI, value?: string | null): monaco.editor.ITextModel;
    /**
     * Pin a model (increase refcount). EditorFactory should call this when creating a view.
     */
    pinModel(resourceUri: URI, value?: string | null): monaco.editor.ITextModel;
    getRefCount(resourceUri: URI): number;
    /**
     * 模型引用计数 +1
     * @param _resourceUri 模型资源唯一标识
     */
    incrementRefCount(resourceUri: URI): void;
    /**
     * Release a model (decrease refcount). When refcount reaches 0, schedule eviction (TTL).
     */
    releaseModel(resourceUri: URI): number;
    /**
     * Dispose model immediately (force).
     */
    disposeModel(resourceUri: URI): void;
    private _onModelContentChanged;
    /** schedule eviction of model after TTL if refcount is zero; uses LRU semantics */
    private _scheduleEviction;
    private _cancelEviction;
    /** Update LRU queue (move resourceUri to front) */
    private _touchLRU;
    private _ensureCacheSize;
    /** Clean up model records when underlying model disposed */
    private _cleanupModel;
    private _parseResourceUri;
}
