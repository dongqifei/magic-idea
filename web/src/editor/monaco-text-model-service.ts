// *****************************************************************************
// Copyright (C) 2018 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { inject, injectable, named, postConstruct } from 'inversify';
import * as monaco from 'monaco-editor';

import { IDisposable, IReference } from 'monaco-editor/esm/vs/base/common/lifecycle';
import { ITextModelService, ITextModelContentProvider } from 'monaco-editor/esm/vs/editor/common/services/resolverService';
import { ITextModelUpdateOptions } from 'monaco-editor/esm/vs/editor/common/model';

import URI from '@MagicIdea/core/common/uri';
import { ResourceProvider, ReferenceCollection, Event, MaybePromise, ContributionProvider, Emitter } from '@MagicIdea/core';
import { MonacoEditorModel } from './monaco-editor-model';
import { getLogger } from '@MagicIdea/core/logger';
import { FileSystemService } from "@MagicIdea/core/filesystem";
import { DocumentModelService } from './monaco-document-model-service'

export const MonacoEditorModelFactory = Symbol('MonacoEditorModelFactory');
export interface MonacoEditorModelFactory {

    readonly scheme: string;

    createModel(
        uri: URI
    ): MaybePromise<MonacoEditorModel>;

}

export const MonacoEditorModelFilter = Symbol('MonacoEditorModelFilter');
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

@injectable()
export class MonacoTextModelService implements ITextModelService {
    declare readonly _serviceBrand: undefined;

    protected readonly _models = new ReferenceCollection<string, MonacoEditorModel>(
        uri => this.loadModel(new URI(uri))
    );

    protected readonly _visibleModels = new Set<MonacoEditorModel>();

    protected readonly onDidCreateEmitter = new Emitter<MonacoEditorModel>();

    // @inject(ResourceProvider)
    // protected readonly resourceProvider: ResourceProvider;

    // @inject(ContributionProvider)
    // @named(MonacoEditorModelFactory)
    // protected readonly factories: ContributionProvider<MonacoEditorModelFactory>;

    // @inject(ContributionProvider)
    // @named(MonacoEditorModelFilter)
    // protected readonly filters: ContributionProvider<MonacoEditorModelFilter>;

    protected readonly logger = getLogger('monaco-editor-model-service');

    @inject(FileSystemService)
    protected readonly fileSystemService: FileSystemService;

    @inject(DocumentModelService)
    private readonly modelService: DocumentModelService;
    @postConstruct()
    protected init(): void {
        this._models.onDidCreate(model => {
            // const filters = this.filters.getContributions();
            // if (filters.some(filter => filter.filter(model))) {
            //     return;
            // }
            this._visibleModels.add(model);
            this.modelService.onDisposed(data => {
                if (data.uri.toString() === model.uri.toString()) {
                    this._visibleModels.delete(model);
                    model.dispose();
                }
            })
            this.onDidCreateEmitter.fire(model);
        });
    }

    get models(): MonacoEditorModel[] {
        return Array.from(this._visibleModels);
    }

    get(uri: string): MonacoEditorModel | undefined {
        return this._models.get(uri);
    }

    get onDidCreate(): Event<MonacoEditorModel> {
        return this.onDidCreateEmitter.event;
    }

    createModelReference(raw: monaco.Uri | URI): Promise<IReference<MonacoEditorModel>> {
        const model =  this._models.acquire(raw.toString());
        return model;
    }

    async loadModel(uri: URI): Promise<MonacoEditorModel> {
        // 读取文件内容
        const content = await this.fileSystemService.readFile(uri);
        const model = await (await this.createModel(uri, content)).load()
        return model;
    }

    protected createModel(uri: URI, content: any): MaybePromise<MonacoEditorModel> {
        // const factory = this.factories.getContributions().find(({ scheme }) => uri.scheme === scheme);
        // return factory ? factory.createModel(uri) : new MonacoEditorModel(uri);
        const model = this.modelService.pinModel(uri, content.script);
        return new MonacoEditorModel(uri, model, this.fileSystemService);
    }

    protected readonly modelOptions: { [name: string]: (keyof ITextModelUpdateOptions | undefined) } = {
        'editor.tabSize': 'tabSize',
        'editor.insertSpaces': 'insertSpaces',
        'editor.indentSize': 'indentSize'
    };

    registerTextModelContentProvider(scheme: string, provider: ITextModelContentProvider): IDisposable {
        return {
            dispose(): void {
                // no-op
            }
        };
    }

    canHandleResource(resource: monaco.Uri): boolean {
        return this.fileSystemService.canHandleResource(URI.fromComponents(resource));
    }
}
