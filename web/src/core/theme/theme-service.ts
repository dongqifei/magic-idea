import { inject, injectable } from 'inversify';
import { getLogger } from "../logger/logger-service";
import { IEvent, Emitter } from '../common';
import { Theme, ThemeChangedEvent } from './theme-type';
import { ThemeManager } from './theme-manager';
import { ThemeContributionManager } from './theme-contribution';
import { ThemeApplication } from './theme-application';
import { QuickPickItem, QuickInputService } from '../quick-input';
import { CommandRegistry } from '@lumino/commands';
import { KeybindingRegistry } from '../keybinding/keybinding-registry';

@injectable()
export class ThemeService {
  private logger = getLogger("ThemeService");
  private currentTheme: Theme | undefined;
  private readonly themeApplication: ThemeApplication;

  protected readonly onDidChangeThemeEmitter = new Emitter<ThemeChangedEvent>();

  constructor(
    @inject(CommandRegistry) private readonly commandRegistry: CommandRegistry,
    @inject(KeybindingRegistry) private keybindingRegistry: KeybindingRegistry,
    @inject(QuickInputService) private quickInputService: QuickInputService,
    @inject(ThemeManager) private readonly themeManager: ThemeManager,
    @inject(ThemeContributionManager) private readonly contributionManager: ThemeContributionManager
  ) {
    const contributions = contributionManager.getContributions();
    this.logger.debug(`已加载的主题贡献者数量：${contributions.length}`);
    contributions.forEach((c, i) => {
      this.logger.debug(`贡献者 ${i + 1}：${c.constructor.name}`);
    });
    this.themeApplication = new ThemeApplication();
    this.init();
  }

  private async init(): Promise<void> {
    const storedThemeId = await this.themeManager.getStoredThemeId();
    const initialTheme = this.themeManager.getTheme(storedThemeId);
    if (initialTheme) {
      await this.setTheme(initialTheme.id);
    }
    this.registerCommands();
  }

  get onDidChangeTheme(): IEvent<ThemeChangedEvent> {
    return this.onDidChangeThemeEmitter.event;
  }

  /**
   * 发送主题变化事件
   */
  protected fireOnDidChangeTheme(event: ThemeChangedEvent): void {
    this.onDidChangeThemeEmitter.fire(event);
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
    const themeItems: QuickPickItem[] = this.themeManager.getThemes().map(theme => ({
      label: theme.label,
      description: theme.description,
      picked: async () => theme.id === await this.themeManager.getStoredThemeId(),
      execute: () => this.setTheme(theme.id)
    }));

    this.commandRegistry.addCommand("editor.theme.setting", {
      label: '颜色主题',
      iconClass: 'codicon-color-mode',
      execute: () => this.quickInputService.showQuickPick({
        placeholder: '选择颜色主题',
        items: themeItems
      })
    });

    this.keybindingRegistry.registerKeybinding({
      command: "editor.theme.setting",
      keybinding: 'ctrl+alt+t',
    });
  }

  // 切换主题
  async setTheme(themeId: string): Promise<void> {
    const newTheme = this.themeManager.getTheme(themeId);
    if (!newTheme || newTheme === this.currentTheme) return;

    const oldTheme = this.currentTheme;
    this.currentTheme = newTheme;

    // 1. 应用主题到DOM（注入CSS变量）
    this.themeApplication.applyTheme(newTheme);

    // 2. 保存主题偏好
    this.themeManager.storeThemeId(themeId);

    // 3. 通知所有贡献者主题变化
    this.contributionManager.fireThemeChange({ oldTheme, newTheme });

    // 4. 首次激活时通知贡献者
    if (!oldTheme) {
      this.contributionManager.activate(newTheme);
    }
    
    // 触发事件时指定事件名 + 传事件对象
    this.fireOnDidChangeTheme({ oldTheme, newTheme });
  }

  // 获取当前主题
  getCurrentTheme(): Theme | undefined {
    return this.currentTheme;
  }
}