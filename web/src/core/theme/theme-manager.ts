import { inject, injectable } from 'inversify';
import { Theme } from './theme-type';
import { lightTheme } from './default/light-theme';
import { darkTheme } from './default/dark-theme';
import { solarizedDarkTheme } from './default/solarized-dark-theme';
import { solarizedLightTheme } from './default/solarized-light-theme';
import { nationalDayTheme } from './default/national-day-theme';
import { monokaiTheme } from './default/monokai-theme';
import { StorageService } from '../storage';

@injectable()
export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private defaultThemeId: string = 'light';

  constructor(
    @inject(StorageService) private storageService: StorageService,
  ) {
    // 注册默认主题
    this.registerTheme(lightTheme);
    this.registerTheme(solarizedLightTheme);
    this.registerTheme(darkTheme);
    this.registerTheme(solarizedDarkTheme);
    this.registerTheme(monokaiTheme);
    this.registerTheme(nationalDayTheme);
  }

  // 注册主题（支持扩展自定义主题）
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  // 获取所有主题
  getThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  // 根据ID获取主题
  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  // 获取当前保存的主题
  async getStoredThemeId(): Promise<string> {
    return await this.storageService.getData('editor-theme', this.defaultThemeId);
  }

  // 保存主题偏好
  storeThemeId(themeId: string): void {
    this.storageService.setData('editor-theme', themeId);
  }
}