import { QuickInputService } from "../quick-input-types";
import { CommandRegistry } from '@lumino/commands';
import { KeybindingRegistry } from '../../keybinding/keybinding-registry';
import { CommandPaletteService } from "../../commands/command-palette-type";
export declare namespace QuickInputCommands {
    const OPEN_COMMAND_PALETTE = "editor.action.quickCommand";
    const OPEN_VIEW_QUICK_ACCESS = "view.open-view";
    const OPEN_COMMAND_CENTER = "command.open-command-center";
}
export declare class QuickCommandContribution {
    protected readonly quickInput: QuickInputService;
    private readonly commands;
    private keybindingRegistry;
    private commandPalette;
    constructor(quickInput: QuickInputService, commands: CommandRegistry, keybindingRegistry: KeybindingRegistry, commandPalette: CommandPaletteService);
    protected init(): void;
    /**
     * 注册命令
     */
    private registerCommands;
    /**
     * 注册快捷键
     */
    private registerKeybindings;
    /**
     * 注册菜单
     */
    private registerMenu;
    /**
     * 注册命令面板
     */
    private registerCommandPalette;
}
