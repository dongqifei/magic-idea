import { QuickAccessProvider } from "../quick-access-registry";
import { QuickPickItem } from "../quick-input-types";
import { injectable, inject } from "inversify";
import { CommandRegistry } from '@lumino/commands';
import {
  createItem
} from "../../commands/command-palette-service";

@injectable()
export class HelpQuickAccessProvider implements QuickAccessProvider {
  prefix = 'view';
  placeholder = '打开视图';

  constructor(@inject(CommandRegistry) private commands: CommandRegistry,) {
  }

  async provide(): Promise<QuickPickItem[]> {
    // 1. 获取所有视图命令（以view:开头）
    const items = this.commands.listCommands().filter(c => c.startsWith("view:")).map(command => createItem(this.commands, {
      command,
      category: '视图',
      args: {}
    }));
    // 2. 将命令转换为QuickPickItem[]
    const quickPickItems: QuickPickItem[] = items.filter(c=> c.isVisible).map(item => {
      const quickPickitem: QuickPickItem = {
        label: item.label,
        description: item.caption,
        insertPrefix: item.insertPrefix,
        category: item.category,
      }
      if (item.command && !item.insertPrefix) {
        quickPickitem.execute = () => {
          item.command && this.commands.execute(item.command);
        }
      }
      return quickPickitem;
    })
    return quickPickItems;
  }
}