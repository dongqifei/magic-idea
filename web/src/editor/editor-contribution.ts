import { injectable, inject, named } from "inversify";
import { debounce } from "lodash";
import * as monaco from "monaco-editor";
import { Widget, DockLayout, Title, TabBar } from "@lumino/widgets";
import { FrontendApplicationContribution } from "@MagicIdea/core/frontend-application-contribution";
import { DiffUris, DisposableCollection, ContributionProvider, Prioritizeable, MenuContribution, MenuModelRegistry } from "@MagicIdea/core/common";
import { ContextKeyService, OpenWithService, ContextKey } from "@MagicIdea/core";
import { FileSystemService } from "@MagicIdea/core/filesystem";
import { IStatusBarService } from "@MagicIdea/core/statusbar";
import { CommandContribution, CommandRegistry } from "@MagicIdea/core/commands";
import { ToolbarService } from "@MagicIdea/core/shell/toolbar/toolbar-types";
import { QuickInputService } from "@MagicIdea/core/quick-input/quick-input-types";
import { EditorManager } from "./editor-manager";
import { EditorWidget } from "./editor-widget";
import { MiniProblemStatusBar } from "./monaco-editor-problem";
import { KeybindingContribution, KeybindingRegistry } from "@MagicIdea/core/keybinding";
import { EditorCommands } from "./editor-command";
import { SplitEditorContribution } from './split-editor-contribution';
import { SHELL_TABBAR_CONTEXT_SPLIT, SHELL_TABBAR_SPLIT_SUBMENU, ApplicationShellLayout, CurrentWidgetCommandAdapter} from "@MagicIdea/core/shell";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@MagicIdea/core/shell/tab-bar-toolbar";

// 辅助类型定义（放在文件顶部）
type MonacoEditor = monaco.editor.IStandaloneCodeEditor;
type MonacoDiffEditor = monaco.editor.IStandaloneDiffEditor;
type Diagnostic = monaco.editor.IMarkerData;

