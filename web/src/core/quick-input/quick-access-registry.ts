import { injectable, inject, multiInject } from "inversify";
import { QuickPickItem } from "./quick-input-types";
import { HelpQuickAccessProvider } from "./provider/command-help-provider";
import { CommandRegistry } from '@lumino/commands';
import { CommandPaletteService } from '../commands/command-palette-type';
import { CommandPaletteQuickAccessProvider } from './provider/command-palette-provider';

export interface QuickAccessProvider {
  prefix: string;
  placeholder?: string;
  /**
   * 请求展示的内容（输入变化时自动刷新）
   * @param input 当前输入字符串（含前缀）
   * @param stepData 上一步的结果数据（用于多步流程）
   */
  provide(input: string, stepData?: any): Promise<QuickPickItem[]>;
  // 如果 provider 分多步，多步输入闭环处理
  nextStep?(selected: QuickPickItem, input: string): Promise<{ nextInput: string, provider?: QuickAccessProvider, stepData?: any } | undefined>;
}

export const QuickAccessProvider = Symbol('QuickAccessProvider');

@injectable()
export class QuickAccessRegistry {
  private providers = new Map<string, QuickAccessProvider>();

  constructor(
    @inject(CommandRegistry) private readonly commands: CommandRegistry,
    @inject(CommandPaletteService) private readonly commandPalette: CommandPaletteService,
    @multiInject(QuickAccessProvider) quickAccessProviders: QuickAccessProvider[]
  ) {
    // 注册命令面板提供者
    this.registerProvider(new CommandPaletteQuickAccessProvider(this.commandPalette, this.commands));

    // 注册其它快速访问提供者
    quickAccessProviders.forEach(element => {
      this.registerProvider(element);
    });

     // 注册快速访问
    this.registerProvider(new HelpQuickAccessProvider(this.getAllProviders()));
  }

  registerProvider(provider: QuickAccessProvider): void {
    let prefix = provider.prefix; 
    if (prefix && prefix.length > 1){
      prefix += " ";
    }
    this.providers.set(prefix, provider);
  }

  getProvider(input: string): QuickAccessProvider {
    const prefixes = Array.from(this.providers.keys()).sort((a, b) => b.length - a.length);
    for (const prefix of prefixes) {
      if (input.startsWith(prefix)) {
        return this.providers.get(prefix)!;
      }
    }
    return this.providers.get('')!;
  }

  getAllProviders(): QuickAccessProvider[] {
    return [...this.providers.values()];
  }
}