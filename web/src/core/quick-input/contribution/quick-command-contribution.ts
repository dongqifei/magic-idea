import { injectable, inject, postConstruct } from "inversify";
import { QuickInputService } from "../quick-input-types";
import { CommandRegistry } from '@lumino/commands';
import { KeybindingRegistry } from '../../keybinding/keybinding-registry';
import {
  CommandPaletteService,
} from "../../commands/command-palette-type";
import * as monaco from 'monaco-editor';

export namespace QuickInputCommands {
  // 打开命令面板（前缀 ">"）
  export const OPEN_COMMAND_PALETTE = 'editor.action.quickCommand';
  // 打开视图面板（前缀 "view"）
  export const OPEN_VIEW_QUICK_ACCESS = 'view.open-view';
  // 打开命令中心（前缀 ""）
  export const OPEN_COMMAND_CENTER = 'command.open-command-center';
}

@injectable()
export class QuickCommandContribution {
  constructor(
    @inject(QuickInputService) protected readonly quickInput: QuickInputService,
    @inject(CommandRegistry) private readonly commands: CommandRegistry,
    @inject(KeybindingRegistry) private keybindingRegistry: KeybindingRegistry,
    @inject(CommandPaletteService) private commandPalette: CommandPaletteService
  ) {}

  @postConstruct()
  protected init() {
    this.registerCommands();
    this.registerKeybindings();
    this.registerCommandPalette();
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
      // 打开命令面板（前缀 ">"）
      this.commands.addCommand(QuickInputCommands.OPEN_COMMAND_PALETTE, {
        label: '命令面板',
        execute: () => this.quickInput.showQuickAccess('>')
      });

      this.commands.addCommand(QuickInputCommands.OPEN_VIEW_QUICK_ACCESS, {
        label: '打开视图',
        execute: () => {
          this.quickInput.showQuickAccess('view')
        },
      });

      this.commands.addCommand(QuickInputCommands.OPEN_COMMAND_CENTER, {
        label: '命令中心',
        execute: () => {
          this.quickInput.showQuickAccess('')
        },
      });

      // 重写Monaco命令面板指令，以便在编辑器中使用快捷键打开系统自定义的命令面板
      monaco.editor.addCommand({
        id: 'editor.action.quickCommand',
        run: () => {
          this.commands.execute(QuickInputCommands.OPEN_COMMAND_PALETTE);
        }
      });
      monaco.editor.addCommand({
        id: 'editor.action.gotoLine',
        run: () => {
          this.commands.execute('editor.action.gotoLine');
        }
      });
    }
  
    /**
     * 注册快捷键
     */
    private registerKeybindings(): void {
      this.keybindingRegistry.registerKeybinding({
        command: QuickInputCommands.OPEN_COMMAND_PALETTE,
        keybinding: 'ctrl+shift+p',
      });
    }
  
    /**
     * 注册菜单
     */
    private registerMenu(): void {
      // 添加到 "查看" 菜单
      // this.menuRegistry.addMenuAction('view', {
      //   command: QuickInputCommands.OPEN_COMMAND_PALETTE,
      //   label: '命令面板',
      //   order: 100
      // });
    }
  
    /**
     * 注册命令面板
     */
    private registerCommandPalette(): void {
      this.commandPalette.addItem({
        command: QuickInputCommands.OPEN_VIEW_QUICK_ACCESS,
        category: '查看',
        insertPrefix: 'view'
      });
      this.commandPalette.addItem({
        command: 'editor.theme.setting',
        category: '设置',
      });
    }
}
