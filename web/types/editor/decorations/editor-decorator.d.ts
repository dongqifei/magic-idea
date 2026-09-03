import { TextEditor } from '../text-editor';
import { EditorDecoration } from './editor-decoration';
export declare abstract class EditorDecorator {
    protected readonly appliedDecorations: Map<string, string[]>;
    protected setDecorations(editor: TextEditor, newDecorations: EditorDecoration[]): void;
}