@injectable()
export class EditorContribution
  implements
    FrontendApplicationContribution,
    CommandContribution,
    KeybindingContribution,
    MenuContribution,
    TabBarToolbarContribution
{
  @inject(ApplicationShellLayout)
  protected readonly shell: ApplicationShellLayout;
  @inject(OpenWithService)
  protected readonly openWithService: OpenWithService;
  @inject(EditorManager)
  protected readonly editorManager: EditorManager;
  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;
  @inject(FileSystemService)
  protected readonly fileSystemService: FileSystemService;
  @inject(ToolbarService)
  private toolbarService: ToolbarService;
  @inject(IStatusBarService)
  private readonly statusBarService: IStatusBarService;
  @inject(QuickInputService)
  protected readonly quickInput: QuickInputService;

  @inject(ContributionProvider)
  @named(SplitEditorContribution)
  protected readonly splitEditorContributions: ContributionProvider<SplitEditorContribution>;

  private commandRegistry: CommandRegistry;

  // 用于管理事件监听的销毁器
  private readonly disposables = new DisposableCollection();
  // 当前激活编辑器的事件监听销毁器
  private currentEditorDisposables = new DisposableCollection();
  // 当前激活编辑器的状态栏项
  private problemItemUpdate?: (opts: any) => void;
  // 状态栏项的更新器引用
  private cursorItemUpdate?: (opts: any) => void;
  private languageItemUpdate?: (opts: any) => void;
  // 选中文本状态栏项更新器
  private selectionItemUpdate?: (opts: any) => void;

  // 存储当前编辑器的诊断信息监听
  private currentDiagnosticDisposable?: monaco.IDisposable;

  // 防抖函数（300ms 延迟）
  private debouncedUpdateProblemStatus = debounce(
    (problemCount: number, warningCount: number) =>
      this.updateProblemStatusBar(problemCount, warningCount),
    300,
    { leading: false, trailing: true }, // 只在最后一次触发后执行
  );

  protected editorIsOpen: ContextKey<boolean>;
  protected textCompareEditorVisible: ContextKey<boolean>;
  protected resourceExtname: ContextKey<string>;
  protected resourceScheme: ContextKey<string>;
  protected resourcelanguageId: ContextKey<string>;

  onStart(): void {
    // 初始化编辑器上下文键
    this.initEditorContextKeys();

    // 注册默认打开处理程序
    this.openWithService.registerHandler({
      id: "default",
      label: this.editorManager.label,
      providerName: "Built-in",
      canHandle: () => 100,
      // Higher priority than any other handler
      // so that the text editor always appears first in the quick pick
      getOrder: () => 10000,
      open: (uri) => this.editorManager.open(uri),
    });
    // 注册状态栏项（行号列号和语言）
    this.registerStatusBarItems();
  }

  onStop(): void {
    this.dispose();
  }

  protected initEditorContextKeys(): void {
    this.editorIsOpen = this.contextKeyService.createKey<boolean>(
      "editorIsOpen",
      false,
    );
    this.textCompareEditorVisible = this.contextKeyService.createKey<boolean>(
      "textCompareEditorVisible",
      false,
    );
    this.resourceExtname = this.contextKeyService.createKey<string>(
      "resourceExtname",
      "",
    );
    this.resourcelanguageId = this.contextKeyService.createKey<string>(
      "editorLangId",
      "",
    );
    this.resourceScheme = this.contextKeyService.createKey<string>(
      "resourceScheme",
      "",
    );
    const updateContextKeys = () => {
      const widgets = this.editorManager.all;
      this.editorIsOpen.set(!!widgets.length);
      this.textCompareEditorVisible.set(
        widgets.some((widget) => DiffUris.isDiffUri(widget.editor.uri)),
      );
    };
    updateContextKeys();
    for (const widget of this.editorManager.all) {
      widget.disposed.connect(updateContextKeys);
    }
    this.editorManager.onCreated((widget) => {
      updateContextKeys();
      widget.disposed.connect(updateContextKeys);
    });
    this.editorManager.onCurrentEditorChanged((widget) => {
      this.resourceExtname.set(widget?.editor.uri.path.ext || "");
      this.resourceScheme.set(widget?.editor.uri.scheme || "");
      this.handleActiveEditorChange(widget);
      // 更新工具栏
      this.toolbarService.update();
    });
  }

  registerCommands(commands: CommandRegistry): void {
    this.commandRegistry = commands;
    commands.addCommand("editor.action.gotoLine", {
      label: "快速访问",
      execute: () => {
        this.quickInput.showInputBox({
          value: "",
          placeholder: "转到指定行...",
          labelTips: "输入行号即可自动跳转到指定行，按'Escape'键取消。",
          onDidChangeValue: (value: any) => {
            const lineNumber = parseInt(value, 10);
            // 判断是否为有效的行号
            if (
              !isNaN(lineNumber) &&
              this.editorManager.currentEditor instanceof EditorWidget
            ) {
              this.editorManager.currentEditor?.editor
                .getControl()
                .setPosition({ lineNumber: lineNumber, column: 1 }); // 跳转到指定行
              this.editorManager.currentEditor?.editor
                .getControl()
                .revealLine(lineNumber);
            }
          },
        });
      },
    });

    const splitHandlerFactory = (
      lable: string,
      splitMode: DockLayout.InsertMode,
      iconClass?: string
    ) =>
      new CurrentWidgetCommandAdapter(this.shell, {
        label: lable,
        iconClass: iconClass,
        isEnabled: (args) => {
          if (!args.title?.owner) {
            return false;
          }
          return this.findSplitContribution(args.title.owner) !== undefined;
        },
        execute: async (args) => {
          if (!args.title?.owner) {
            return;
          }
          const contribution = this.findSplitContribution(args.title.owner);
          if (contribution) {
            await contribution.split(args.title.owner, splitMode);
          }
        },
      });

    // 注册拆分编辑器命令
    commands.addCommand(
      EditorCommands.SPLIT_EDITOR_HORIZONTAL.id,
      splitHandlerFactory(
        EditorCommands.SPLIT_EDITOR_HORIZONTAL.label,
        "split-right", 
        "codicon codicon-split-horizontal"
      ),
    );
    commands.addCommand(
      EditorCommands.SPLIT_EDITOR_VERTICAL.id,
      splitHandlerFactory(
        EditorCommands.SPLIT_EDITOR_VERTICAL.label,
        "split-bottom",
      ),
    );
    commands.addCommand(
      EditorCommands.SPLIT_EDITOR_RIGHT.id,
      splitHandlerFactory(
        EditorCommands.SPLIT_EDITOR_RIGHT.label,
        "split-right",
      ),
    );
    commands.addCommand(
      EditorCommands.SPLIT_EDITOR_DOWN.id,
      splitHandlerFactory(
        EditorCommands.SPLIT_EDITOR_DOWN.label,
        "split-bottom",
      ),
    );
    commands.addCommand(
      EditorCommands.SPLIT_EDITOR_UP.id,
      splitHandlerFactory(EditorCommands.SPLIT_EDITOR_UP.label, "split-top"),
    );
    commands.addCommand(
      EditorCommands.SPLIT_EDITOR_LEFT.id,
      splitHandlerFactory(EditorCommands.SPLIT_EDITOR_LEFT.label, "split-left"),
    );
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: EditorCommands.SPLIT_EDITOR_HORIZONTAL.id,
      keybinding: "ctrl+\\",
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(SHELL_TABBAR_SPLIT_SUBMENU, "拆分编辑器");
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
      commandId: EditorCommands.SPLIT_EDITOR_UP.id,
      label: "向上拆分",
      order: "1",
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
      commandId: EditorCommands.SPLIT_EDITOR_DOWN.id,
      label: "向下拆分",
      order: "2",
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
      commandId: EditorCommands.SPLIT_EDITOR_LEFT.id,
      label: "向左拆分",
      order: "3",
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
      commandId: EditorCommands.SPLIT_EDITOR_RIGHT.id,
      label: "向右拆分",
      order: "4",
    });
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: EditorCommands.SPLIT_EDITOR_HORIZONTAL.id,
      command: EditorCommands.SPLIT_EDITOR_HORIZONTAL.id,
      isVisible: widget => widget instanceof EditorWidget,
      tooltip: "水平拆分",
      priority: 1,
    });
  }

  protected findSplitContribution(
    widget: Widget,
  ): SplitEditorContribution | undefined {
    const prioritized = Prioritizeable.prioritizeAllSync(
      this.splitEditorContributions.getContributions(),
      (contribution) => contribution.canHandle(widget),
    );
    return prioritized.length > 0 ? prioritized[0].value : undefined;
  }

  /**
   * 注册状态栏项（行号列号和语言）
   */
  private registerStatusBarItems(): void {
    // 问题状态栏项（左侧）
    const problemItem = this.statusBarService.registerItem(
      "monaco-editor-problem",
      {
        alignment: "left",
        tooltip: "问题: 0个, 警告: 0个",
        visible: true,
        type: "custom",
        priority: 120,
        property: {
          problemCount: 0,
          warningCount: 0,
        },
        onClick: () => {
          // 点击问题状态栏时触发的操作
          this.commandRegistry.execute("view:problems:toggle");
        },
        render: () => {
          return MiniProblemStatusBar;
        },
      },
    );
    this.problemItemUpdate = problemItem.update;

    // 行号列号状态栏项（右侧，高优先级）
    const cursorItem = this.statusBarService.registerItem(
      "monaco-editor-cursor",
      {
        text: "行 1, 列 1",
        alignment: "right",
        priority: 200,
        tooltip: "当前光标位置",
        type: "text",
        onClick: () => {
          // 点击行号列号状态栏时触发的操作
          this.commandRegistry.execute("editor.action.gotoLine");
        },
      },
    );
    this.cursorItemUpdate = cursorItem.update;

    // 选中文本统计状态栏项（优先级低于光标和语言）
    const selectionItem = this.statusBarService.registerItem(
      "monaco-editor-selection",
      {
        text: "0 字符",
        alignment: "right",
        priority: 190,
        tooltip: "选中文本统计",
        type: "text",
        visible: false, // 默认隐藏
      },
    );
    this.selectionItemUpdate = selectionItem.update;

    // 语言状态栏项（右侧，次高优先级）
    const languageItem = this.statusBarService.registerItem(
      "monaco-editor-language",
      {
        text: "Plain Text",
        alignment: "right",
        priority: 180,
        tooltip: "当前文件语言",
        icon: "codicon codicon-bracket",
        type: "text",
      },
    );
    this.languageItemUpdate = languageItem.update;

    this.disposables.pushAll([
      () => cursorItem.dispose(),
      () => selectionItem.dispose(),
      () => languageItem.dispose(),
      () => problemItem.dispose(), // 销毁问题状态栏项
      () => this.currentDiagnosticDisposable?.dispose(), // 销毁诊断监听
      () => this.debouncedUpdateProblemStatus.cancel(), // 取消防抖任务
    ]);
  }

  // 辅助函数：判断是否为 Diff 编辑器
  private isDiffEditor(editor: any): editor is MonacoDiffEditor {
    return (
      editor &&
      typeof editor.getOriginalEditor === "function" &&
      typeof editor.getModifiedEditor === "function"
    );
  }

  // 辅助函数：获取当前活跃的子编辑器（Diff 编辑器中使用）
  private getActiveSubEditor(diffEditor: MonacoDiffEditor): MonacoEditor {
    // 判断哪个子编辑器有焦点（优先）
    if (diffEditor.getModifiedEditor().hasTextFocus()) {
      return diffEditor.getModifiedEditor();
    }
    if (diffEditor.getOriginalEditor().hasTextFocus()) {
      return diffEditor.getOriginalEditor();
    }
    // 无焦点时默认返回 modifiedEditor
    return diffEditor.getModifiedEditor();
  }

  /**
   * 统计诊断信息中的错误和警告数量
   * @param diagnostics 诊断信息数组
   * @returns { problemCount: number, warningCount: number }
   */
  private countProblemsAndWarnings(diagnostics: Diagnostic[]): {
    problemCount: number;
    warningCount: number;
  } {
    return diagnostics.reduce(
      (acc, diagnostic) => {
        switch (diagnostic.severity) {
          case monaco.MarkerSeverity.Error:
            acc.problemCount++;
            break;
          case monaco.MarkerSeverity.Warning:
            acc.warningCount++;
            break;
          // 忽略信息性和提示性诊断
          case monaco.MarkerSeverity.Info:
          case monaco.MarkerSeverity.Hint:
          default:
            break;
        }
        return acc;
      },
      { problemCount: 0, warningCount: 0 },
    );
  }

  /**
   * 更新问题状态栏项
   * @param problemCount 错误数量
   * @param warningCount 警告数量
   */
  private updateProblemStatusBar(
    problemCount: number,
    warningCount: number,
  ): void {
    this.problemItemUpdate?.({
      tooltip: `问题: ${problemCount}个, 警告: ${warningCount}个`,
      property: {
        problemCount,
        warningCount,
      },
      visible: true, // 没有问题和警告时隐藏
    });
  }

  /**
   * 监听编辑器模型的诊断信息变化
   * @param model 编辑器模型
   */
  private listenToDiagnostics(model: monaco.editor.ITextModel): void {
    // 先销毁之前的诊断监听
    this.currentDiagnosticDisposable?.dispose();

    // 初始统计一次
    const initialDiagnostics = monaco.editor.getModelMarkers({
      resource: model.uri,
    });
    const initialCounts = this.countProblemsAndWarnings(initialDiagnostics);
    this.updateProblemStatusBar(
      initialCounts.problemCount,
      initialCounts.warningCount,
    );

    // 监听诊断信息变化（当 linter 或 Monaco 自身检测到错误/警告变化时触发）
    this.currentDiagnosticDisposable = monaco.editor.onDidChangeMarkers(
      (resources) => {
        // 只处理当前模型的诊断变化
        if (resources.some((uri) => uri.toString() === model.uri.toString())) {
          const diagnostics = monaco.editor.getModelMarkers({
            resource: model.uri,
          });
          const counts = this.countProblemsAndWarnings(diagnostics);
          // this.updateProblemStatusBar(counts.problemCount, counts.warningCount);
          // 触发防抖更新
          this.debouncedUpdateProblemStatus(
            counts.problemCount,
            counts.warningCount,
          );
        }
      },
    );

    // 添加到当前编辑器的监听列表，以便切换时销毁
    this.currentEditorDisposables.push(this.currentDiagnosticDisposable);
  }

  /**
   * 处理活跃编辑器变化
   */
  private handleActiveEditorChange(widget?: EditorWidget): void {
    // 切换编辑器时，取消之前的防抖任务，避免残留更新
    this.debouncedUpdateProblemStatus.cancel();
    // 清除上一个编辑器的事件监听
    this.currentEditorDisposables.dispose();
    // 销毁上一个编辑器的诊断监听
    this.currentDiagnosticDisposable?.dispose();

    if (!widget) {
      // 无活跃编辑器时隐藏相关状态栏项
      this.cursorItemUpdate?.({ text: "", visible: false });
      this.languageItemUpdate?.({ text: "", visible: false });
      this.selectionItemUpdate?.({ text: "", visible: false });
      this.updateProblemStatusBar(0, 0); // 重置问题状态栏
      return;
    }

    // 获取monaco编辑器实例
    const monacoEditor = widget.editor.getControl();
    let editor: MonacoEditor;
    if (!monacoEditor) {
      this.updateProblemStatusBar(0, 0);
      return;
    } else if (this.isDiffEditor(monacoEditor)) {
      editor = this.getActiveSubEditor(monacoEditor);

      // Diff编辑器特殊处理：监听两个子编辑器的诊断变化
      const originalModel = monacoEditor.getOriginalEditor().getModel();
      const modifiedModel = monacoEditor.getModifiedEditor().getModel();

      if (originalModel && modifiedModel) {
        // 监听两个模型的诊断变化
        this.listenToDiffEditorDiagnostics(originalModel, modifiedModel);
      }
    } else {
      editor = monacoEditor;
    }

    const model = editor?.getModel();
    if (!model) {
      this.updateProblemStatusBar(0, 0);
      return;
    }

    // 初始更新一次状态
    this.updateCursorPosition(editor);
    this.updateLanguage(model);
    this.updateSelectionStats(editor); // 初始更新选中文本统计

    // 监听光标位置变化
    const cursorDisposable = editor.onDidChangeCursorPosition(() => {
      this.updateCursorPosition(editor);
      this.updateSelectionStats(editor); // 光标移动时更新选中统计
    });

    // 监听选区变化（专门处理文本选择）
    const selectionDisposable = editor.onDidChangeCursorSelection(
      (event: any) => {
        // 直接使用事件中的选区，避免二次获取可能的延迟
        this.updateSelectionStatsBySelection(editor, event.selection);
      },
    );

    // 监听语言变化
    const languageDisposable = model.onDidChangeLanguage(() => {
      this.updateLanguage(model);
    });

    // 监听当前编辑器模型的诊断变化（非Diff编辑器）
    if (!this.isDiffEditor(monacoEditor)) {
      this.listenToDiagnostics(model);
    }

    // 添加到当前编辑器的监听列表
    this.currentEditorDisposables.pushAll([
      languageDisposable,
      selectionDisposable,
      cursorDisposable,
    ]);
  }

  /**
   * 处理Diff编辑器的诊断监听（合并两个子编辑器的问题和警告）
   */
  private listenToDiffEditorDiagnostics(
    originalModel: monaco.editor.ITextModel,
    modifiedModel: monaco.editor.ITextModel,
  ): void {
    // 先销毁之前的诊断监听
    this.currentDiagnosticDisposable?.dispose();

    // 初始统计两个模型的诊断信息
    const updateDiffDiagnostics = () => {
      const originalDiagnostics = monaco.editor.getModelMarkers({
        resource: originalModel.uri,
      });
      const modifiedDiagnostics = monaco.editor.getModelMarkers({
        resource: modifiedModel.uri,
      });

      // 合并两个模型的诊断信息
      const allDiagnostics = [...originalDiagnostics, ...modifiedDiagnostics];
      const counts = this.countProblemsAndWarnings(allDiagnostics);

      // this.updateProblemStatusBar(counts.problemCount, counts.warningCount);
      // 触发防抖更新
      this.debouncedUpdateProblemStatus(
        counts.problemCount,
        counts.warningCount,
      );
    };

    // 初始更新
    updateDiffDiagnostics();

    // 监听两个模型的诊断变化
    this.currentDiagnosticDisposable = monaco.editor.onDidChangeMarkers(
      (resources) => {
        const isOriginalModelChanged = resources.some(
          (uri) => uri.toString() === originalModel.uri.toString(),
        );
        const isModifiedModelChanged = resources.some(
          (uri) => uri.toString() === modifiedModel.uri.toString(),
        );

        if (isOriginalModelChanged || isModifiedModelChanged) {
          updateDiffDiagnostics();
        }
      },
    );

    // 添加到当前编辑器的监听列表
    this.currentEditorDisposables.push(this.currentDiagnosticDisposable);
  }

  /**
   * 更新光标位置信息
   */
  private updateCursorPosition(
    editor: monaco.editor.IStandaloneCodeEditor,
  ): void {
    const position = editor.getPosition();
    if (!position) return;

    // monaco的行号和列号从1开始
    const text = `行 ${position.lineNumber}, 列 ${position.column}`;
    this.cursorItemUpdate?.({
      text,
      tooltip: `光标位置: 行 ${position.lineNumber}, 列 ${position.column}`,
      visible: true,
    });
  }

  /**
   * 更新语言信息
   */
  private updateLanguage(model: monaco.editor.ITextModel): void {
    const languageId = model.getLanguageId();
    // 获取语言名称（monaco内置语言通常有友好名称）
    const language = monaco.languages
      .getLanguages()
      .find((l) => l.id === languageId);
    const languageName = language?.aliases?.[0] || languageId;

    this.resourcelanguageId.set(languageId || "");

    this.languageItemUpdate?.({
      text: `${languageName}`,
      tooltip: `当前文件语言: ${languageName}`,
      visible: true,
    });
  }

  // 通过传入的选区直接更新，避免依赖 editor.getSelection() 的时机问题
  private updateSelectionStatsBySelection(
    editor: monaco.editor.IStandaloneCodeEditor,
    selection: monaco.Range | null,
  ) {
    if (!selection || selection.isEmpty()) {
      this.selectionItemUpdate?.({ visible: false });
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);
    const charCount = selectedText.replace(/\r\n|\r|\n/g, "").length;
    const lineCount = selection.endLineNumber - selection.startLineNumber + 1;

    let displayText = `已选择 ${charCount} 字符`;
    if (lineCount > 1) {
      displayText += ` (${lineCount} 行)`;
    }

    this.selectionItemUpdate?.({
      text: displayText,
      tooltip: `当前选中: ${charCount}个字符，${lineCount}行`,
      visible: true,
    });
  }

  private updateSelectionStats(
    editor: monaco.editor.IStandaloneCodeEditor,
  ): void {
    const selection = editor.getSelection();
    this.updateSelectionStatsBySelection(editor, selection);
  }

  /**
   * 销毁资源
   */
  private dispose(): void {
    this.debouncedUpdateProblemStatus.cancel(); // 取消所有防抖任务
    this.disposables.dispose();
    this.currentEditorDisposables.dispose();
    this.currentDiagnosticDisposable?.dispose();
  }
}
