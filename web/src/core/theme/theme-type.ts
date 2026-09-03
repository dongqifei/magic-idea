// 主题类型（明/暗/自定义）
export type ThemeType = 'light' | 'dark' | string;

// CSS变量键值对（主题的核心数据）
export interface CssVariables {
  [key: string]: string;
}

// 主题定义接口（描述一个完整主题）
export interface Theme {
  id: string; // 唯一标识（如"light"、"dark"）
  type: ThemeType; // 主题类型
  label: string; // 显示名称（如"Light Theme"）
  description?: string; // 描述信息（可选）
  variables: CssVariables; // 主题变量
  // 可选：关联的Monaco主题名（如"vs"、"vs-dark"）
  monacoTheme?: string;
  rules?: any[];
  colors?: any; // 更多颜色定义（可选）
  spacing?: number; // 全局间距（可选）
}

// 主题变更事件
export interface ThemeChangedEvent {
  oldTheme: Theme | undefined;
  newTheme: Theme;
}

// 主题贡献者接口（任何需要响应主题变化的模块都需实现）
export interface ThemeContribution {
  // 主题激活时调用（初始化）
  activate?(theme: Theme): void;
  // 主题变化时调用
  onDidChangeTheme?(event: ThemeChangedEvent): void;
}

// 定义贡献者的注入标识（用于DI容器识别）
export const ThemeContribution = Symbol('ThemeContribution');