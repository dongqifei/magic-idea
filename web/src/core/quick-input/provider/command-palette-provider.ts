import {  QuickAccessProvider, QuickPickItem } from '..';
import { CommandPaletteService } from '../../commands/command-palette-type';
import { CommandRegistry } from '@lumino/commands';

/**
 * 命令 palette 快速访问服务
 */
export class CommandPaletteQuickAccessProvider implements QuickAccessProvider {
  prefix = '>';
  placeholder = '显示并运行命令';
  constructor(
    private commandPalette: CommandPaletteService,
    private commands: CommandRegistry,
) {}

  async provide(): Promise<QuickPickItem[]> {
    // 所有运行命令项
    const items: QuickPickItem[] = [];

    // 将命令转换为QuickPickItem[]
    this.commandPalette.items.forEach(item => {
      const quickPickitem: QuickPickItem = {
        label: item.category && item.category.length > 0 ? item.category + ":" + item.label : item.label,
        description: item.caption,
        insertPrefix: item.insertPrefix,
        category: item.category,
      }
      if(item.command && !item.insertPrefix){
        quickPickitem.execute = async() => {
          item.command && await this.commands.execute(item.command);
        }
      }
      items.push(quickPickitem);
    });
    return items;
  }
}
