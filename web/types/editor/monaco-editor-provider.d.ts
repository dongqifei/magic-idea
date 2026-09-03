import * as monaco from "monaco-editor";
import { URI } from '..\core\common\uri';
import { MonacoEditor, MonacoEditorServices } from "./monaco-editor";
import { MonacoEditorModel } from "./monaco-editor-model";
import { MonacoDiffEditor } from "./monaco-diff-editor";
import { TextEditor } from "./text-editor";
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { DiffNavigator } from "./diff-navigator";
import { DisposableCollection } from '..\core\common\disposable';
import { OpenerService } from '..\core';
import { PreferenceChange } from '..\core\preferences\preference-types';
import { OpenExternalOptions, OpenInternalOptions } from 'monaco-editor/esm/vs/platform/opener/common/opener';
export declare class MonacoEditorProvider {
    private readonly modelService;
    private readonly fileSystemService;
    private preferenceService;
    private themeService;
    protected readonly openerService: OpenerService;
    protected readonly services: MonacoEditorServices;
    protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory;
    protected _current: MonacoEditor | undefined;
    /**
     * Returns the last focused MonacoEditor.
     * It takes into account inline editors as well.
     * If you are interested only in standalone editors then use `MonacoEditor.getCurrent(EditorManager)`
     */
    get current(): MonacoEditor | undefined;
    protected getModel(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditorModel>;
    get(uri: URI): Promise<MonacoEditor>;
    protected doCreateEditor<T extends MonacoEditor>(uri: URI, factory: (toDispose: DisposableCollection) => Promise<T>): Promise<T>;
    /**
     * Intercept internal Monaco open calls and delegate to OpenerService.
     */
    protected interceptOpen(monacoUri: monaco.Uri | string, monacoOptions?: OpenInternalOptions | OpenExternalOptions): Promise<boolean>;
    protected createEditor(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditor>;
    protected get preferencePrefixes(): string[];
    createMonacoEditor(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditor>;
    protected createMonacoEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions;
    protected updateMonacoEditorOptions(editor: MonacoEditor, event?: PreferenceChange): void;
    protected get diffPreferencePrefixes(): string[];
    protected createMonacoDiffEditor(uri: URI, toDispose: DisposableCollection): Promise<MonacoDiffEditor>;
    protected createMonacoDiffEditorOptions(original: MonacoEditorModel, modified: MonacoEditorModel): MonacoDiffEditor.IOptions;
    protected updateMonacoDiffEditorOptions(editor: MonacoDiffEditor, event?: PreferenceChange): void;
    protected createOptions(prefixes: string[]): Record<string, any>;
    protected setOption(preferenceName: string, value: any, prefixes: string[], options?: Record<string, any>): {
        [name: string]: any;
    };
    protected toOptionName(preferenceName: string, prefixes: string[]): string | undefined;
    protected doSetOption(obj: Record<string, any>, value: any, names: string[]): void;
    getDiffNavigator(editor: TextEditor): DiffNavigator;
}
