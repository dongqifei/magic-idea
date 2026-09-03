import { Theme } from '../theme-type';

export const solarizedDarkTheme: Theme = {
  id: 'solarized-dark',
  type: 'dark',
  label: 'Solarized Dark',
  description: 'Solarized Dark 护眼主题，低蓝光暖调基底，精准语法高亮适配。',
  monacoTheme: 'vs-dark', 
  spacing: 1,
  rules: [
    // ===== Solarized Dark 官方语法高亮规范（全覆盖+高辨识度）=====
    // 基础关键字（暖黄，核心识别）
    { token: "sys.keyword", foreground: "b58900", fontStyle: "" },
    { token: "keyword", foreground: "b58900", fontStyle: "" }, // 通用关键字
    { token: "keyword.control", foreground: "b58900", fontStyle: "" }, // 控制关键字（if/else/for）
    { token: "keyword.operator", foreground: "839496", fontStyle: "" }, // 操作符关键字
    
    // 函数/方法（暖橙，区分关键字）
    { token: "sys.function", foreground: "cb4b16", fontStyle: "italic" },
    { token: "function", foreground: "cb4b16", fontStyle: "" },
    { token: "function.call", foreground: "cb4b16", fontStyle: "" }, // 函数调用
    { token: "function.member", foreground: "cb4b16", fontStyle: "" }, // 成员方法
    
    // 字符串（暖绿，低饱和不刺眼）
    { token: "string", foreground: "859900", fontStyle: "" },
    { token: "string.quoted", foreground: "859900", fontStyle: "" }, // 引号字符串
    { token: "string.template", foreground: "859900", fontStyle: "italic" }, // 模板字符串
    { token: "string.regexp", foreground: "2aa198", fontStyle: "" }, // 正则表达式（青蓝区分）
    
    // 注释（浅灰，弱化但清晰）
    { token: "comment", foreground: "586e75", fontStyle: "italic" },
    { token: "comment.line", foreground: "586e75", fontStyle: "italic" }, // 行注释
    { token: "comment.block", foreground: "586e75", fontStyle: "italic" }, // 块注释
    
    // 数字/布尔值（洋红，精准识别）
    { token: "number", foreground: "d33682", fontStyle: "" },
    { token: "constant.numeric", foreground: "d33682", fontStyle: "" }, // 数值常量
    { token: "constant.language", foreground: "d33682", fontStyle: "" }, // 布尔值（true/false）
    
    // 类型/接口（青蓝，区分函数）
    { token: "type", foreground: "2aa198", fontStyle: "" },
    { token: "type.identifier", foreground: "2aa198", fontStyle: "" }, // 类型标识
    { token: "storage.type", foreground: "2aa198", fontStyle: "" }, // 类型声明（class/interface）
    
    // 常量/变量（浅灰，基础层级）
    { token: "constant", foreground: "839496", fontStyle: "" },
    { token: "variable", foreground: "839496", fontStyle: "" },
    { token: "variable.parameter", foreground: "839496", fontStyle: "italic" }, // 参数变量（斜体区分）
    
    // 运算符（浅灰，弱化但清晰）
    { token: "operator", foreground: "839496", fontStyle: "" },
    { token: "operator.logical", foreground: "839496", fontStyle: "" }, // 逻辑运算符
    
    // 标点符号（浅灰，统一视觉）
    { token: "punctuation", foreground: "839496", fontStyle: "" },
    
    // 装饰器/注解（紫蓝，特殊标识）
    { token: "decorator", foreground: "6c71c4", fontStyle: "" },
    { token: "annotation", foreground: "6c71c4", fontStyle: "" },
    
    // 错误/警告（暖红，醒目不刺眼）
    { token: "invalid", foreground: "dc322f", fontStyle: "bold" }, // 语法错误
    { token: "warning", foreground: "b58900", fontStyle: "bold" }, // 警告
  ],
  variables: {
    // ===== 保留原护眼暖调基底，仅微调冲突色值 =====
    // 主题字体（保持易读性）
    '--magic-idea-ui-font-size': '14px',
    '--magic-idea-ui-font-family': "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
    
    // 文本颜色（暖调优化，提升与高亮色的对比度）
    '--magic-idea-foreground': '#e8e0d0', // 主文本暖米色
    '--magic-idea-secondary-foreground': '#d0c8b8', // 次要文本浅卡其
    '--magic-idea-description-foreground': '#b8b0a0', // 描述文本暖灰
    
    // 功能色（同步Solarized Dark官方色，保持统一）
    '--magic-idea-primary-color': '#127a81', // 主色调暖棕灰
    '--magic-idea-info-color': '#2aa198', // 信息色（青蓝，匹配语法高亮）
    '--magic-idea-success-color': '#859900', // 暖绿色（匹配字符串高亮）
    '--magic-idea-warning-color': '#b58900', // 暖黄色（匹配关键字高亮）
    '--magic-idea-error-color': '#dc322f', // 暖红色（匹配错误高亮）
    
    // 背景色（经典护眼暗黄基底）
    '--magic-idea-background': '#002b36', // 替换为Solarized Dark官方主背景（更护眼）
    '--magic-idea-background-overlay': 'rgba(70, 85, 90, 0.3)', // 叠加层优化
    
    // 浮层阴影（低对比度）
    '--magic-idea-shadow': 'rgba(0, 0, 0, 0.25)',

    // 链接与按钮颜色（暖调适配）
    '--magic-idea-link-color': '#8a7d68', 
    '--magic-idea-button-foreground': '#e8e0d0', 
    '--magic-idea-button-background': '#383834', 
    '--magic-idea-button-hover-background': '#484842', 
    '--magic-idea-button-primary-background': '#8a7d68', 
    '--magic-idea-button-primary-hover-background': '#7a6d58', 
    '--magic-idea-button-primary-foreground': '#f8f0e0', 
    '--magic-idea-button-secondary-background': '#30302c', 
    '--magic-idea-button-secondary-hoverBackground': '#383834',
    '--magic-idea-button-secondary-foreground': '#e8e0d0', 
    
    // 边框与分隔线（优化对比度，避免与高亮色冲突）
    '--magic-idea-border-color': '#3b4a4f', // Solarized Dark官方次要背景（更适配）
    '--magic-idea-border-radius': '0px', 
    '--magic-idea-focus-border': '#127a81', 
    
    // 图标颜色
    '--magic-idea-icon-foreground': '#d0c8b8', 
    
    // 菜单背景颜色
    '--magic-idea-menu-background': '#073642', // 菜单背景（Solarized Dark次要背景）
    '--magic-idea-menu-foreground': '#e8e0d0', 
    '--magic-idea-menu-borderColor': '#586e75', // 菜单边框（匹配注释色）
    '--magic-idea-menu-hoverForeground': '#f8f0e0', 
    '--magic-idea-menu-hoverBackground': '#005a6f', 
    
    // 工具栏
    '--magic-idea-toolbar-hoverBackground': 'rgba(232, 224, 208, 0.1)', 
    
    // Tab 栏（优化背景，匹配Solarized Dark层级）
    '--magic-idea-tabbar-background': '#002b36', 
    '--magic-idea-tabbar-foreground': '#d0c8b8', 
    '--magic-idea-tabbar-hoverBackground': '#073642', 
    '--magic-idea-tabbar-hoverForeground': '#e8e0d0',
    '--magic-idea-tabbar-lastActiveBackground': 'rgba(88, 110, 117, .7)', 
    '--magic-idea-tabbar-activeBackground': '#005a6f', 
    '--magic-idea-tabbar-activeForeground': '#f8f0e0', 
    
    // 编辑器背景色（Solarized Dark官方编辑器背景，更适配高亮）
    '--magic-idea-editor-background': '#002b36', 
    '--magic-idea-debugIcon-breakpointForeground': '#dc322f', // 断点（匹配错误色）
    '--magic-idea-editorCursor-foreground': '#e0d8c8', 
    '--magic-idea-debug-breakpointLineBackground': 'rgba(18, 122, 129, 0.2)',
    
    // 输入框
    '--magic-idea-input-background': '#073642', // 输入框背景（次要背景）
    '--magic-idea-input-foreground': '#e8e0d0', 
    '--magic-idea-input-placeholder': '#586e75', // 占位符（匹配注释色）
    '--magic-idea-input-border': '#3b4a4f', 
    
    // 侧边栏
    '--magic-idea-sideTabbar-width': '48px',
    '--magic-idea-sideTabbar-background': '#002b36', 
    '--magic-idea-activityBar-width': '48px',
    '--magic-idea-activityBar-background': '#073642', 
    '--magic-idea-activityBar-activeBorder': '#8a7d68', 
    '--magic-idea-sideBar-titleColor': '#e0d8c8', 
    '--magic-idea-sideBar-bodyColor': '#e0d8c8',
    '--magic-idea-sidebar-background': '#073642', 
    
    // 列表
    '--magic-idea-list-activeSelectionBackground': '#127a81', 
    '--magic-idea-list-activeSelectionForeground': '#f8f0e0', 
    '--magic-idea-list-inactiveSelectionBackground': '#005a6f', // 未激活（匹配注释色）
    '--magic-idea-list-hoverBackground': 'rgba(232, 224, 208, 0.1)', 
    '--magic-idea-list-hoverForeground': '#e8e0d0', 
    '--magic-idea-descriptionForeground': '#b8b0a0', 
    
    // 通知颜色
    '--magic-idea-notification-background': '#073642', 
    '--magic-idea-notification-hoverBackground': '#586e75', 
    
    // 状态栏
    '--magic-idea-statusbar-background': '#002b36', 
    '--magic-idea-statusbar-hoverBackground': 'rgba(232, 224, 208, 0.15)', 
    '--magic-idea-statusbar-foreground': '#e8e0d0', 

    // 快速输入颜色（匹配语法高亮）
    '--magic-idea-quickinput-selectionBackground': '#586e75',
    '--magic-idea-quickinput-selectionForeground': '#f8f0e0',
    '--magic-idea-quickinput-hoverBackground': '#073642',
    '--magic-idea-quickinput-hoverForeground': '#e8e0d0',
    '--magic-idea-quickinput-hlightForeground': '#b58900', // 高亮（匹配关键字色）

    // 滚动条颜色
    '--magic-idea-scrollbar-background' : '#586e75',
  }
};