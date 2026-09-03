import { inject, injectable, named } from "inversify";
import { ContributionProvider } from "../common/contribution-provider";
import { ContextKeyService } from '../context-key-service';
import { CommandRegistry } from "@lumino/commands";
import { Keybinding } from "./keybinding-type";

export const KeybindingContribution = Symbol('KeybindingContribution');

/**
 * Allows extensions to contribute {@link common.Keybinding}s
 */
export interface KeybindingContribution {
  /**
   * Registers keybindings.
   * @param keybindings the keybinding registry.
   */
  registerKeybindings(keybindings: KeybindingRegistry): void;
}

@injectable()
export class KeybindingRegistry {
  private keybindings: Keybinding[] = [];

  constructor(
    @inject(ContextKeyService) private contextKeyService: ContextKeyService,
    @inject(CommandRegistry) private commandRegistry: CommandRegistry,
    @inject(ContributionProvider)
    @named(KeybindingContribution)
    protected readonly contributionProvider: ContributionProvider<KeybindingContribution>
  ) {
    // 监听键盘事件（全局拦截，脱离DOM选择器）
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  onStart(): void {
    const contributions = this.contributionProvider.getContributions();
    for (const contrib of contributions) {
      contrib.registerKeybindings(this);
    }
  }

  // 注册快捷键
  registerKeybinding(keybinding: Keybinding): void {
    this.keybindings.push(keybinding);
    // 注册命令（此处通过 CommandRegistry 注册仅是为了在菜单中显示）
    this.commandRegistry.addKeyBinding({
      keys: [this.formatKeybinding(keybinding.keybinding)], // 示例：'Ctrl+Delete'
      selector: '.body',
      command: keybinding.command,
    });
  }

  private formatKeybinding(keybinding: string) {
    const parts = keybinding.toLowerCase().split('+');
    const formattedParts = parts.map(part => {
      // 如果是特殊键，使用映射
      // 普通字母保持大写
      return part.charAt(0).toUpperCase() + part.slice(1);
    });
    
    return formattedParts.join('+');
  }

  // 处理键盘事件
  private handleKeydown(event: KeyboardEvent): void {
    // 1. 将事件解析为按键组合字符串（如 'ctrl+delete'）
    const keyCombo = this.parseKeyEvent(event);
    if (!keyCombo) return;

    // 2. 查找匹配的快捷键
    const matched = this.keybindings.find(kb => {
      // 匹配按键组合（处理平台差异）
      const targetKey = this.getPlatformKey(kb.keybinding);
      if (targetKey !== keyCombo) return false;

      // 3. 检查 when 条件是否满足
      return this.evaluateWhenCondition(kb.when);
    });

    // 4. 执行匹配的命令
    if (matched) {
      event.preventDefault(); // 阻止默认行为
      this.commandRegistry.execute(matched.command);
    }
  }

  // 解析键盘事件为按键组合（如 Ctrl+Delete → 'ctrl+delete'）
  private parseKeyEvent(event: KeyboardEvent): string | undefined {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('cmd'); // Mac 的 Command 键

    const key = event.key?.toLowerCase();
    if (!key) return undefined;

    return [...modifiers, key].join('+');
  }

  // 处理平台差异（如 'mac:cmd+delete' 在Windows上取后半部分）
  private getPlatformKey(key: string): string {
    const isMac = navigator.platform.includes('Mac');
    const parts = key.split(':');
    if (parts.length === 2) {
      return isMac && parts[0] === 'mac' ? parts[1] : parts[0];
    }
    return key;
  }

  // 解析并评估 when 条件（简化版：支持 &&、||、! 和上下文键）
  private evaluateWhenCondition(when?: string): boolean {
    if (!when) return true; // 无条件时默认生效

    // 简化实现：仅支持基本逻辑（实际可使用表达式解析库如 jsep）
    const expr = when.replace(/\s+/g, ''); // 移除空格
    // 示例：解析 'isGroupNodeSelected&&!isLoading'
    const terms = expr.split('&&');
    return terms.every(term => {
      if (term.startsWith('!')) {
        const key = term.slice(1);
        return !this.contextKeyService.match(key);
      }
      return this.contextKeyService.match(term) === true;
    });
  }
}