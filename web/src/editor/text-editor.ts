import URI from "@MagicIdea/core/common/uri";
import { Position, Range, Selection } from 'monaco-editor';
import { Disposable, IEvent as Event } from "@MagicIdea/core/common"
import { Navigatable } from '@MagicIdea/core/navigatable';
import { Saveable } from '@MagicIdea/core/saveable';
import { EditorDecoration } from './decorations/editor-decoration';

export { Position, Range, Selection };

export const TextEditorProvider = Symbol('TextEditorProvider');
export type TextEditorProvider = (uri: URI) => Promise<TextEditor>;

export interface TextEditorDocument extends Saveable, Disposable {
  readonly model: any;
}

export interface TextEditor extends Disposable, Navigatable {

  readonly node: HTMLElement;

  readonly uri: URI;

  readonly isReadonly: boolean;

  readonly document: TextEditorDocument;

  readonly onDocumentContentChanged: Event<any>;

  cursor: Position;
  selection: Selection;
  readonly onSelectionChanged: Event<Selection>;

  getControl(): any;
  
  revealPosition(position: Position): void;

  revealRange(range: Range): void;

  /**
   * The text editor should be revealed,
   * otherwise it won't receive the focus.
   */
  focus(): void;
  refresh(): void;
  isFocused(): boolean;
  readonly onFocusChanged: Event<boolean>;

  /**
   * Applies given new decorations, and removes old decorations identified by ids.
   *
   * @returns identifiers of applied decorations, which can be removed in next call.
   */
  deltaDecorations(params: DeltaDecorationParams): string[];

  isFocused(): boolean;

  storeViewState(): object;
  restoreViewState(state: object): void;

  handleVisibilityChanged(nowVisible: boolean): void;
}

export interface Dimension {
    width: number;
    height: number;
}

export interface DeltaDecorationParams {
  oldDecorations: string[];
  newDecorations: EditorDecoration[];
}