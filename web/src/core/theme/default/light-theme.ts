// light-theme.ts
import { Theme } from '../theme-type';

export const lightTheme: Theme = {
  id: 'light',
  type: 'light',
  label: '现代浅色',
  description: '清新明亮的浅色主题，适用于白天或明亮环境。',
  monacoTheme: 'vs',
  spacing: 4,
  rules: [
    { token: "sys.keyword", foreground: "c000da", fontStyle: "" },
    { token: "sys.function", foreground: "c000da", fontStyle: "italic" },
    { token: "function", foreground: "953800", fontStyle: "" }
  ],
  colors:{
     'list.highlightForeground': '#0052a3',
  },
  variables: {
    // 主题字体
    '--magic-idea-ui-font-size': '14px',
    '--magic-idea-ui-font-family': 'Segoe WPC,Segoe UI,sans-serif',
    
    // 文本颜色
    '--magic-idea-foreground': '#1a1a1a',
    '--magic-idea-secondary-foreground': '#5f5f5f',
    '--magic-idea-description-foreground': '#a1a1a1',
    
    // 功能色
    '--magic-idea-primary-color': '#0078d4',
    '--magic-idea-info-color': '#0078d4',
    '--magic-idea-success-color': '#009933',
    '--magic-idea-warning-color': '#ff9900',
    '--magic-idea-error-color': '#cc0000',
    
    // 背景色
    '--magic-idea-background': '#ebecf0',
    '--magic-idea-background-overlay': 'rgba(212, 226, 255, 0.3)',

    // 浮层阴影
    '--magic-idea-shadow': 'rgba(0, 0, 0, 0.16)',
    
    // 链接与按钮颜色
    '--magic-idea-link-color': '#4e94ce',
    '--magic-idea-button-foreground': '#ffffff',
    '--magic-idea-button-background': '#0078d4',
    '--magic-idea-button-hover-background': '#0062a3',
    '--magic-idea-button-primary-background': '#0066cc',
    '--magic-idea-button-primary-hover-background': '#0052a3',
    '--magic-idea-button-primary-foreground': '#ffffff',
    '--magic-idea-button-secondary-background': '#f3f4f6', // 次按钮背景浅灰
    '--magic-idea-button-secondary-hoverBackground': '#e5e7eb', // 次按钮hover背景稍深灰
    '--magic-idea-button-secondary-foreground': '#4b5563', // 次按钮文本深灰
    
    // 边框与分隔线
    '--magic-idea-border-color': '#ebecf0',
    '--magic-idea-border-radius': '8px', // 边框圆角
    '--magic-idea-focus-border': '#0078d4',
    
    // 图标颜色
    '--magic-idea-icon-foreground': '#333333',
    
    // 菜单背景颜色
    '--magic-idea-menu-background': '#ffffff',
    '--magic-idea-menu-foreground': '#1a1a1a',
    '--magic-idea-menu-hoverForeground': '#ffffff', // 菜单hover文字颜色
    '--magic-idea-menu-hoverBackground': '#0078d4', // 菜单hover背景颜色
    
    // 工具栏
    '--magic-idea-toolbar-hoverBackground': 'rgba(184, 184, 184, 0.3)',
    
    // Tab 栏
    '--magic-idea-tabbar-background': '#ffffff',
    '--magic-idea-tabbar-foreground': '#5f5f5f',
    '--magic-idea-tabbar-hoverBackground': '#fcfcfc',
    '--magic-idea-tabbar-hoverForeground': '#1a1a1a',
    '--magic-idea-tabbar-lastActiveBackground': 'rgba(212, 226, 255, 0.6)',
    '--magic-idea-tabbar-activeBackground': '#d4e2ff',
    '--magic-idea-tabbar-activeForeground': '#1a1a1a',
    
    // 编辑器背景色
    '--magic-idea-editor-background': '#ffffff',
    '--magic-idea-debugIcon-breakpointForeground': '#e51400',
    '--magic-idea-editorCursor-foreground': '#616161',
    '--magic-idea-debug-breakpointLineBackground': 'rgba(0, 120, 212, 0.14)',
    
    // 输入框
    '--magic-idea-input-background': '#ffffff',
    '--magic-idea-input-foreground': '#1a1a1a',
    '--magic-idea-input-placeholder': '#bfbfbf', // 输入框占位符颜色
    '--magic-idea-input-border': '#ebecf0', // 输入框边框颜色
    
    // 侧边栏
    '--magic-idea-sideTabbar-width': '48px',
    '--magic-idea-sideTabbar-background': '#ebecf0',
    '--magic-idea-activityBar-width': '48px',
    '--magic-idea-activityBar-background': '#ebecf0',
    '--magic-idea-activityBar-activeBorder': '#0078d4', // 引用主色调变量值
    '--magic-idea-sideBar-titleColor': '#1a1a1a', // 侧边栏标题颜色
    '--magic-idea-sideBar-bodyColor': '#252526',// 侧边栏内容颜色
    '--magic-idea-sidebar-background': '#ffffff',
    
    // 列表
    '--magic-idea-list-activeSelectionBackground': '#0078d4',
    '--magic-idea-list-activeSelectionForeground': '#ffffff',
    '--magic-idea-list-inactiveSelectionBackground': '#d4e2ff',
    '--magic-idea-list-hoverBackground': '#e8e8e8',
    '--magic-idea-list-hoverForeground': '#1a1a1a', // 引用前景色变量值
    '--magic-idea-descriptionForeground': '#717171',
    
    // 通知颜色
    '--magic-idea-notification-background': '#f3f3f3',
    '--magic-idea-notification-hoverBackground': '#fafafa',
    
    // 状态栏
    '--magic-idea-statusbar-background': '#ebecf0',
    '--magic-idea-statusbar-hoverBackground': 'rgba(184, 184, 184, 0.3)',
    '--magic-idea-statusbar-foreground': '#1a1a1a',

    // 快速输入颜色
    '--magic-idea-quickinput-selectionBackground': 'rgba(184, 184, 184, 0.3)',
    '--magic-idea-quickinput-selectionForeground': '#1a1a1a',
    '--magic-idea-quickinput-hoverBackground': 'rgba(184, 184, 184, 0.1)',
    '--magic-idea-quickinput-hoverForeground': '#1a1a1a',
    '--magic-idea-quickinput-hlightForeground': '#0078d4',

    // 滚动条颜色
    '--magic-idea-scrollbar-background' : '#c1c1c1',
  }
};