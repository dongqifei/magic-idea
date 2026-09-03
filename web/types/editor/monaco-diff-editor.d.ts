import URI from '..\core\common\uri';
import { Disposable } from '..\core\common';
import { DeltaDecorationParams } from './text-editor';
import { DiffNavigator } from './diff-navigator';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoEditor, MonacoEditorServices } from './monaco-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import * as monaco from 'monaco-editor';
import { IDiffEditorConstructionOptions } from 'monaco-editor/esm/vs/editor/browser/editorBrowser';
import { IStandaloneDiffEditor } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneCodeEditor';
import { ILineChange } from 'monaco-editor/esm/vs/editor/common/diff/legacyLinesDiffComputer';
export declare namespace MonacoDiffEditor {
    interface IOptions extends MonacoEditor.ICommonOptions, IDiffEditorConstructionOptions {
    }
}
export declare class MonacoDiffEditor extends MonacoEditor {
    readonly originalModel: MonacoEditorModel;
    readonly modifiedModel: MonacoEditorModel;
    protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory;
    protected _diffEditor: IStandaloneDiffEditor;
    protected _diffNavigator: DiffNavigator;
    protected readonly diffEditorModel: monaco.editor.IDiffEditorModel;
    constructor(uri: URI, node: HTMLElement, originalModel: MonacoEditorModel, modifiedModel: MonacoEditorModel, diffNavigatorFactory: MonacoDiffNavigatorFactory, options: MonacoDiffEditor.IOptions, services: MonacoEditorServices);
    get diffEditor(): monaco.editor.IStandaloneDiffEditor;
    get diffNavigator(): DiffNavigator;
    get diffInformation(): ILineChange[];
    protected create(options?: IDiffEditorConstructionOptions): Disposable;
    deltaDecorations(params: DeltaDecorationParams): string[];
    getResourceUri(): URI;
    createMoveToUri(resourceUri: URI): URI;
    handleVisibilityChanged(nowVisible: boolean): void;
    protected get baseEditor(): monaco.editor.IEditor;
    protected get baseModel(): monaco.editor.IEditorModel;
}
