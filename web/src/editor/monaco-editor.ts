
import { injectable, inject, unmanaged } from 'inversify';
import * as monaco from "monaco-editor";
import URI from "@MagicIdea/core/common/uri";
import { DiffUris } from '@MagicIdea/core/common/diff-uris';
import {
  Disposable,
  DisposableCollection,
  Emitter,
  IEvent as Event,
} from "@MagicIdea/core/common";
import { EditorManager } from './editor-manager';
import { EditorWidget } from './editor-widget';
import { TextEditor, Selection, Position, Range, DeltaDecorationParams } from "./text-editor";
import { MonacoEditorModel } from "./monaco-editor-model";
import { IInstantiationService, ServiceIdentifier } from 'monaco-editor/esm/vs/platform/instantiation/common/instantiation';
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
import { ShowLightbulbIconMode } from 'monaco-editor/esm/vs/editor/common/config/editorOptions';
import { IStandaloneEditorConstructionOptions, StandaloneEditor } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneCodeEditor';
import { MonacoTextModelService } from './monaco-text-model-service';
import { DocumentModelService } from './monaco-document-model-service'

export type ServicePair<T> = [ServiceIdentifier<T>, T];

export interface EditorServiceOverrides extends Iterable<ServicePair<unknown>> { }

@injectable()
export class MonacoEditorServices {

    @inject(MonacoTextModelService)
    protected readonly monacoModelService: MonacoTextModelService;
    @inject(DocumentModelService)
    protected readonly modelService: DocumentModelService;

    constructor(@unmanaged() services: MonacoEditorServices) {
        Object.assign(this, services);
    }
}

export class MonacoEditor extends MonacoEditorServices implements TextEditor {
  
  protected readonly toDispose = new DisposableCollection();

  protected editor: monaco.editor.IStandaloneCodeEditor;

  // eslint-disable-next-line no-null/no-null
  protected savedViewState: monaco.editor.IEditorViewState | null = null;

  protected readonly onCursorPositionChangedEmitter = new Emitter<Position>();
  protected readonly onSelectionChangedEmitter = new Emitter<Selection>();
  protected readonly onFocusChangedEmitter = new Emitter<boolean>();
  protected readonly onDocumentContentChangedEmitter = new Emitter<any>();

  static async create(uri: URI,
    document: MonacoEditorModel,
    node: HTMLElement,
    options: MonacoEditor.IOptions,
    services: MonacoEditorServices,
  ): Promise<MonacoEditor> {
    const instance = new MonacoEditor(uri, document, node, options, services);
    await instance.init();
    return instance;
  }

  constructor(
    readonly uri: URI,
    readonly document: MonacoEditorModel,
    readonly node: HTMLElement,
    readonly options: MonacoEditor.IOptions,
    services: MonacoEditorServices,
  ) {
    super(services);
    this.toDispose.pushAll([
      this.onCursorPositionChangedEmitter,
      this.onSelectionChangedEmitter,
      this.onFocusChangedEmitter,
      this.onDocumentContentChangedEmitter,
    ]);
    // 销毁编辑器关联的模型
    this.toDispose.push(
      Disposable.create(() => {
        let _uri = this.uri;
        if (DiffUris.isDiffUri(uri)) {
          const [left, right] = DiffUris.decode(uri);
          this.modelService.releaseModel(left);
          _uri = right;
        }
        const refCount = this.modelService.releaseModel(_uri);
        if (refCount === 0) {
          this.document.dispose();
        }
      })
    );
    this.toDispose.push(this.create({
      ...options,
    }));
    this.addHandlers(this.editor);
    this.editor.createContextKey('resource', document.uri);
  }

  protected async init(): Promise<void> {
    // this.toDispose.push(await this.monacoModelService.createModelReference(this.uri));
  }

  protected create(options?: monaco.editor.IStandaloneEditorConstructionOptions | IStandaloneEditorConstructionOptions): Disposable {
    const combinedOptions = {
        glyphMargin: true,
        minimap: { enabled: true },
        lineDecorationsWidth: 20, // 行号宽度
        overviewRulerLanes: 3, // 滚动条列数
        lineNumbersMinChars: 3, // 行号最小宽度
        automaticLayout: false, // 自动布局
        model: this.document.model ?? undefined,
        lightbulb: { enabled: ShowLightbulbIconMode.On },
        fixedOverflowWidgets: true,
        scrollbar: {
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            ...options?.scrollbar,
        },
        ...options,
    } as IStandaloneEditorConstructionOptions;
    const instantiator = this.getInstantiatorWithOverrides();
    /**
     * @monaco-uplift. Should be guaranteed to work.
     * Incomparable enums prevent TypeScript from believing that public IStandaloneCodeEditor is satisfied by private StandaloneCodeEditor
     */
    return this.editor = instantiator.createInstance(StandaloneEditor, this.node, combinedOptions) as unknown as monaco.editor.IStandaloneCodeEditor
  }

  protected getInstantiatorWithOverrides(): IInstantiationService {
    const instantiator = StandaloneServices.get(IInstantiationService);
    return instantiator;
  }

  protected addHandlers(codeEditor: monaco.editor.IStandaloneCodeEditor): void {
    this.toDispose.push(codeEditor.onDidChangeCursorPosition(() =>
      this.onCursorPositionChangedEmitter.fire(this.cursor)
    ));
    this.toDispose.push(codeEditor.onDidChangeCursorSelection(event =>
      this.onSelectionChangedEmitter.fire(event.selection)
    ));
    this.toDispose.push(codeEditor.onDidFocusEditorText(() =>
      this.onFocusChangedEmitter.fire(this.isFocused())
    ));
    this.toDispose.push(codeEditor.onDidChangeModel(() => {
       this.refresh();
    }));
    this.toDispose.push(codeEditor.onDidChangeModelContent(e => {
        this.refresh();
        this.onDocumentContentChangedEmitter.fire({ document: this.document, contentChanges: e.changes.map(this.mapModelContentChange.bind(this)) });
    }));
  }

