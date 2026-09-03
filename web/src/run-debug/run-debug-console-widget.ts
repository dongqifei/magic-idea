import { ReactWidget } from "@MagicIdea/core/widgets/react-widget";
import { injectable, inject, postConstruct } from "inversify";
import * as monaco from "monaco-editor";
import { ApplicationShellLayout } from "@MagicIdea/core/shell/application-shell";
import { act, createElement } from "react";
import { MagicApiSocketService } from "@MagicIdea/core/magic-api/magic-api-socket-service";
import { EditorManager } from "@MagicIdea/editor/editor-manager";
import { CommandRegistry } from "@lumino/commands";
import { KeybindingRegistry } from "@MagicIdea/core/keybinding";
import { Variable, BreakpointInfo } from "./run-debug-typs";
import { EditorWidget } from "@MagicIdea/editor/editor-widget";
import { FileData, FileRunService } from "@MagicIdea/core/filesystem";
import { BreakpointManager } from "@MagicIdea/core/breakpoint-manager";
import { parseJavaMapString } from "./utils";
import { DebugConsoleView } from "./components/debug-console-view";

@injectable()
export class RunDebugConsoleWidget extends ReactWidget {
  private debugPanel: any;

  // 当前正在调试的脚本ID
  private scriptId: string;

  // 是否正在调试
  private isDebugging: boolean = false;

  // 断点行号装饰
  private debugLineDecorations: string[] = [];

  // 断点信息
  private breakpointInfo: BreakpointInfo | undefined;

  // 树节点展开状态
  private expandedKeys: Record<string, boolean> = {};

  // 全部展开状态
  private allExpanded: boolean = false;

  // 分页状态
  private paginationState: Record<string, { page: number; loadedAll: boolean}> = {};

  constructor(
    @inject(CommandRegistry) private commands: CommandRegistry,
    @inject(KeybindingRegistry) private keybindings: KeybindingRegistry,
    @inject(ApplicationShellLayout) private shellLayout: ApplicationShellLayout,
    @inject(MagicApiSocketService) private socketService: MagicApiSocketService,
    @inject(EditorManager) private editorManager: EditorManager,
    @inject(FileRunService) protected fileRunService: FileRunService<FileData>,
    @inject(BreakpointManager) private breakpointManager: BreakpointManager
  ) {
    super();

    this.socketService.onSocketMessage(async (message) => {
      if (message.type === "breakpoint") {
        this.isDebugging = true;
        this.scriptId = message.data[0];
        // 断点信息
        const breakpointInfo = message.data[1];
        this.handleBreakpointEvent(breakpointInfo);
      }
    });

    // 监听运行结果
    this.fileRunService.onDidFileRunSuccess(async () => {
      // 清空全局变量数据
      this.clearGlobalVariableData();
    });

    this.fileRunService.onDidFileRunError(async () => {
      // 运行失败，清除调试装饰
      this.clearDebugLineDecorations();
      // 清空全局变量数据
      this.clearGlobalVariableData();
    });

    this.commands.addCommand("debug.action.step", {
      label: "单步执行",
      // iconClass: () => `codicon codicon-debug-step-over`,
      isEnabled: () => this.isDebugging,
      execute: () => {
        this.handleDebugStep("step");
      },
    });
    this.keybindings.registerKeybinding({
      command: "debug.action.step",
      keybinding: "f6",
    });

    // 恢复断点f8
    this.commands.addCommand("debug.action.continue", {
      label: "继续",
      // iconClass: () => `codicon codicon-debug-continue`,
      isEnabled: () => this.isDebugging,
      execute: () => {
        this.handleDebugStep("continue");
      },
    });
    this.keybindings.registerKeybinding({
      command: "debug.action.continue",
      keybinding: "f8",
    });

    // 停止断点
    this.commands.addCommand("debug.stop", {
      label: "停止调试",
      iconClass: () => `codicon codicon-debug-stop`,
      isEnabled: () => this.isDebugging,
      execute: () => {
        this.handleDebugStep("stop");
      },
    });
  }

  private clearGlobalVariableData() { 
    this.isDebugging = false;
    this.scriptId = "";
    this.breakpointInfo = undefined;
    this.expandedKeys = {};
    this.allExpanded = false;
    this.paginationState = {};
    this.update();
  }

  @postConstruct()
  init() {
    this.registerActivePanel();
  }

  // 加载更多数据
  loadMoreData(path: string) { 
    const currentState = this.paginationState[path] || { page: 1, loadedAll: false };
    this.paginationState[path] = { ...currentState, page: currentState.page + 1 };
    this.update();
  }

  // 更新单个变量的展开状态
  public updateVariableExpandState(path: string) { 
    this.expandedKeys[path] = this.expandedKeys[path] ? !this.expandedKeys[path] : true;
    this.update();
  }

