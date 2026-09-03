import { injectable, inject } from "inversify";
import { h } from '@lumino/virtualdom';
import URI from "@MagicIdea/core/common/uri";
import {
  NavigatableWidgetOptions,
  WidgetFactory,
  LabelProvider,
  SelectionService,
} from "@MagicIdea/core";
import { EditorWidget } from "./editor-widget";
import { TextEditorProvider } from "./text-editor";

@injectable()
export class EditorWidgetFactory implements WidgetFactory {
  static createID(uri: URI, counter?: number): string {
    return (
      EditorWidgetFactory.ID +
      `:${uri.toString()}` +
      (counter !== undefined ? `:${counter}` : "")
    );
  }

  static ID = "code-editor-opener";

  readonly id = EditorWidgetFactory.ID;

  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;

  @inject(TextEditorProvider)
  protected readonly editorProvider: TextEditorProvider;

  @inject(SelectionService)
  protected readonly selectionService: SelectionService;

  createWidget(options: NavigatableWidgetOptions): Promise<EditorWidget> {
    const uri = new URI(options.uri);
    return this.createEditor(uri, options);
  }

  protected async createEditor(
    uri: URI,
    options?: NavigatableWidgetOptions
  ): Promise<EditorWidget> {
    const newEditor = await this.constructEditor(uri);
    this.setLabels(newEditor, uri);
    const labelListener = this.labelProvider.onDidChange((event) => {
      if (event.affects(uri)) {
        this.setLabels(newEditor, uri);
      }
    });
    newEditor.onDispose(() => labelListener.dispose());

    newEditor.id = EditorWidgetFactory.createID(uri, options?.counter);

    newEditor.title.closable = true;
    return newEditor;
  }

  protected async constructEditor(uri: URI): Promise<EditorWidget> {
    const textEditor = await this.editorProvider(uri);
    return new EditorWidget(textEditor, this.selectionService);
  }

  private setLabels(editor: EditorWidget, uri: URI): void {
    // editor.title.caption = this.labelProvider.getLongName(uri) || uri.path.fsPath();
    if (editor.editor.isReadonly) {
      editor.title.caption += ` • Read-only`;
    }
    const iconText = this.labelProvider.getIcon(uri);
    const iconColor = this.labelProvider.getIconColor(uri);
    editor.title.label = this.labelProvider.getName(uri);
    editor.title.caption = this.labelProvider.getLongName(uri);
    editor.title.iconClass = iconText + " file-icon";
    if (iconColor && iconColor !== "") {
      editor.title.icon = {
        render: () => {
          return h.span({
            className: "magic-resource-icon",
            style: {
              color: iconColor,
              marginRight: "4px"
            }
          }, iconText);
        }
      };
    }
  }
}
