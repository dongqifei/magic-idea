import { CommandRegistry } from "@lumino/commands";
import { ContributionProvider } from "../common/contribution-provider";
import { CommandContribution } from "./command-types";
export declare class CommandRegistryImpl {
    protected readonly commands: CommandRegistry;
    protected readonly contributionProvider: ContributionProvider<CommandContribution>;
    constructor(commands: CommandRegistry, contributionProvider: ContributionProvider<CommandContribution>);
    onStart(): void;
}
