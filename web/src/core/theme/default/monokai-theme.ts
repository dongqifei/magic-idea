import { Theme } from '../theme-type';

export const monokaiTheme: Theme = {
  id: 'monokai-dark',
  type: 'dark',
  label: 'Monokai',
  description: '',
  monacoTheme: 'vs-dark', // 搭配monaco护眼基底
  spacing: 4,
  rules: [
    // 代码语法高亮适配护眼色调（低饱和度，避免刺眼）
    { token: "sys.keyword", foreground: "9f8f78", fontStyle: "" },
    { token: "sys.function", foreground: "9f8f78", fontStyle: "italic" },
    { token: "function", foreground: "b89b72", fontStyle: "" }
  ],
  variables: {
    // 主题字体（保持易读性，优先无衬线字体）
    '--magic-idea-ui-font-size': '14px',
    '--magic-idea-ui-font-family': "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
    
    // 文本颜色（暖色调低饱和度，避免纯白/纯黑）
    '--magic-idea-foreground': '#e8e0d0', // 主文本暖米色，替代纯白
    '--magic-idea-secondary-foreground': '#d0c8b8', // 次要文本浅卡其
    '--magic-idea-description-foreground': '#b8b0a0', // 描述文本暖灰
    
    // 功能色（低饱和度暖色调，减少蓝光）
    '--magic-idea-primary-color': '#8a7d68', // 主色调暖棕灰，替代冷蓝
    '--magic-idea-info-color': '#e8e0d0', // 信息色适配主文本
    '--magic-idea-success-color': '#7a9668', // 暖绿色（非刺眼亮绿）
    '--magic-idea-warning-color': '#c8a868', // 暖黄色（低饱和）
    '--magic-idea-error-color': '#a86868', // 暖红色（低饱和，避免刺眼）
    
    // 背景色（经典护眼暗黄基底，分层设计）
    '--magic-idea-background': '#282824', // 全局主背景（暖暗黄，减少蓝光）
    '--magic-idea-background-overlay': 'rgba(80, 78, 70, 0.3)', // 叠加层暖灰
    
    // 浮层阴影（低对比度，避免生硬）
    '--magic-idea-shadow': 'rgba(0, 0, 0, 0.25)',

    // 链接与按钮颜色（暖色调适配）
    '--magic-idea-link-color': '#8a7d68', // 链接色同步主色调
    '--magic-idea-button-foreground': '#e8e0d0', // 按钮文本暖米色
    '--magic-idea-button-background': '#383834', // 按钮背景浅于主背景
    '--magic-idea-button-hover-background': '#484842', // hover稍亮，暖调
    '--magic-idea-button-primary-background': '#8a7d68', // 主按钮暖棕
    '--magic-idea-button-primary-hover-background': '#7a6d58', // hover稍深
    '--magic-idea-button-primary-foreground': '#f8f0e0', // 主按钮文本更浅
    '--magic-idea-button-secondary-background': 'rgba(232, 224, 208, 0.1)', // 次按钮背景
    '--magic-idea-button-secondary-hoverBackground': '#383834',
    '--magic-idea-button-secondary-foreground': '#e8e0d0', // 次按钮文本
    
    // 边框与分隔线（暖灰边框，低对比度）
    '--magic-idea-border-color': '#282824', // 边框暖灰，不突兀
    '--magic-idea-border-radius': '8px', // 保持圆角，提升柔和感
    '--magic-idea-focus-border': '#8a7d68', // 聚焦边框用主色调，不刺眼
    
    // 图标颜色（适配暖调）
    '--magic-idea-icon-foreground': '#d0c8b8', // 图标暖浅灰，清晰不刺眼
    
    // 菜单背景颜色（暖调分层）
    '--magic-idea-menu-background': '#30302c', // 菜单背景略浅于主背景
    '--magic-idea-menu-foreground': '#e8e0d0', // 菜单文本
    '--magic-idea-menu-borderColor': '#40403a', // 菜单边框
    '--magic-idea-menu-hoverForeground': '#f8f0e0', // hover文本更亮
    '--magic-idea-menu-hoverBackground': '#8a7d68', // hover背景主色调
    
    // 工具栏（暖调hover）
    '--magic-idea-toolbar-hoverBackground': 'rgba(232, 224, 208, 0.1)', // hover暖半透明
    
    // Tab 栏（暖调分层）
    '--magic-idea-tabbar-background': '#30302c', // 标签栏背景与菜单一致
    '--magic-idea-tabbar-foreground': '#d0c8b8', // 标签文本
    '--magic-idea-tabbar-hoverBackground': '#242420', // hover背景稍深
    '--magic-idea-tabbar-hoverForeground': '#e8e0d0',
    '--magic-idea-tabbar-lastActiveBackground': 'rgba(70, 65, 55, .7)', // 上次激活暖灰
    '--magic-idea-tabbar-activeBackground': 'rgba(70, 65, 55, 1)', // 激活标签背景
    '--magic-idea-tabbar-activeForeground': '#f8f0e0', // 激活文本更亮
    
    // 编辑器背景色（核心护眼区）
    '--magic-idea-editor-background': '#30302c', // 编辑器背景稍深，暖暗黄
    '--magic-idea-debugIcon-breakpointForeground': '#a86868', // 断点暖红，不刺眼
    '--magic-idea-editorCursor-foreground': '#e0d8c8', // 光标暖米色
    '--magic-idea-debug-breakpointLineBackground': 'rgba(138, 125, 104, 0.1)',
    
    // 输入框（暖调）
    '--magic-idea-input-background': '#383834', // 输入框背景
    '--magic-idea-input-foreground': '#e8e0d0', // 输入框文本
    '--magic-idea-input-placeholder': '#908878', // 占位符暖灰
    '--magic-idea-input-border': '#40403a', // 输入框边框
    
    // 侧边栏（暖调分层）
    '--magic-idea-sideTabbar-width': '48px',
    '--magic-idea-sideTabbar-background': '#282824', // 侧边标签栏背景
    '--magic-idea-activityBar-width': '48px',
    '--magic-idea-activityBar-background': '#30302c', // 活动栏稍亮
    '--magic-idea-activityBar-activeBorder': '#8a7d68', // 激活边框主色调
    '--magic-idea-sideBar-titleColor': '#e0d8c8', // 侧边栏标题
    '--magic-idea-sideBar-bodyColor': '#e0d8c8',// 侧边栏内容
    '--magic-idea-sidebar-background': '#30302c', // 侧边栏背景
    
    // 列表（暖调交互）
    '--magic-idea-list-activeSelectionBackground': '#8a7d68', // 选中背景主色调
    '--magic-idea-list-activeSelectionForeground': '#f8f0e0', // 选中文本
    '--magic-idea-list-inactiveSelectionBackground': 'rgb(70, 65, 55)', // 未激活选中
    '--magic-idea-list-hoverBackground': '#383834', // hover背景
    '--magic-idea-list-hoverForeground': '#e8e0d0', // hover文本
    '--magic-idea-descriptionForeground': '#b8b0a0', // 列表描述
    
    // 通知颜色（暖调）
    '--magic-idea-notification-background': '#30302c', // 通知背景
    '--magic-idea-notification-hoverBackground': '#383834', // 通知hover
    
    // 状态栏（暖调）
    '--magic-idea-statusbar-background': '#282824', // 状态栏背景
    '--magic-idea-statusbar-hoverBackground': 'rgba(232, 224, 208, 0.15)', // hover暖半透
    '--magic-idea-statusbar-foreground': '#e8e0d0', // 状态栏文本

    // 快速输入颜色（暖调）
    '--magic-idea-quickinput-selectionBackground': '#605848',
    '--magic-idea-quickinput-selectionForeground': '#f8f0e0',
    '--magic-idea-quickinput-hoverBackground': '#383834',
    '--magic-idea-quickinput-hoverForeground': '#e8e0d0',
    '--magic-idea-quickinput-hlightForeground': '#9f8f78',

    // 滚动条颜色（暖调）
    '--magic-idea-scrollbar-background' : '#484842',
  }
};