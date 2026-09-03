import { injectable, multiInject  } from 'inversify';
import { Theme, ThemeChangedEvent, ThemeContribution } from './theme-type';

// 主题贡献者管理器（收集所有贡献者）
@injectable()
export class ThemeContributionManager {
  // 从DI容器注入所有实现了ThemeContribution接口的实例
  constructor(
    @multiInject(ThemeContribution) private contributions: ThemeContribution[] = []
  ) {}

  getContributions(): ThemeContribution[] {
    return this.contributions;
  }

  add(contribution: ThemeContribution): void {
    this.contributions.push(contribution);
  }

  activate(theme: Theme): void {
    this.contributions.forEach(c => c.activate?.(theme));
  }

  fireThemeChange(event: ThemeChangedEvent): void {
    this.contributions.forEach(c => c.onDidChangeTheme?.(event));
  }
}