import { injectable, inject, named } from "inversify";
import { CommandRegistry } from "@lumino/commands";
import { ContributionProvider } from "../common/contribution-provider";
import { CommandContribution } from "./command-types";

@injectable()
export class CommandRegistryImpl {

  constructor(
    @inject(CommandRegistry) protected readonly commands: CommandRegistry,
    @inject(ContributionProvider)
    @named(CommandContribution)
    protected readonly contributionProvider: ContributionProvider<CommandContribution>
  ) {
  }

  onStart(): void {
    const contributions = this.contributionProvider.getContributions();
    for (const contrib of contributions) {
      contrib.registerCommands(this.commands);
    }
  }
}
