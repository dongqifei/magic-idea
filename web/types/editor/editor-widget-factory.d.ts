import URI from '..\core\common\uri';
import { NavigatableWidgetOptions, WidgetFactory, LabelProvider, SelectionService } from '..\core';
import { EditorWidget } from "./editor-widget";
import { TextEditorProvider } from "./text-editor";
export declare class EditorWidgetFactory implements WidgetFactory {
    static createID(uri: URI, counter?: number): string;
    static ID: string;
    readonly id: string;
    protected readonly labelProvider: LabelProvider;
    protected readonly editorProvider: TextEditorProvider;
    protected readonly selectionService: SelectionService;
    createWidget(options: NavigatableWidgetOptions): Promise<EditorWidget>;
    protected createEditor(uri: URI, options?: NavigatableWidgetOptions): Promise<EditorWidget>;
    protected constructEditor(uri: URI): Promise<EditorWidget>;
    private setLabels;
}
