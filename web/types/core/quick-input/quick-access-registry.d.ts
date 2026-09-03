import { QuickPickItem } from "./quick-input-types";
import { CommandRegistry } from '@lumino/commands';
import { CommandPaletteService } from '../commands/command-palette-type';
export interface QuickAccessProvider {
    prefix: string;
    placeholder?: string;
    /**
     * 请求展示的内容（输入变化时自动刷新）
     * @param input 当前输入字符串（含前缀）
     * @param stepData 上一步的结果数据（用于多步流程）
     */
    provide(input: string, stepData?: any): Promise<QuickPickItem[]>;
    nextStep?(selected: QuickPickItem, input: string): Promise<{
        nextInput: string;
        provider?: QuickAccessProvider;
        stepData?: any;
    } | undefined>;
}
export declare const QuickAccessProvider: unique symbol;
export declare class QuickAccessRegistry {
    private readonly commands;
    private readonly commandPalette;
    private providers;
    constructor(commands: CommandRegistry, commandPalette: CommandPaletteService, quickAccessProviders: QuickAccessProvider[]);
    registerProvider(provider: QuickAccessProvider): void;
    getProvider(input: string): QuickAccessProvider;
    getAllProviders(): QuickAccessProvider[];
}
