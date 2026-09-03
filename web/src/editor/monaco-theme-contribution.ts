import { injectable } from 'inversify';
import * as monaco from 'monaco-editor';
import { Theme, ThemeChangedEvent, ThemeContribution } from '../core/theme/theme-type';

@injectable()
export class MonacoThemeContribution implements ThemeContribution {
  private currentMonacoTheme: string | undefined;
  // 缓存已定义的主题名
  private definedThemes = new Set<string>();

  // 激活主题时初始化Monaco
  activate(theme: Theme): void {
    this.applyMonacoTheme(theme);
  }

  // 主题变化时更新Monaco
  onDidChangeTheme(event: ThemeChangedEvent): void {
    this.applyMonacoTheme(event.newTheme);
  }

  private applyMonacoTheme(theme: Theme): void {
    const monacoThemeName = theme.id;
    if (this.currentMonacoTheme === monacoThemeName) return;

    // 1. 自定义Monaco样式（与CSS变量对齐）
    this.customizeMonacoTheme(theme);

    // 2. 切换Monaco基础主题
    monaco.editor.setTheme(monacoThemeName);

    this.currentMonacoTheme = monacoThemeName;
  }

  // 精细化定制Monaco主题（覆盖默认样式）
  private customizeMonacoTheme(theme: Theme): void {
    if(this.definedThemes.has(theme.id)){
      return;
    }
    // 确保主题被定义，否则会抛出错误
    this.definedThemes.add(theme.id);
    monaco.editor.defineTheme(theme.id, {
      base: theme.type === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: theme.rules || [],
      colors: {
        "editorCursor.foreground": theme.variables['--magic-idea-editorCursor-foreground'], // 光标颜色
        'editor.background':  theme.variables['--magic-idea-editor-background'], //编辑器背景色
        "editor.foreground": theme.variables['--magic-idea-foreground'], // 编辑器前景色
        "peekViewEditor.background": theme.variables['--magic-idea-editor-background'],//预览窗口编辑器背景色
        "peekViewResult.background": theme.variables['--magic-idea-editor-background'],//预览窗口结果区背景色
        'dropdown.background': theme.variables['--magic-idea-menu-background'], //右键菜单
        'dropdown.foreground': theme.variables['--magic-idea-menu-foreground'], //右键菜单文字颜色
        'menu.border': theme.variables['--magic-idea-input-border'], //右键菜单边框颜色
        'list.activeSelectionBackground': theme.variables['--magic-idea-list-activeSelectionBackground'],
        'list.activeSelectionForeground': theme.variables['--magic-idea-list-activeSelectionForeground'],
        'list.inactiveSelectionBackground': theme.variables['--magic-idea-list-hoverBackground'],
        // 'list.highlightForeground': theme.variables['--magic-idea-quickinput-hlightForeground'],
        // 'widget.shadow': theme.variables['--magic-idea-widget-shadow'],
        // 覆盖自定义colors属性（如果有）
        ...(theme.colors || {})
      }
    });
  }
}