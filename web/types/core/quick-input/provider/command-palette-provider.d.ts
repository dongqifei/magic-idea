import { QuickAccessProvider, QuickPickItem } from '..';
import { CommandPaletteService } from '../../commands/command-palette-type';
import { CommandRegistry } from '@lumino/commands';
/**
 * 命令 palette 快速访问服务
 */
export declare class CommandPaletteQuickAccessProvider implements QuickAccessProvider {
    private commandPalette;
    private commands;
    prefix: string;
    placeholder: string;
    constructor(commandPalette: CommandPaletteService, commands: CommandRegistry);
    provide(): Promise<QuickPickItem[]>;
}
