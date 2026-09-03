import { OpenerService } from '..\core';
import { IResourceEditorInput } from 'monaco-editor/esm/vs/platform/editor/common/editor';
import { StandaloneCodeEditorService } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneCodeEditorService';
import { ICodeEditor } from 'monaco-editor/esm/vs/editor/browser/editorBrowser';
import { IContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey';
import { IThemeService } from 'monaco-editor/esm/vs/platform/theme/common/themeService';
export declare const VSCodeContextKeyService: unique symbol;
export declare const VSCodeThemeService: unique symbol;
export declare const MonacoEditorServiceFactory: unique symbol;
export type MonacoEditorServiceFactoryType = (contextKeyService: IContextKeyService, themeService: IThemeService) => MonacoEditorService;
/**
 * contribution provider to extend the active editor handling to other editor types than just standalone editor widgets.
 */
export declare const ActiveMonacoEditorContribution: unique symbol;
export interface ActiveMonacoEditorContribution {
    getActiveEditor(): ICodeEditor | undefined;
}
export declare class MonacoEditorService extends StandaloneCodeEditorService {
    protected readonly openerService: OpenerService;
    constructor(contextKeyService: IContextKeyService, themeService: IThemeService);
    /**
     * Monaco active editor is either focused or last focused editor.
     */
    getActiveCodeEditor(): ICodeEditor | null;
    openCodeEditor(input: IResourceEditorInput, source: ICodeEditor | null, sideBySide?: boolean): Promise<ICodeEditor | null>;
}