  // 展开/折叠全部变量
  public toggleAllVariables() {
    if(!this.breakpointInfo){
      return;
    }

    const newExpanded: Record<string, boolean> = {};
    const shouldExpand = !this.allExpanded;

    // 递归处理所有变量和子变量
    const processVariables = (vars: Variable[], path: string = "") => {
      vars.forEach((variable) => {
        const fullPath = path ? `${path}.${variable.name}` : variable.name;
        if (this.isExpandable(variable)) {
          newExpanded[fullPath] = shouldExpand;
          if (shouldExpand && variable.children) {
            processVariables(variable.children, fullPath);
          }
        }
      });
    };
    processVariables(this.breakpointInfo.variables);
    this.expandedKeys = newExpanded;
    this.allExpanded = shouldExpand;
    this.update();
  }

  // 处理调试步进跳转
  private handleDebugStep(action: "step" | "continue" | "stop") {
    const command = action === "step" ? "1" : "0";
    // 先清理上一步的断点高亮
    this.clearDebugLineDecorations();
    // 获取当前打开的编辑器中的所有断点
    const activeEditorWidget = this.editorManager.currentEditor;
    const uri = activeEditorWidget?.getResourceUri();
    if(!uri){
      return;
    }
    const breakpointArray = this.breakpointManager.getBreakpoints(uri);
    const breakpoints = breakpointArray
      .filter((bp) => bp.enabled)
      .map((bp) => bp.lineNumber)
      .join("|");

    // 发送断点位置给后端
    this.socketService.sendMessage("resume_breakpoint", [
      this.scriptId,
      command,
      breakpoints,
    ]);
  }

  // 清除断点行高亮
  private clearDebugLineDecorations(): void { 
    if (this.debugLineDecorations && this.debugLineDecorations.length > 0) {
      const activeEditorWidget = this.editorManager.currentEditor;
      if (activeEditorWidget instanceof EditorWidget) {
        const activeEditor = activeEditorWidget?.editor;
        const model = activeEditor.getControl().getModel();
        if (!model) return;

        // 清除调试装饰
        activeEditor.getControl().deltaDecorations(this.debugLineDecorations, []);
        this.debugLineDecorations = [];
      }
    }
  }

  // 处理断点事件
  private handleBreakpointEvent(data: BreakpointInfo) {
    // 断点行数
    const range = data.range;
    const transformedVars = data.variables.map((v) => ({
      ...v,
      value:
        typeof v.value === "string" ? parseJavaMapString(v.value) : v.value,
      type: this.formatType(v.type, v.value),
    }));
    this.breakpointInfo = {range, variables: transformedVars}
    // 获取当前激活的编辑器
    const activeEditorWidget = this.editorManager.currentEditor;
    if (activeEditorWidget instanceof EditorWidget) {
      const activeEditor = activeEditorWidget?.editor;
      if (activeEditor) {
        const decoration = {
          range: new monaco.Range(range[0], 1, range[0], 1),
          options: {
            isWholeLine: true,
            inlineClassName: "debug-line",
            className: "debug-line",
          },
        };
        // 添加断点行装饰
        this.debugLineDecorations = activeEditor.getControl()
          .getModel()
          ?.deltaDecorations([], [decoration]);
        // 自动打开断点面板
        this.debugPanel.open();
      }
    }
    // 默认不展开任何变量
    this.expandedKeys = {};
    this.allExpanded = false;
    this.paginationState = {};
    this.update();
  }

  private isExpandable(variable: Variable): boolean { 
    if (Array.isArray(variable.value)) {
      return variable.value.length > 0;
    }
    if (typeof variable.value === "object" && variable.value !== null) {
      return Object.keys(variable.value).length > 0;
    }
    return false;
  }

  private formatType(type: string, value: any): string { 
    if (Array.isArray(value)) {
      return `${type}[${value.length}]`;
    }
    if (typeof value === "object" && value !== null) {
      return `${type}{${Object.keys(value).length}}`;
    }
    return type;
  }

  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.debugPanel = activityManager.registerActivity({
      id: "debug-console",
      title: "调试控制台",
      iconClass: "codicon codicon-debug-console",
      priority: 30,
      location: "left-bottom",
      factory: () => {
        return this;
      },
    });
  }

  protected render() {
    return createElement(DebugConsoleView, {
      breakpointInfo: this.breakpointInfo,
      expandedKeys: this.expandedKeys,
      handleDebugStep: (action: "step" | "continue" | "stop") => this.handleDebugStep(action),
      handleToggleExpand: (path: string)=> this.updateVariableExpandState(path),
      handleLoadMore: (path: string)=> this.loadMoreData(path),
      paginationState: this.paginationState,
      isDebugging: this.isDebugging
    });
  }

  dispose(): void {
    console.log("Disposing Debug Console Widget");
    super.dispose();
  }
}
