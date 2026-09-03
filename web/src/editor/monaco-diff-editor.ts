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

import URI from '@MagicIdea/core/common/uri';
import { Disposable } from '@MagicIdea/core/common';
import { DeltaDecorationParams } from '@MagicIdea/editor/text-editor';
import { DiffNavigator } from './diff-navigator';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoEditor, MonacoEditorServices } from './monaco-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { DiffUris } from '@MagicIdea/core/common/diff-uris';
import * as monaco from 'monaco-editor';
import { IDiffEditorConstructionOptions } from 'monaco-editor/esm/vs/editor/browser/editorBrowser';
import { IStandaloneDiffEditor, StandaloneDiffEditor2 } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneCodeEditor';
import { ILineChange } from 'monaco-editor/esm/vs/editor/common/diff/legacyLinesDiffComputer';

export namespace MonacoDiffEditor {
    export interface IOptions extends MonacoEditor.ICommonOptions, IDiffEditorConstructionOptions {
    }
}

export class MonacoDiffEditor extends MonacoEditor {
    
    declare protected _diffEditor: IStandaloneDiffEditor;
    protected _diffNavigator: DiffNavigator;
    protected readonly diffEditorModel: monaco.editor.IDiffEditorModel;

    constructor(
        uri: URI,
        node: HTMLElement,
        readonly originalModel: MonacoEditorModel,
        readonly modifiedModel: MonacoEditorModel,
        protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory,
        options: MonacoDiffEditor.IOptions,
        services: MonacoEditorServices,
    ) {
        super(uri, modifiedModel, node, options, services);
        this.diffEditorModel = { original: this.originalModel.textEditorModel, modified: this.modifiedModel.textEditorModel };
        this._diffNavigator = diffNavigatorFactory.createdDiffNavigator(this._diffEditor);
    }

    get diffEditor(): monaco.editor.IStandaloneDiffEditor {
        return this._diffEditor as unknown as monaco.editor.IStandaloneDiffEditor;
    }

    get diffNavigator(): DiffNavigator {
        return this._diffNavigator;
    }

    get diffInformation(): ILineChange[] {
        return this._diffEditor.getLineChanges() || [];
    }

    protected override create(options?: IDiffEditorConstructionOptions): Disposable {
        const combinedOptions = {
            fontSize: 14,
            glyphMargin: false,
            originalGlyphMargin: false,
            minimap: { enabled: false },
            lineNumbers: "on",
            automaticLayout: true,
            readOnly: true,
            renderSideBySide: true,
            fixedOverflowWidgets: true,
            ...options
        };
        try {
            const instantiator = this.getInstantiatorWithOverrides();
            /**
             *  @monaco-uplift. Should be guaranteed to work.
             *  Incomparable enums prevent TypeScript from believing that public IStandaloneDiffEditor is satisfied by private StandaloneDiffEditor
             */
            this._diffEditor = instantiator.createInstance(StandaloneDiffEditor2, this.node, combinedOptions);
            // this._diffEditor = monaco.editor.createDiffEditor(this.node, combinedOptions);
            
            this.editor = this._diffEditor.getModifiedEditor() as unknown as monaco.editor.IStandaloneCodeEditor;
            return this._diffEditor;
        } catch (err) {
            console.error('Error in MonacoDiffEditor.create', err);
            throw err;
        }
    }

    override deltaDecorations(params: DeltaDecorationParams): string[] {
        console.warn('`deltaDecorations` should be called on either the original, or the modified editor.');
        return [];
    }

    override getResourceUri(): URI {
        return new URI(this.modifiedModel.uri);
    }
    override createMoveToUri(resourceUri: URI): URI {
        const [left, right] = DiffUris.decode(this.uri);
        return DiffUris.encode(left.withPath(resourceUri.path), right.withPath(resourceUri.path));
    }

    override handleVisibilityChanged(nowVisible: boolean): void {
        const isFirstShow = nowVisible && !this.savedViewState;
        super.handleVisibilityChanged(nowVisible);
        if (isFirstShow) {
            this._diffEditor.revealFirstDiff();
        }
    }

    protected override get baseEditor(): monaco.editor.IEditor {
        return this.diffEditor;
    }

    protected override get baseModel(): monaco.editor.IEditorModel {
        return this.diffEditorModel;
    }
}