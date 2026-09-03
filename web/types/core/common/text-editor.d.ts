import URI from "./uri";
import { Disposable, IEvent as Event } from ".";
import * as monaco from 'monaco-editor';
import { Navigatable } from '../navigatable';
import { Saveable } from '../saveable';
export declare const TextEditorProvider: unique symbol;
export type TextEditorProvider = (uri: URI) => Promise<TextEditor>;
export interface TextEditorDocument extends monaco.editor.ITextModel, Saveable, Disposable {
}
export interface TextDocumentChangeEvent {
    readonly document: TextEditorDocument;
}
export interface TextEditor extends Disposable, Navigatable {
    readonly node: HTMLElement;
    readonly uri: URI;
    readonly isReadonly: boolean;
    readonly onDidChangeReadOnly: Event<boolean>;
    readonly document: TextEditorDocument;
    readonly onDocumentContentChanged: Event<TextDocumentChangeEvent>;
    selection: Selection;
    readonly onSelectionChanged: Event<Selection>;
    /**
     * The text editor should be revealed,
     * otherwise it won't receive the focus.
     */
    focus(): void;
    blur(): void;
    isFocused(): boolean;
    readonly onFocusChanged: Event<boolean>;
    /**
     * Rerender the editor.
     */
    refresh(): void;
    /**
     * Resize the editor to fit its node.
     */
    resizeToFit(): void;
    setSize(size: Dimension): void;
    storeViewState(): object;
    restoreViewState(state: object): void;
    setLanguage(languageId: string): void;
    readonly onLanguageChanged: Event<string>;
    handleVisibilityChanged(nowVisible: boolean): void;
}
export interface Dimension {
    width: number;
    height: number;
}
