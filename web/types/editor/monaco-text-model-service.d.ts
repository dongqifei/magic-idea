import * as monaco from 'monaco-editor';
import { IDisposable, IReference } from 'monaco-editor/esm/vs/base/common/lifecycle';
import { ITextModelService, ITextModelContentProvider } from 'monaco-editor/esm/vs/editor/common/services/resolverService';
import { ITextModelUpdateOptions } from 'monaco-editor/esm/vs/editor/common/model';
import URI from '..\core\common\uri';
import { ReferenceCollection, Event, MaybePromise, Emitter } from '..\core';
import { MonacoEditorModel } from './monaco-editor-model';
import { FileSystemService } from '..\core\filesystem';
export declare const MonacoEditorModelFactory: unique symbol;
export interface MonacoEditorModelFactory {
    readonly scheme: string;
    createModel(uri: URI): MaybePromise<MonacoEditorModel>;
}
export declare const MonacoEditorModelFilter: unique symbol;
/**
 * A filter that prevents firing the `onDidCreate` event for certain models.
 * Preventing this event from firing will also prevent the propagation of the model to the plugin host.
 *
 * This is useful for models that are not supposed to be opened in a dedicated monaco editor widgets.
 * This includes models for notebook cells.
 */
export interface MonacoEditorModelFilter {
    /**
     * Return `true` on models that should be filtered.
     */
    filter(model: MonacoEditorModel): boolean;
}
export declare class MonacoTextModelService implements ITextModelService {
    readonly _serviceBrand: undefined;
    protected readonly _models: ReferenceCollection<string, MonacoEditorModel>;
    protected readonly _visibleModels: Set<MonacoEditorModel>;
    protected readonly onDidCreateEmitter: Emitter<MonacoEditorModel>;
    protected readonly logger: import("@MagicIdea/core/logger").Logger;
    protected readonly fileSystemService: FileSystemService;
    private readonly modelService;
    protected init(): void;
    get models(): MonacoEditorModel[];
    get(uri: string): MonacoEditorModel | undefined;
    get onDidCreate(): Event<MonacoEditorModel>;
    createModelReference(raw: monaco.Uri | URI): Promise<IReference<MonacoEditorModel>>;
    loadModel(uri: URI): Promise<MonacoEditorModel>;
    protected createModel(uri: URI, content: any): MaybePromise<MonacoEditorModel>;
    protected readonly modelOptions: {
        [name: string]: (keyof ITextModelUpdateOptions | undefined);
    };
    registerTextModelContentProvider(scheme: string, provider: ITextModelContentProvider): IDisposable;
    canHandleResource(resource: monaco.Uri): boolean;
}
