import { QuickAccessProvider } from "../quick-access-registry";
import { QuickPickItem } from "../quick-input-types";
import { CommandRegistry } from '@lumino/commands';
export declare class HelpQuickAccessProvider implements QuickAccessProvider {
    private commands;
    prefix: string;
    placeholder: string;
    constructor(commands: CommandRegistry);
    provide(): Promise<QuickPickItem[]>;
}
