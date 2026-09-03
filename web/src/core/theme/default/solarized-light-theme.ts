import { Theme } from '../theme-type';

export const solarizedLightTheme: Theme = {
  id: 'solarized-light',
  type: 'light',
  label: 'Solarized Light',
  description: '经典Solarized Light主题，低对比度暖黄基底，护眼且色彩体系统一。',
  monacoTheme: 'light', // 匹配monaco的Solarized Light基底
  spacing: 1,
  rules: [
    // Solarized Light 语法高亮规范（调整关键词为暖黄色系）
    { token: "sys.keyword", foreground: "b58900", fontStyle: "" },    // 暖黄色（Solarized Yellow）
    { token: "sys.function", foreground: "b58900", fontStyle: "italic" },
    { token: "function", foreground: "cb4b16", fontStyle: "" },        // 橙色（Solarized Orange）
    { token: "string", foreground: "859900" },                        // 绿色（Solarized Green）
    { token: "comment", foreground: "93a1a1", fontStyle: "italic" },   // 浅灰（Solarized Base2）
    { token: "number", foreground: "d33682" },                        // 洋红（Solarized Magenta）
    { token: "operator", foreground: "6c71c4" },                      // 紫蓝（Solarized Violet）
    { token: "type", foreground: "2aa198" }                           // 青蓝（Solarized Cyan）
  ],
  variables: {
    // === Solarized 核心色值定义（严格遵循官方规范）===
    // 基础色
    '--sol-base03': '#002b36', '--sol-base02': '#073642',
    '--sol-base01': '#586e75', '--sol-base00': '#657b83',
    '--sol-base0': '#839496', '--sol-base1': '#93a1a1',
    '--sol-base2': '#eee8d5', '--sol-base3': '#fdf6e3',
    // 强调色（主色改为暖黄）
    '--sol-yellow': '#b58900', '--sol-orange': '#cb4b16',
    '--sol-red': '#dc322f', '--sol-magenta': '#d33682',
    '--sol-violet': '#6c71c4', '--sol-blue': '#268bd2',
    '--sol-cyan': '#2aa198', '--sol-green': '#859900',

    // 主题字体（保持Solarized推荐的等宽/无衬线搭配）
    '--magic-idea-ui-font-size': '14px',
    '--magic-idea-ui-font-family': 'Consolas, Menlo, Monaco, "Segoe UI", sans-serif',
    
    // 文本颜色（严格匹配Solarized层级）
    '--magic-idea-foreground': '#657b83', // base00（主文本）
    '--magic-idea-secondary-foreground': '#586e75', // base01（次要文本）
    '--magic-idea-description-foreground': '#93a1a1', // base1（描述文本）
    
    // 功能色（主色调改为Solarized暖黄色）
    '--magic-idea-primary-color': '#b58900', // 主色调（Solarized Yellow）
    '--magic-idea-info-color': '#2aa198', // 信息色（Cyan）
    '--magic-idea-success-color': '#859900', // 成功色（Green）
    '--magic-idea-warning-color': '#cb4b16', // 警告色（Orange）
    '--magic-idea-error-color': '#dc322f', // 错误色（Red）
    
    // 背景色（Solarized核心：暖黄基底）
    '--magic-idea-background': '#fdf6e3', // 全局主背景（base3）
    '--magic-idea-background-overlay': 'rgba(238, 232, 213, 0.4)', // 叠加层（base2）

    // 浮层阴影（低对比度，符合Solarized风格）
    '--magic-idea-shadow': 'rgba(111, 111, 99, 0.15)',
    
    // 链接与按钮颜色（同步改为暖黄色系）
    '--magic-idea-link-color': '#b58900', // 链接（Yellow）
    '--magic-idea-button-foreground': '#fdf6e3', // 按钮文本（base3）
    '--magic-idea-button-background': '#b58900', // 按钮背景（Yellow）
    '--magic-idea-button-hover-background': '#9a7500', // 按钮hover（深Yellow）
    '--magic-idea-button-primary-background': '#b58900', 
    '--magic-idea-button-primary-hover-background': '#9a7500',
    '--magic-idea-button-primary-foreground': '#fdf6e3',
    '--magic-idea-button-secondary-background': '#eee8d5', // 次按钮背景（base2）
    '--magic-idea-button-secondary-hoverBackground': '#e5dfc8', // 次按钮hover
    '--magic-idea-button-secondary-foreground': '#657b83', // 次按钮文本（base00）
    
    // 边框与分隔线
    '--magic-idea-border-color': '#ede4ca', // 浅暖黄边框（base2衍生）
    '--magic-idea-border-radius': '4px', // Solarized风格：小圆角更简约
    '--magic-idea-focus-border': '#b58900', // 聚焦边框（Yellow）
    
    // 图标颜色
    '--magic-idea-icon-foreground': '#657b83', // 图标（base00）
    
    // 菜单背景颜色（hover同步改为暖黄）
    '--magic-idea-menu-background': '#fdf6e3', // 菜单背景（base3）
    '--magic-idea-menu-foreground': '#657b83', // 菜单文本（base00）
    '--magic-idea-menu-borderColor': '#e0d8c0', // 菜单边框
    '--magic-idea-menu-hoverForeground': '#fdf6e3', // hover文本（base3）
    '--magic-idea-menu-hoverBackground': '#b58900', // hover背景（Yellow）
    
    // 工具栏（hover改为暖黄半透）
    '--magic-idea-toolbar-hoverBackground': 'rgba(181, 137, 0, 0.1)', // 浅黄半透
    
    // Tab 栏（Solarized 经典分层）
    '--magic-idea-tabbar-background': '#fdf6e3', // 标签栏背景（base3）
    '--magic-idea-tabbar-foreground': '#839496', // 标签文本（base0）
    '--magic-idea-tabbar-hoverBackground': '#eee8d5', // hover背景（base3衍生）
    '--magic-idea-tabbar-hoverForeground': '#586e75', // hover文本（base01）
    '--magic-idea-tabbar-lastActiveBackground': 'rgba(238, 232, 213, 0.7)', // base2半透
    '--magic-idea-tabbar-activeBackground': '#f5eece', // 激活标签（base2）
    '--magic-idea-tabbar-activeForeground': '#073642', // 激活文本（base02）
    
    // 编辑器背景色（Solarized 核心）
    '--magic-idea-editor-background': '#fdf6e3', // 编辑器背景（base3）
    '--magic-idea-debugIcon-breakpointForeground': '#dc322f', // 断点（Red）
    '--magic-idea-editorCursor-foreground': '#657b83', // 光标（base00）
    '--magic-idea-debug-breakpointLineBackground': 'rgba(181, 137, 0, 0.08)',
    
    // 输入框
    '--magic-idea-input-background': '#fdf6e3', // 输入框背景（base3）
    '--magic-idea-input-foreground': '#657b83', // 输入文本（base00）
    '--magic-idea-input-placeholder': '#93a1a1', // 占位符（base1）
    '--magic-idea-input-border': '#e0d8c0', // 输入框边框
    
    // 侧边栏（激活边框改为暖黄）
    '--magic-idea-sideTabbar-width': '48px',
    '--magic-idea-sideTabbar-background': '#fdf6e3', // 侧边标签栏（base3）
    '--magic-idea-activityBar-width': '48px',
    '--magic-idea-activityBar-background': '#eee8d5', // 活动栏（base2）
    '--magic-idea-activityBar-activeBorder': '#b58900', // 激活边框（Yellow）
    '--magic-idea-sideBar-titleColor': '#586e75', // 侧边栏标题（base01）
    '--magic-idea-sideBar-bodyColor': '#657b83', // 侧边栏内容（base00）
    '--magic-idea-sidebar-background': '#fdf6e3', // 侧边栏背景（base3）
    
    // 列表（选中背景改为暖黄）
    '--magic-idea-list-activeSelectionBackground': '#b58900', // 选中背景（Yellow）
    '--magic-idea-list-activeSelectionForeground': '#fdf6e3', // 选中文本（base3）
    '--magic-idea-list-inactiveSelectionBackground': '#f5eece', // 未激活（base2）
    '--magic-idea-list-hoverBackground': '#eee8d5', // hover背景（base3衍生）
    '--magic-idea-list-hoverForeground': '#586e75', // hover文本（base01）
    '--magic-idea-descriptionForeground': '#93a1a1', // 列表描述（base1）
    
    // 通知颜色
    '--magic-idea-notification-background': '#fdf6e3', // 通知背景（base3）
    '--magic-idea-notification-hoverBackground': '#f5eece', // 通知hover
    
    // 状态栏（hover改为暖黄半透）
    '--magic-idea-statusbar-background': '#eee8d5', // 状态栏背景（base2）
    '--magic-idea-statusbar-hoverBackground': 'rgba(181, 137, 0, 0.1)', // 浅黄半透
    '--magic-idea-statusbar-foreground': '#586e75', // 状态栏文本（base01）

    // 快速输入颜色（高亮改为暖黄）
    '--magic-idea-quickinput-selectionBackground': 'rgba(181, 137, 0, 0.15)',
    '--magic-idea-quickinput-selectionForeground': '#586e75',
    '--magic-idea-quickinput-hoverBackground': 'rgba(181, 137, 0, 0.08)',
    '--magic-idea-quickinput-hoverForeground': '#657b83',
    '--magic-idea-quickinput-hlightForeground': '#b58900', // 高亮（Yellow）

    // 滚动条颜色
    '--magic-idea-scrollbar-background' : '#d0c8b0', // 滚动条（base2衍生）
  }
};