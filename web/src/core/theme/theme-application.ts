import { Theme } from './theme-type';

export class ThemeApplication {
  private readonly rootElement: HTMLElement = document.documentElement;

  // 应用主题：注入CSS变量并添加主题类名
  applyTheme(theme: Theme): void {
    // 1. 清除旧主题类名
    this.rootElement.className = this.rootElement.className
      .split(' ')
      .filter(cls => !cls.endsWith('-theme'))
      .join(' ');

    // 2. 添加新主题类名（用于CSS选择器）
    this.rootElement.classList.add(`${theme.id}-theme`);

    // 3. 注入CSS变量
    Object.entries(theme.variables).forEach(([key, value]) => {
      this.rootElement.style.setProperty(key, value);
    });
  }
}