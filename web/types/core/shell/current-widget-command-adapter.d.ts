import { CommandRegistry } from "@lumino/commands";
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { Title, Widget, TabBar } from "@lumino/widgets";
import { ApplicationShellLayout } from ".";
export interface TabBarContextMenuCommandHandler extends CommandRegistry.ICommandOptions {
    execute: (args: ReadonlyPartialJSONObject) => void;
    isEnabled?: (args: ReadonlyPartialJSONObject) => boolean;
    isVisible?: (args: ReadonlyPartialJSONObject) => boolean;
    isToggled?: (args: ReadonlyPartialJSONObject) => boolean;
}
export declare class CurrentWidgetCommandAdapter implements CommandRegistry.ICommandOptions {
    private shell;
    execute: CommandRegistry.CommandFunc<any>;
    isEnabled?: CommandRegistry.CommandFunc<boolean>;
    isVisible?: CommandRegistry.CommandFunc<boolean>;
    isToggled?: CommandRegistry.CommandFunc<boolean>;
    label?: string | CommandRegistry.CommandFunc<string>;
    iconClass?: string | CommandRegistry.CommandFunc<string>;
    iconLabel?: string | CommandRegistry.CommandFunc<string>;
    constructor(shell: ApplicationShellLayout, handler: TabBarContextMenuCommandHandler);
    private createTransformedArgs;
    protected transformArguments(shell: ApplicationShellLayout, event: ReadonlyPartialJSONObject): [Title<Widget> | undefined, TabBar<Widget> | undefined, ReadonlyPartialJSONObject];
}
