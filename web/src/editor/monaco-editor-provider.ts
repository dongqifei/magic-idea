import { injectable, inject } from "inversify";
import * as monaco from "monaco-editor";
import { URI } from "@MagicIdea/core/common/uri";
import { DiffUris } from '@MagicIdea/core/common/diff-uris';
import { MonacoEditor, MonacoEditorServices } from "./monaco-editor";
import { MonacoEditorModel } from "./monaco-editor-model";
import { DocumentModelService } from "./monaco-document-model-service";
import { MonacoDiffEditor } from "./monaco-diff-editor";
import { TextEditor } from "./text-editor";
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { DiffNavigator } from "./diff-navigator";
import {
  DisposableCollection,
  Disposable,
} from "@MagicIdea/core/common/disposable";
import { WidgetOpenerOptions, OpenerService, open } from "@MagicIdea/core";
import { HttpOpenHandlerOptions } from '@MagicIdea/core/http-open-handler';
import { FileSystemService } from "@MagicIdea/core/filesystem";
import { PreferenceService } from "@MagicIdea/core/preferences/preference-service";
import { PreferenceChange } from "@MagicIdea/core/preferences/preference-types";
import { ThemeService } from "@MagicIdea/core/theme/theme-service";
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
import { IOpenerService, OpenExternalOptions, OpenInternalOptions } from 'monaco-editor/esm/vs/platform/opener/common/opener';
import { ITextModelService } from 'monaco-editor/esm/vs/editor/common/services/resolverService';
import { IReference } from 'monaco-editor/esm/vs/base/common/lifecycle';

@injectable()
export class MonacoEditorProvider {
  @inject(DocumentModelService)
  private readonly modelService: DocumentModelService;
  @inject(FileSystemService)
  private readonly fileSystemService: FileSystemService;
  @inject(PreferenceService)
  private preferenceService: PreferenceService;
  @inject(ThemeService)
  private themeService: ThemeService;
  @inject(OpenerService)
  protected readonly openerService: OpenerService;
  @inject(MonacoEditorServices)
  protected readonly services: MonacoEditorServices;

  @inject(MonacoDiffNavigatorFactory) protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory;
  
  protected _current: MonacoEditor | undefined;
  /**
   * Returns the last focused MonacoEditor.
   * It takes into account inline editors as well.
   * If you are interested only in standalone editors then use `MonacoEditor.getCurrent(EditorManager)`
   */
  get current(): MonacoEditor | undefined {
      return this._current;
  }
  
  protected async getModel(
    uri: URI,
    toDispose: DisposableCollection,
  ): Promise<MonacoEditorModel> {
    const reference = (await StandaloneServices.get(
      ITextModelService,
    ).createModelReference(
      monaco.Uri.from(uri.toComponents()),
    )) as IReference<MonacoEditorModel>;
    // if document is invalid makes sure that all events from underlying resource are processed before throwing invalid model
    // if (!reference.object.valid) {
    //     await reference.object;
    // }
    // if (!reference.object.valid) {
    //     reference.dispose();
    //     throw Object.assign(new Error(`'${uri.toString()}' is invalid`), { code: 'MODEL_IS_INVALID' });
    // }
    toDispose.push(reference);
    // 次数加一
    this.modelService.incrementRefCount(uri);
    return reference.object;
  }

  async get(uri: URI): Promise<MonacoEditor> {
    await this.preferenceService.ready;
    return this.doCreateEditor(uri, (toDispose) => this.createEditor(uri, toDispose));
  }

