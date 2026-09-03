import { ReactWidget } from '@MagicIdea/core/widgets/react-widget';
import { injectable, inject, postConstruct, interfaces } from 'inversify';
import { CommandRegistry } from '@lumino/commands'
import { KeybindingRegistry } from "@MagicIdea/core/keybinding";
import { ApplicationShellLayout } from '@MagicIdea/core/shell/application-shell';
import { MagicApiTreeService } from '../magic-api/magic-api-tree-types';
import { createElement } from "react";
import { SearchView } from './search-view';
import { OpenerService, open, LabelProvider } from '@MagicIdea/core';
import URI from '@MagicIdea/core/common/uri';
import { DisposableCollection } from '@MagicIdea/core/common/disposable';
import { EditorManager, EditorOpenerOptions } from '../editor/editor-manager';
import { EditorWidget } from '../editor/editor-widget';
import debounce from 'lodash.debounce';

@injectable()
export class SearchWidget extends ReactWidget {

  protected searchTerm = '';

  private searchPanel: any;

  protected appliedDecorations = new Map<string, string[]>();

  protected readonly searchOnEditorModificationDelay = 300;
  protected readonly toDisposeOnActiveEditorChanged = new DisposableCollection();

  constructor(
    @inject(CommandRegistry) protected commands: CommandRegistry,
    @inject(KeybindingRegistry) private keybindingRegistry: KeybindingRegistry,
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(MagicApiTreeService) private magicApiTreeService: MagicApiTreeService,
    @inject(EditorManager) private editorManager: EditorManager,
    @inject(OpenerService) private openerService: OpenerService,
    @inject(LabelProvider) private labelProvider: LabelProvider,
  ) {
    super();

    // 注册命令
    this.commands.addCommand("view:search-file", {
      label: "搜索",
      execute: () => this.searchPanel.open(),
    });
    this.keybindingRegistry.registerKeybinding({
      command: "view:search-file",
      keybinding: "ctrl+shift+f",
    });

  }

  protected readonly startSearchOnModification = (activeEditor: EditorWidget) => debounce(
    () => this.searchActiveEditor(activeEditor, this.searchTerm),
    this.searchOnEditorModificationDelay
  );

  protected readonly searchActiveEditor = (activeEditor: EditorWidget, searchTerm: string) => { 
    // console.log('search', searchTerm, activeEditor);
    const editorInstance = activeEditor.editor.getControl();
    if (!editorInstance) return;
    const model = editorInstance.getModel();
    if (!model) return;
    
    const matches = model.findMatches(searchTerm);
    if (matches && matches.length > 0) {
      editorInstance.setSelections(matches.map(it => ({
        positionColumn: it.range.endColumn,
        positionLineNumber: it.range.endLineNumber,
        selectionStartColumn: it.range.startColumn,
        selectionStartLineNumber: it.range.startLineNumber
      })));
    }
  };

  @postConstruct()
  init() {
    this.registerActivePanel();

    this.toDispose.push(
      this.editorManager.onActiveEditorChanged(activeEditor=>{
        this.toDisposeOnActiveEditorChanged.dispose();
        this.toDispose.push(this.toDisposeOnActiveEditorChanged);
        if (activeEditor) {
          this.startSearchOnModification(activeEditor)();
        }
      })
    )
  }

  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.searchPanel = activityManager.registerActivity({
      id: 'search',
      title: '搜索',
      iconClass: 'codicon codicon-search',
      priority: 30,
      location: 'left-top',
      factory: () => {
        return this;
      }
    });
  }

  protected render() {
    return createElement(SearchView, {
      magicApiTreeService: this.magicApiTreeService,
      labelProvider: this.labelProvider,
      onOpenFile: (searchTerm: string, uri: URI, options: EditorOpenerOptions) => {
        this.searchTerm = searchTerm;
        open(this.openerService, uri, options);
      }
    });
  }
}

/**
 * 绑定接口依赖
 * @param bind 
 */
export function bindSearchModule(bind: interfaces.Bind): void {
  // 绑定 Widget
  bind(SearchWidget).to(SearchWidget).inSingletonScope();
}
