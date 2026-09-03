// dark-theme.ts
import { Theme } from '../theme-type';

export const darkTheme: Theme = {
  id: 'dark',
  type: 'dark',
  label: '现代深色',
  description: '暗黑主题，适用于夜间或低光环境使用。',
  monacoTheme: 'vs-dark',
  spacing: 4,
  rules: [
    { token: "sys.keyword", foreground: "da70d6", fontStyle: "" },
    { token: "sys.function", foreground: "da70d6", fontStyle: "italic" },
    { token: "function", foreground: "ffa657", fontStyle: "" }
  ],
  variables: {
    // 主题字体（与浅色主题保持一致）
    '--magic-idea-ui-font-size': '14px',
    '--magic-idea-ui-font-family': "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
    // '--magic-idea-ui-font-family': "Consolas, 'Courier New', monospace",
    
    // 文本颜色（深色背景下优化对比度）
    '--magic-idea-foreground': '#ffffff', // 主文本浅灰，避免纯白刺眼
    '--magic-idea-secondary-foreground': '#c0c0c0', // 次要文本深灰
    '--magic-idea-description-foreground': '#a0a0a0', // 描述文本中灰
    
    // 功能色（保持高饱和度，确保识别度）
    '--magic-idea-primary-color': '#007acc', // 主色调亮蓝，适配深色
    '--magic-idea-info-color': '#007acc', // 信息
    '--magic-idea-success-color': '#00e676', // 成功绿更鲜艳
    '--magic-idea-warning-color': '#ffc107', // 警告黄保持明亮
    '--magic-idea-error-color': '#ff5252', // 错误红更醒目
    
    // 背景色（分层设计，避免单调）
    '--magic-idea-background': '#24272e', // 全局主背景深灰
    '--magic-idea-background-overlay': 'rgba(74, 74, 74, 0.3)', // 叠加背景更浅灰
    
    // 浮层阴影
    '--magic-idea-shadow': 'rgba(0, 0, 0, 0.36)',

    // 链接与按钮颜色（提升对比度，保证交互清晰）
    '--magic-idea-link-color': '#007acc', // 链接浅蓝，醒目不刺眼
    '--magic-idea-button-foreground': '#ffffff', // 按钮文本纯白
    '--magic-idea-button-background': '#007acc', // 按钮背景同步主色调
    '--magic-idea-button-hover-background': '#0088cc', // 按钮hover暗化
    '--magic-idea-button-primary-background': '#0091ea', // 主按钮背景稍深
    '--magic-idea-button-primary-hover-background': '#0077b3', // 主按钮hover暗化
    '--magic-idea-button-primary-foreground': '#ffffff', // 主按钮文本纯白
    '--magic-idea-button-secondary-background': 'rgba(255, 255, 255, 0.1)', // 次按钮背景深灰
    '--magic-idea-button-secondary-hoverBackground': '#2c2c2c',
    '--magic-idea-button-secondary-foreground': '#ffffff', // 次按钮文本纯白
    
    // 边框与分隔线（浅灰边框，保证区分度不突兀）
    '--magic-idea-border-color': '#24272e', // 边框深灰，不刺眼
    '--magic-idea-border-radius': '8px', // 边框圆角
    '--magic-idea-focus-border': '#007acc', // 聚焦边框用主色调，明显不突兀
    
    // 图标颜色（适配深色背景）
    '--magic-idea-icon-foreground': '#c0c0c0', // 图标浅灰，清晰可见
    
    // 菜单背景颜色
    '--magic-idea-menu-background': '#1c2023', // 菜单背景略浅于主背景
    '--magic-idea-menu-foreground': '#ffffff', // 菜单文本颜色
    '--magic-idea-menu-borderColor': '#454545', // 菜单文本颜色
    '--magic-idea-menu-hoverForeground': '#ffffff', // 菜单hover文字颜色
    '--magic-idea-menu-hoverBackground': '#007acc', // 菜单hover背景
    
    // 工具栏
    '--magic-idea-toolbar-hoverBackground': 'rgba(255, 255, 255, 0.1)', // hover半透明白色，柔和
    
    // Tab 栏
    '--magic-idea-tabbar-background': '#1c2023', // 标签栏背景与菜单一致
    '--magic-idea-tabbar-foreground': '#c0c0c0', // 标签文本浅灰
    '--magic-idea-tabbar-hoverBackground': '#24272e', // 标签hover背景
    '--magic-idea-tabbar-hoverForeground': '#e0e0e0',
    '--magic-idea-tabbar-lastActiveBackground': 'rgba(21, 57, 91, .7)', // 上次激活标签背景
    '--magic-idea-tabbar-activeBackground': 'rgba(21, 57, 91, 1)', // 激活标签背景与编辑器一致
    '--magic-idea-tabbar-activeForeground': '#ffffff', // 激活标签背景与编辑器一致
    
    // 编辑器背景色
    '--magic-idea-editor-background': '#1c2023', // 编辑器背景更深，突出内容
    '--magic-idea-debugIcon-breakpointForeground': '#ff5252', // 断点红色，醒目
    '--magic-idea-editorCursor-foreground': '#d4d4d4',
    '--magic-idea-debug-breakpointLineBackground': 'rgba(0, 122, 204, 0.2)',
    
    // 输入框
    '--magic-idea-input-background': '#3c3c3c', // 输入框背景
    '--magic-idea-input-foreground': '#ffffff', // 输入框文本颜色
    '--magic-idea-input-placeholder': '#757575', // 输入框占位符颜色
    '--magic-idea-input-border': '#454545', // 输入框边框颜色
    
    // 侧边栏
    '--magic-idea-sideTabbar-width': '48px', // 宽度保持一致
    '--magic-idea-sideTabbar-background': '#24272e', // 侧边标签栏背景
    '--magic-idea-activityBar-width': '48px', // 宽度保持一致
    '--magic-idea-activityBar-background': '#3c3c3c', // 活动栏背景稍亮，区分区域
    '--magic-idea-activityBar-activeBorder': '#007acc', // 激活边框用主色调
    '--magic-idea-sideBar-titleColor': '#e0e0e0', // 侧边栏标题颜色
    '--magic-idea-sideBar-bodyColor': '#e0e0e0',// 侧边栏内容颜色
    '--magic-idea-sidebar-background': '#171b1e', // 侧边栏背景与菜单统一
    
    // 列表
    '--magic-idea-list-activeSelectionBackground': '#007acc', // 选中背景深蓝
    '--magic-idea-list-activeSelectionForeground': '#ffffff', // 选中文本纯白
    '--magic-idea-list-inactiveSelectionBackground': 'rgb(21, 57, 91)', // 未激活选中背景
    '--magic-idea-list-hoverBackground': '#383838', // 列表hover背景
    '--magic-idea-list-hoverForeground': '#ffffff', // 列表hover文本颜色
    '--magic-idea-descriptionForeground': '#888888', // 列表描述文本颜色
    
    // 通知颜色
    '--magic-idea-notification-background': '#252526', // 通知背景
    '--magic-idea-notification-hoverBackground': '#383838', // 通知hover背景
    
    // 状态栏
    '--magic-idea-statusbar-background': '#24272e', // 状态栏背景
    '--magic-idea-statusbar-hoverBackground': 'rgba(255, 255, 255, 0.15)', // 状态栏hover半透明
    '--magic-idea-statusbar-foreground': '#ffffff', // 状态栏文本颜色

    // 快速输入颜色
    '--magic-idea-quickinput-selectionBackground': '#0e334b',
    '--magic-idea-quickinput-selectionForeground': '#ffffff',
    '--magic-idea-quickinput-hoverBackground': '#2B2D30',
    '--magic-idea-quickinput-hoverForeground': '#ffffff',
    '--magic-idea-quickinput-hlightForeground': '#27aaff',

    // 滚动条颜色
    '--magic-idea-scrollbar-background' : '#404040',
  }
};