  protected mapModelContentChange(change: monaco.editor.IModelContentChange): any {
    return {
        range: change.range,
        rangeLength: change.rangeLength,
        text: change.text
    };
  }

  get cursor(): Position {
    return this.editor.getPosition()!;
  }

  set cursor(cursor: Position) {
    this.editor.setPosition(cursor);
  }

  get selection(): Selection {
    return this.editor.getSelection()!;
  }

  set selection(selection: Selection) {
    this.editor.setSelection(selection);
  }

  get onSelectionChanged(): Event<Selection> {
    return this.onSelectionChangedEmitter.event;
  }

  getControl(): monaco.editor.IStandaloneCodeEditor {
    return this.editor;
  }

  get onDispose(): Event<void> {
    return this.toDispose.onDispose;
  }
  
  get onDocumentContentChanged(): Event<any> {
    return this.onDocumentContentChangedEmitter.event;
  }

  get isReadonly(): boolean {
    return this.document.readOnly;
  }

  revealPosition(raw: Position): void {
    const position = raw;
    this.editor.revealPositionInCenter(position);
  }

  revealRange(raw: Range): void {
    const range = raw;
    this.editor.revealRangeInCenter(range!);
  }

  focus(): void {
    /**
     * `this.editor.focus` forcefully changes the focus editor state,
     * regardless whether the textarea actually received the focus.
     * It could lead to issues like https://github.com/eclipse-theia/theia/issues/7902
     * Instead we focus the underlying textarea.
     */
    const node = this.editor.getDomNode();
    if (node) {
      const textarea = node.querySelector('textarea') as HTMLElement;
      textarea.focus();
    }
  }

  refresh(): void {
    this.editor.layout();
  }

  getResourceUri(): URI | undefined {
    return this.uri;
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    return this.uri.withPath(resourceUri.path);
  }

  isFocused(): boolean {
    return this.editor.hasTextFocus();
  }

  get onFocusChanged(): Event<boolean> {
    return this.onFocusChangedEmitter.event;
  }

  storeViewState(): object {
    if (this.baseEditor.getModel()) {
      this.savedViewState = this.baseEditor.saveViewState();
    }
    return this.savedViewState!;
  }

  restoreViewState(state: monaco.editor.IEditorViewState): void {
    if (this.baseEditor.getModel()) {
      this.baseEditor.restoreViewState(state);
    }
    this.savedViewState = state;
  }

  handleVisibilityChanged(nowVisible: boolean): void {
    if (nowVisible) {
      this.baseEditor.setModel(this.baseModel);
      this.baseEditor.restoreViewState(this.savedViewState);
      this.baseEditor.focus();
    } else {
      this.savedViewState = this.baseEditor.saveViewState();

      this.baseEditor.setModel(null); // workaround for https://github.com/eclipse-theia/theia/issues/14880
    }
  }

  deltaDecorations(params: DeltaDecorationParams): string[] {
      console.warn('`deltaDecorations` should be called on either the original, or the modified editor.');
      return [];
  }

  /**
   * This property allows working with the underlying editor instance
   * through the base editor interface, `monaco.editor.IEditor`.
   *
   * This property is intended to be overriden in subclasses as needed,
   * e.g. it returns the underlying diff editor in `MonacoDiffEditor`.
   */
  protected get baseEditor(): monaco.editor.IEditor {
    return this.editor;
  }

  /**
   * This property allows working with the underlying editor model instance
   * through the base editor model interface, `monaco.editor.IEditorModel`.
   *
   * This property is intended to be overriden in subclasses as needed,
   * e.g. it returns the underlying diff editor model in `MonacoDiffEditor`.
   */
  protected get baseModel(): monaco.editor.IEditorModel {
      return this.document.model;
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}

export namespace MonacoEditor {
  export interface IEditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {}

  export interface ICommonOptions {
    /**
     * Whether an editor should be auto resized on a content change.
     *
     * #### Fixme
     * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
     */
    autoSizing?: boolean;
    /**
     * A minimal height of an editor in lines.
     *
     * #### Fixme
     * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
     */
    minHeight?: number;
    /**
     * A maximal height of an editor in lines.
     *
     * #### Fixme
     * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
     */
    maxHeight?: number;
  }

  export interface IOptions extends ICommonOptions, monaco.editor.IStandaloneEditorConstructionOptions { }

  export function getAll(manager: EditorManager): MonacoEditor[] {
    return manager.all.map(e => get(e)).filter(e => !!e) as MonacoEditor[];
  }
  
  export function getCurrent(manager: EditorManager): MonacoEditor | undefined {
    return get(manager.currentEditor);
  }

  export function getActive(manager: EditorManager): MonacoEditor | undefined {
    return get(manager.activeEditor);
  }

  export function get(editorWidget: EditorWidget | undefined): MonacoEditor | undefined {
      if (editorWidget && editorWidget.editor instanceof MonacoEditor) {
          return editorWidget.editor;
      }
      return undefined;
  }

  // export function findByDocument(manager: EditorManager, document: MonacoEditorModel): MonacoEditor[] {
  //       return getAll(manager).filter(candidate => candidate.documents.has(document));
  //   }

  // export function getWidgetFor(manager: EditorManager, control: monaco.editor.ICodeEditor | ICodeEditor | undefined | null): EditorWidget | undefined {
  //   if (!control) {
  //       return undefined;
  //   }
  //   return manager.all.find(widget => {
  //       const candidate = get(widget);
  //       return candidate && candidate.getControl() === control;
  //   });
  // }
}