  protected async doCreateEditor<T extends MonacoEditor>(uri: URI, factory: (
    toDispose: DisposableCollection) => Promise<T>
  ): Promise<T> {
    StandaloneServices.get(IOpenerService).registerOpener({
      open: (
        u: monaco.Uri | string,
        options: OpenInternalOptions | OpenExternalOptions,
      ) => this.interceptOpen(u, options),
    });
    const toDispose = new DisposableCollection();
    const editor = await factory(toDispose);
    editor.onDispose(() => toDispose.dispose());
    if (editor instanceof MonacoEditor) {
      toDispose.push(editor.onFocusChanged(focused => {
        if (focused) {
          this._current = editor;
        }
      }));
      toDispose.push(Disposable.create(() => {
        if (this._current === editor) {
          this._current = undefined;
        }
      }));
      // 监听主题变更
      toDispose.push(
        this.themeService.onDidChangeTheme((event) => {
          if (event.newTheme) {
            editor.getControl().updateOptions({
              theme: event.newTheme.id,
            });
          }
        }),
      );
    }
    return editor;
  }

  /**
   * Intercept internal Monaco open calls and delegate to OpenerService.
   */
  protected async interceptOpen(
    monacoUri: monaco.Uri | string,
    monacoOptions?: OpenInternalOptions | OpenExternalOptions,
  ): Promise<boolean> {
    let options = undefined;
    if (monacoOptions) {
      if ("openToSide" in monacoOptions && monacoOptions.openToSide) {
        options = Object.assign(options || {}, <WidgetOpenerOptions>{
          widgetOptions: {
            mode: "split-right",
          },
        });
      }
      if ("openExternal" in monacoOptions && monacoOptions.openExternal) {
        options = Object.assign(options || {}, <HttpOpenHandlerOptions>{
          openExternal: true,
        });
      }
    }
    const uri = new URI(monacoUri.toString());
    try {
      await open(this.openerService, uri, options);
      return true;
    } catch (e) {
      console.error(`Fail to open '${uri.toString()}':`, e);
      return false;
    }
  }

  protected createEditor(
    uri: URI,
    toDispose: DisposableCollection,
  ): Promise<MonacoEditor> {
    if (DiffUris.isDiffUri(uri)) {
      return this.createMonacoDiffEditor(uri, toDispose);
    }
    return this.createMonacoEditor(uri, toDispose);
  }

  protected get preferencePrefixes(): string[] {
    return ["editor."];
  }

