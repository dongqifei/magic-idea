import { QuickAccessProvider } from "../quick-access-registry";
import { QuickPickItem } from "../quick-input-types";

export class HelpQuickAccessProvider implements QuickAccessProvider {
  prefix = '?';
  placeholder = '可用的快速访问前缀列表';

  private providers: QuickAccessProvider[];

  constructor(providers: QuickAccessProvider[]) {
    this.providers = providers;
  }

  async provide(input: string): Promise<QuickPickItem[]> {
    const query = input.slice(this.prefix.length).trim();
    return this.providers
      .filter(provider => provider.prefix !== '?' && provider.prefix !== '' && provider.prefix.includes(query))
      .map(provider => ({
        label: provider.prefix,
        description: provider.placeholder || '',
        detail: '',
        insertPrefix: provider.prefix,
      }));
  }
}