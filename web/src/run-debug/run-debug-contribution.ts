import { injectable, inject } from "inversify";
import {
  ContextKeyService,
} from "@MagicIdea/core";
import { MAIN_MENU_BAR } from "@MagicIdea/core/common/menu";
import { MenuContribution, MenuModelRegistry } from "@MagicIdea/core/common";
import { CommandContribution, CommandRegistry } from "@MagicIdea/core/commands";
import {
  KeybindingContribution,
  KeybindingRegistry,
} from "@MagicIdea/core/keybinding";
import { FileSystemService } from "@MagicIdea/core/filesystem";
import { EditorManager } from "@MagicIdea/editor/editor-manager";
import { ToolbarService } from "@MagicIdea/core/shell/toolbar/toolbar-types";

export const RUNDEBUG = [...MAIN_MENU_BAR, "6_rundebug"];
export const RUNDEBUG_PRIMARY = [...RUNDEBUG, "0_primary"]
export const RUNDEBUG_EXECUTE = [...RUNDEBUG, "1_execute"]
export const RUNDEBUG_BREAKPOINTS = [...RUNDEBUG, "2_breakpoint"]
export const RUNDEBUG_BREAKPOINTS_SUBMENU = [...RUNDEBUG_BREAKPOINTS, "0_breakpoint_submenu"];

export namespace RunDebugCommands {
  export const RUN = "rundebug:run";
  export const START = "rundebug:start";
}

@injectable()
export class RunDebugContribution
  implements MenuContribution, CommandContribution, KeybindingContribution
{
  @inject(EditorManager)
  protected readonly editorManager: EditorManager;
  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;
  @inject(FileSystemService)
  protected readonly fileSystemService: FileSystemService;
  @inject(ToolbarService)
  private toolbarService: ToolbarService;

  private isRunLoading = false;    // 运行按钮加载
  private isDebugLoading = false;  // 调试按钮加载

  registerCommands(commands: CommandRegistry): void {
    // 运行
    commands.addCommand(RunDebugCommands.RUN, {
      label: "以非调试模式运行",
      iconClass: () => {
        if (this.isRunLoading) {
          return "codicon-loading spinning";
        }
        return this.editorManager.currentEditor
          ? "codicon-debug-start success"
          : "codicon-debug-start";
      },
      isEnabled: () => {
        // 互斥：任意一个在加载，都禁用
        return !!this.editorManager.currentEditor && !this.isRunLoading && !this.isDebugLoading;
      },
      execute: async () => {
        this.setRunLoading(true);
        try {
          await this._doTest(false);
        } finally {
          this.setRunLoading(false);
        }
      },
    });

    // 启动调试
    commands.addCommand(RunDebugCommands.START, {
      label: "以调试模式运行",
      iconClass: () => {
        if (this.isDebugLoading) {
          return "codicon-loading spinning";
        }
        return this.editorManager.currentEditor
          ? "codicon-debug success"
          : "codicon-debug";
      },
      isEnabled: () => {
        // 互斥
        return !!this.editorManager.currentEditor && !this.isRunLoading && !this.isDebugLoading;
      },
      execute: async () => {
        this.setDebugLoading(true);
        try {
          await this._doTest(true);
        } finally {
          this.setDebugLoading(false);
        }
      },
    });

    this.toolbarService.registerItem({
      id: "sample:editor-run-item",
      commandId: RunDebugCommands.RUN,
      alignment: "left",
      rank: 10,
    });
    this.toolbarService.registerItem({
      id: "sample:editor-debug-item",
      commandId: RunDebugCommands.START,
      alignment: "left",
      rank: 10,
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: RunDebugCommands.RUN,
      keybinding: "ctrl+q",
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(RUNDEBUG, "运行");
    registry.registerSubmenu(RUNDEBUG_BREAKPOINTS, "断点管理");

    registry.registerMenuAction(RUNDEBUG_PRIMARY, {
      commandId: RunDebugCommands.RUN,
      order: "1",
    });
    registry.registerMenuAction(RUNDEBUG_PRIMARY, {
      commandId: RunDebugCommands.START,
      order: "2",
    });

    registry.registerMenuAction(RUNDEBUG_EXECUTE, {
      commandId: "debug.action.step",
      order: "0",
    });
    registry.registerMenuAction(RUNDEBUG_EXECUTE, {
      commandId: "debug.action.continue",
      order: "1",
    });

    registry.registerMenuAction(RUNDEBUG_BREAKPOINTS_SUBMENU, {
      commandId: "editor:breakpoint-enable-all",
      order: "0",
    });
    registry.registerMenuAction(RUNDEBUG_BREAKPOINTS_SUBMENU, {
      commandId: "editor:breakpoint-disable-all",
      order: "1",
    });
    registry.registerMenuAction(RUNDEBUG_BREAKPOINTS_SUBMENU, {
      commandId: "editor:breakpoint-remove-all",
      order: "2",
    });
  }

  private setRunLoading(loading: boolean): void {
    this.isRunLoading = loading;
    this.toolbarService.update();
  }

  private setDebugLoading(loading: boolean): void {
    this.isDebugLoading = loading;
    this.toolbarService.update();
  }

  private async _doTest(debug: boolean): Promise<void> {
    const editor = this.editorManager.currentEditor;
    const resourceUri = editor?.getResourceUri();
    if (editor && resourceUri) {
      await this.fileSystemService.doTest(resourceUri, debug);
    }
  }
}