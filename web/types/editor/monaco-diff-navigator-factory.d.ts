import { DiffNavigator } from './diff-navigator';
import { IDiffEditor } from 'monaco-editor/esm/vs/editor/browser/editorBrowser';
export declare class MonacoDiffNavigatorFactory {
    static nullNavigator: DiffNavigator;
    createdDiffNavigator(editor: IDiffEditor): DiffNavigator;
}