  async createMonacoEditor(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditor> {
    const container = document.createElement("div");
    container.className = "monaco-editor-container";
    const model = await this.getModel(uri, toDispose);
    const theme = await this.themeService.getCurrentTheme();
    const baseOptions = this.createMonacoEditorOptions(model);
    const options = {...baseOptions, theme: theme?.id ?? "vs",};
    // 创建编辑器实例
    const editor = await MonacoEditor.create(
      uri,
      model,
      container,
      options,
      this.services
    );
    // 监听偏好变更
    toDispose.push(
      this.preferenceService.onDidPreferenceChanged(
        (event: PreferenceChange) => {
          this.updateMonacoEditorOptions(editor, event);
        },
      ),
    );
    toDispose.push(
      // 监听文件内容变更（实时更新编辑器）
      this.fileSystemService.onPropertyUpdatedEvent((event) => {
        if (event.uri?.isEqual(uri) && event.script) {
          model.model.setValue(event.script);
        }
      }),
    );
    return editor;
  }

  protected createMonacoEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions {
    const options = this.createOptions(this.preferencePrefixes);
    // eslint-disable-next-line no-null/no-null
    options.model = null; // explicitly set to null to avoid creating an initial model automatically
    options.readOnly = model.readOnly;
    // this.updateReadOnlyMessage(options, model.readOnly);
    // options.lineNumbersMinChars = model.lineNumbersMinChars;
    return options;
  }

  protected updateMonacoEditorOptions(
    editor: MonacoEditor,
    event?: PreferenceChange,
  ) {
    if (event) {
      const preferenceName = event.key;
      const newValue = this.preferenceService.get(preferenceName);
      const optsions = this.setOption(
        preferenceName,
        newValue,
        this.preferencePrefixes,
      );
      editor.getControl().updateOptions(optsions);
    }
  }

  protected get diffPreferencePrefixes(): string[] {
    return [...this.preferencePrefixes, 'diffEditor.'];
  }

  protected async createMonacoDiffEditor(uri: URI, toDispose: DisposableCollection): Promise<MonacoDiffEditor> {
    const container = document.createElement("div");
    container.className = "monaco-diffEditor-container";
    const [original, modified] = DiffUris.decode(uri);
    
    const originalModel = await this.getModel(original, toDispose);
    const modifiedModel = await this.getModel(modified, toDispose);
    // const [originalModel, modifiedModel] = await Promise.all([this.getModel(original, toDispose), this.getModel(modified, toDispose)]);

    const options = this.createMonacoDiffEditorOptions(originalModel, modifiedModel);
    const editor = new MonacoDiffEditor(
        uri,
        container,
        originalModel, modifiedModel,
        this.diffNavigatorFactory,
        options,
        this.services
      );
      toDispose.push(this.preferenceService.onDidPreferenceChanged(event => {
        // const originalFileUri = original.withoutQuery().withScheme('file').toString();
        this.updateMonacoDiffEditorOptions(editor, event);
      }));
      // toDispose.push(editor.onLanguageChanged(() => this.updateMonacoDiffEditorOptions(editor)));
      return editor;
  }

  protected createMonacoDiffEditorOptions(original: MonacoEditorModel, modified: MonacoEditorModel): MonacoDiffEditor.IOptions {
    const options = this.createOptions(this.diffPreferencePrefixes);
    options.originalEditable = original.isReadonly();
    options.readOnly = modified.readOnly;
    // options.readOnlyMessage = MarkdownString.is(modified.readOnly) ? modified.readOnly : undefined;
    return options;
  }

  protected updateMonacoDiffEditorOptions(editor: MonacoDiffEditor, event?: PreferenceChange): void {
    if (event) {
      const preferenceName = event.key;
      const newValue = this.preferenceService.get(preferenceName, undefined);
      editor.diffEditor.updateOptions(this.setOption(preferenceName, newValue, this.diffPreferencePrefixes));
    }
  }

  protected createOptions(prefixes: string[]): Record<string, any> {
    const keys = this.preferenceService.getAllKeys();
    let options: MonacoEditor.IEditorOptions = {};
    for (const key of keys) {
      const optsions = this.setOption(
        key,
        this.preferenceService.get(key),
        prefixes,
      );
      options = Object.assign(options, optsions);
    }
    return options;
  }

  protected setOption(
    preferenceName: string,
    value: any,
    prefixes: string[],
    options: Record<string, any> = {},
  ): {
    [name: string]: any;
  } {
    const optionName = this.toOptionName(preferenceName, prefixes);
    if (optionName === undefined) {
      return options;
    }
    this.doSetOption(options, value, optionName.split("."));
    return options;
  }

  protected toOptionName(
    preferenceName: string,
    prefixes: string[],
  ): string | undefined {
    for (const prefix of prefixes) {
      if (preferenceName.startsWith(prefix)) {
        return preferenceName.substring(prefix.length);
      }
    }
    return undefined;
  }

  protected doSetOption(
    obj: Record<string, any>,
    value: any,
    names: string[],
  ): void {
    for (let i = 0; i < names.length - 1; i++) {
      const name = names[i];
      if (obj[name] === undefined) {
        obj = obj[name] = {};
      } else if (typeof obj[name] !== "object" || obj[name] === null) {
        // eslint-disable-line no-null/no-null
        console.warn(
          `Preference (diff)editor.${names.join(".")} conflicts with another preference name.`,
        );
        obj = obj[name] = {};
      } else {
        obj = obj[name];
      }
    }
    obj[names[names.length - 1]] = value;
  }

  getDiffNavigator(editor: TextEditor): DiffNavigator {
    if (editor instanceof MonacoDiffEditor) {
        return editor.diffNavigator;
    }
    return MonacoDiffNavigatorFactory.nullNavigator;
  }
}
