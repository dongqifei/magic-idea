import { Theme } from '../theme-type';

export const nationalDayTheme: Theme = {
  id: 'national-day',
  type: 'light',
  label: '国庆节主题',
  description: '中国红与金色点缀，层次分明，节日氛围浓厚。',
  monacoTheme: 'vs',
  spacing: 1,
  rules: [
    { token: "sys.keyword", foreground: "c62828", fontStyle: "" }, // 国旗红
    { token: "sys.function", foreground: "ffd700", fontStyle: "italic" }, // 金色
    { token: "function", foreground: "c62828", fontStyle: "" }
  ],
  variables: {
    // 主题字体（与深色主题保持一致）
    '--magic-idea-ui-font-size': '14px',
    '--magic-idea-ui-font-family': "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
    // '--magic-idea-ui-font-family': "Consolas, 'Courier New', monospace",

    // 文本颜色（红金主题下优化对比度）
    '--magic-idea-foreground': '#a31515', // 主文本深红，易读
    '--magic-idea-secondary-foreground': '#c62828', // 次要文本国旗红
    '--magic-idea-description-foreground': '#b8860b', // 描述文本金棕

    // 功能色（高饱和度红金，确保识别度）
    '--magic-idea-primary-color': '#c62828', // 主色调国旗红
    '--magic-idea-info-color': '#ffd700', // 信息金色
    '--magic-idea-success-color': '#43a047', // 成功绿色
    '--magic-idea-warning-color': '#ffd700', // 警告金色
    '--magic-idea-error-color': '#c62828', // 错误红

    // 背景色（分层设计，避免单调）
    '--magic-idea-background': '#fff8e1', // 全局主背景淡金米色
    '--magic-idea-background-overlay': 'rgba(198, 40, 40, 0.06)', // 叠加背景淡红

    // 浮层阴影
    '--magic-idea-shadow': 'rgba(198, 40, 40, 0.18)',

    // 链接与按钮颜色（提升对比度，保证交互清晰）
    '--magic-idea-link-color': '#c62828', // 链接红
    '--magic-idea-button-foreground': '#fffbe6', // 按钮文本淡金
    '--magic-idea-button-background': '#c62828', // 按钮背景红
    '--magic-idea-button-hover-background': '#a31515', // 按钮hover深红
    '--magic-idea-button-primary-background': '#ffd700', // 主按钮背景金色
    '--magic-idea-button-primary-hover-background': '#e6b800', // 主按钮hover深金
    '--magic-idea-button-primary-foreground': '#a31515', // 主按钮文本深红
    '--magic-idea-button-secondary-background': 'rgba(255, 215, 0, 0.12)', // 次按钮背景淡金
    '--magic-idea-button-secondary-hoverBackground': '#ffe082',
    '--magic-idea-button-secondary-foreground': '#c62828', // 次按钮文本红

    // 边框与分隔线（浅金边框，保证区分度不突兀）
    '--magic-idea-border-color': '#ffd700', // 边框金色
    '--magic-idea-border-radius': '8px', // 边框圆角
    '--magic-idea-focus-border': '#c62828', // 聚焦边框红

    // 图标颜色（适配红金主题）
    '--magic-idea-icon-foreground': '#ffd700', // 图标金色

    // 菜单背景颜色
    '--magic-idea-menu-background': '#fff8e1', // 菜单背景淡金
    '--magic-idea-menu-foreground': '#a31515', // 菜单文本深红
    '--magic-idea-menu-borderColor': '#ffd700', // 菜单边框金色
    '--magic-idea-menu-hoverForeground': '#fffbe6', // 菜单hover文字淡金
    '--magic-idea-menu-hoverBackground': '#c62828', // 菜单hover背景红

    // 工具栏
    '--magic-idea-toolbar-hoverBackground': 'rgba(255, 215, 0, 0.08)', // hover淡金

    // Tab 栏
    '--magic-idea-tabbar-background': '#fff8e1', // 标签栏背景淡金
    '--magic-idea-tabbar-foreground': '#a31515', // 标签文本深红
    '--magic-idea-tabbar-hoverBackground': '#ffe082', // 标签hover背景浅金
    '--magic-idea-tabbar-hoverForeground': '#c62828',
    '--magic-idea-tabbar-lastActiveBackground': 'rgba(255, 215, 0, .18)', // 上次激活标签背景淡金
    '--magic-idea-tabbar-activeBackground': 'rgba(255, 215, 0, 1)', // 激活标签背景金色
    '--magic-idea-tabbar-activeForeground': '#c62828', // 激活标签文本红

    // 编辑器背景色
    '--magic-idea-editor-background': '#fffde7', // 编辑器背景更浅，突出内容
    '--magic-idea-debugIcon-breakpointForeground': '#c62828', // 断点红色
    '--magic-idea-editorCursor-foreground': '#ffd700',
    '--magic-idea-debug-breakpointLineBackground': 'rgba(198, 40, 40, 0.12)',

    // 输入框
    '--magic-idea-input-background': '#fffde7', // 输入框背景
    '--magic-idea-input-foreground': '#a31515', // 输入框文本深红
    '--magic-idea-input-placeholder': '#b22222', // 输入框占位符
    '--magic-idea-input-border': '#ffd700', // 输入框边框金色

    // 侧边栏
    '--magic-idea-sideTabbar-width': '48px', // 宽度保持一致
    '--magic-idea-sideTabbar-background': '#fff8e1', // 侧边标签栏背景
    '--magic-idea-activityBar-width': '48px', // 宽度保持一致
    '--magic-idea-activityBar-background': '#ffd700', // 活动栏背景金色
    '--magic-idea-activityBar-activeBorder': '#c62828', // 激活边框红
    '--magic-idea-sideBar-titleColor': '#a31515', // 侧边栏标题深红
    '--magic-idea-sideBar-bodyColor': '#c62828',// 侧边栏内容红
    '--magic-idea-sidebar-background': '#fffde7', // 侧边栏背景更浅

    // 列表
    '--magic-idea-list-activeSelectionBackground': '#c62828', // 选中背景红
    '--magic-idea-list-activeSelectionForeground': '#fffbe6', // 选中文本淡金
    '--magic-idea-list-inactiveSelectionBackground': '#ffe082', // 未激活选中背景浅金
    '--magic-idea-list-hoverBackground': '#ffd700', // 列表hover背景金色
    '--magic-idea-list-hoverForeground': '#a31515', // 列表hover文本深红
    '--magic-idea-descriptionForeground': '#b8860b', // 列表描述文本金棕

    // 通知颜色
    '--magic-idea-notification-background': '#fff8e1', // 通知背景
    '--magic-idea-notification-hoverBackground': '#ffe082', // 通知hover背景

    // 状态栏
    '--magic-idea-statusbar-background': '#c62828', // 状态栏背景红
    '--magic-idea-statusbar-hoverBackground': '#ffd700', // 状态栏hover金色
    '--magic-idea-statusbar-foreground': '#fffbe6', // 状态栏文本淡金

    // 快速输入颜色
    '--magic-idea-quickinput-selectionBackground': '#ffd700',
    '--magic-idea-quickinput-selectionForeground': '#c62828',
    '--magic-idea-quickinput-hoverBackground': '#ffe082',
    '--magic-idea-quickinput-hoverForeground': '#c62828',
    '--magic-idea-quickinput-hlightForeground': '#c62828',

    // 滚动条颜色
    '--magic-idea-scrollbar-background' : '#ffd700',
  }
};