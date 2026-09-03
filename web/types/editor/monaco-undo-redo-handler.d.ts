import { UndoRedoHandler } from "../core/undo-redo/undo-redo-handler";
import * as monaco from "monaco-editor";
import { EditorManager } from "./editor-manager";
export declare abstract class AbstractMonacoUndoRedoHandler implements UndoRedoHandler<monaco.editor.ICodeEditor> {
    priority: number;
    abstract select(): monaco.editor.ICodeEditor | undefined;
    undo(item: monaco.editor.ICodeEditor): void;
    redo(item: monaco.editor.ICodeEditor): void;
}
export declare class FocusedMonacoUndoRedoHandler extends AbstractMonacoUndoRedoHandler {
    priority: number;
    protected codeEditorService: any;
    select(): monaco.editor.ICodeEditor | undefined;
}
export declare class ActiveMonacoUndoRedoHandler extends AbstractMonacoUndoRedoHandler {
    private editorManager;
    priority: number;
    constructor(editorManager: EditorManager);
    protected codeEditorService: any;
    select(): monaco.editor.ICodeEditor | undefined;
}
