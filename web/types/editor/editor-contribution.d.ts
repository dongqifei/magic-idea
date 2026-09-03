import { Widget } from "@lumino/widgets";
import { FrontendApplicationContribution } from '..\core\frontend-application-contribution';
import { ContributionProvider, MenuContribution, MenuModelRegistry } from '..\core\common';
import { ContextKeyService, OpenWithService, ContextKey } from '..\core';
import { FileSystemService } from '..\core\filesystem';
import { CommandContribution, CommandRegistry } from '..\core\commands';
import { QuickInputService } from '..\core\quick-input\quick-input-types';
import { EditorManager } from "./editor-manager";
import { KeybindingContribution, KeybindingRegistry } from '..\core\keybinding';
import { SplitEditorContribution } from './split-editor-contribution';
import { ApplicationShellLayout } from '..\core\shell';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '..\core\shell\tab-bar-toolbar';
export declare class EditorContribution implements FrontendApplicationContribution, CommandContribution, KeybindingContribution, MenuContribution, TabBarToolbarContribution {
    protected readonly shell: ApplicationShellLayout;
    protected readonly openWithService: OpenWithService;
    protected readonly editorManager: EditorManager;
    protected readonly contextKeyService: ContextKeyService;
    protected readonly fileSystemService: FileSystemService;
    private toolbarService;
    private readonly statusBarService;
    protected readonly quickInput: QuickInputService;
    protected readonly splitEditorContributions: ContributionProvider<SplitEditorContribution>;
    private commandRegistry;
    private readonly disposables;
    private currentEditorDisposables;
    private problemItemUpdate?;
    private cursorItemUpdate?;
    private languageItemUpdate?;
    private selectionItemUpdate?;
    private currentDiagnosticDisposable?;
    private debouncedUpdateProblemStatus;
    protected editorIsOpen: ContextKey<boolean>;
    protected textCompareEditorVisible: ContextKey<boolean>;
    protected resourceExtname: ContextKey<string>;
    protected resourceScheme: ContextKey<string>;
    protected resourcelanguageId: ContextKey<string>;
    onStart(): void;
    onStop(): void;
    protected initEditorContextKeys(): void;
    registerCommands(commands: CommandRegistry): void;
    registerKeybindings(keybindings: KeybindingRegistry): void;
    registerMenus(registry: MenuModelRegistry): void;
    registerToolbarItems(registry: TabBarToolbarRegistry): void;
    protected findSplitContribution(widget: Widget): SplitEditorContribution | undefined;
    /**
     * 注册状态栏项（行号列号和语言）
     */
    private registerStatusBarItems;
    private isDiffEditor;
    private getActiveSubEditor;
    /**
     * 统计诊断信息中的错误和警告数量
     * @param diagnostics 诊断信息数组
     * @returns { problemCount: number, warningCount: number }
     */
    private countProblemsAndWarnings;
    /**
     * 更新问题状态栏项
     * @param problemCount 错误数量
     * @param warningCount 警告数量
     */
    private updateProblemStatusBar;
    /**
     * 监听编辑器模型的诊断信息变化
     * @param model 编辑器模型
     */
    private listenToDiagnostics;
    /**
     * 处理活跃编辑器变化
     */
    private handleActiveEditorChange;
    /**
     * 处理Diff编辑器的诊断监听（合并两个子编辑器的问题和警告）
     */
    private listenToDiffEditorDiagnostics;
    /**
     * 更新光标位置信息
     */
    private updateCursorPosition;
    /**
     * 更新语言信息
     */
    private updateLanguage;
    private updateSelectionStatsBySelection;
    private updateSelectionStats;
    /**
     * 销毁资源
     */
    private dispose;
}
