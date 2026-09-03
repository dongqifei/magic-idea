import { injectable, inject } from "inversify";
import { IEvent, Emitter } from '../common';
import {
  QuickPickOptions,
  InputBoxOptions,
  QuickPickItem,
  QuickInputUI,
  QuickInputService
} from "./quick-input-types";
import { QuickAccessRegistry } from "./quick-access-registry";

@injectable()
export class QuickInputServiceImpl implements QuickInputService {
  
  protected readonly onDidHideQuickInputEmitter = new Emitter();

  constructor(
    @inject(QuickAccessRegistry)
    protected readonly registry: QuickAccessRegistry,
    @inject(QuickInputUI) protected readonly ui: QuickInputUI
  ) {
  }

  async showQuickPick(
    options: QuickPickOptions
  ): Promise<QuickPickItem | QuickPickItem[] | undefined> {
    return this.ui.showQuickPick(options);
  }

  async showInputBox(options: InputBoxOptions): Promise<string | undefined> {
    return this.ui.showInputBox(options);
  }

  hide(): void {
    this.ui.hide();
    this.onDidHideQuickInputEmitter.fire('hide');
  }

  private getQueryVaule(input: string, prefix?: string) {
    if (!prefix) return input;
    return input.slice(prefix.length).trim();
  }

  async showQuickAccess(input?: string): Promise<any> {
    let currentInput = input || '';
    currentInput = currentInput.length > 1 ? currentInput + " " : currentInput;
    let currentProvider = this.registry.getProvider(currentInput);

    const showPanel = async (panelInput: string) => {
      currentProvider =
        this.registry.getProvider(panelInput) || this.registry.getProvider("");
      const query = this.getQueryVaule(panelInput, currentProvider.prefix);
      const items = await currentProvider.provide(query);
      return await this.ui.showQuickPick({
        prefix: currentProvider.prefix,
        inputValue: panelInput,
        items,
        placeholder: currentProvider.placeholder,
        matchOnDescription: true,
        matchOnDetail: true,
        onInputChange: async (_: any) => {
          const changedInput = _.filterText;
          currentProvider =
            this.registry.getProvider(changedInput) ||
            this.registry.getProvider("");
          const query = this.getQueryVaule(changedInput, currentProvider.prefix);
          const newItems = await currentProvider.provide(query);
          _.options.placeholder = currentProvider.placeholder;
          _.options.items = newItems;
          _.options.prefix = currentProvider.prefix;
          return newItems;
        },
        onDidChangeSelection: async (items) => {
          // 如果 item 有前缀（如 label = "view"），点选后自动更新输入框
          if (!items) return;
          const item = items as QuickPickItem;
          if (item.insertPrefix) {
            // 重新显示面板，input更新
            const updatedInput = item.insertPrefix && item.insertPrefix.length > 1 ? item.insertPrefix + ' ' : item.insertPrefix;
            await showPanel(updatedInput);
          }
        },
      });
    };

    return await showPanel(currentInput);
  }
}
