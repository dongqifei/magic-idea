import { Widget } from '@lumino/widgets';
import { CommandFunc } from "../commands";
import { ReactWidget } from '../widgets/react-widget';

/**
 * 工具栏项类型
 */
export type ToolbarItemType = 'button' | 'dropdown' | 'separator' | 'custom';

/**
 * 下拉菜单项接口
 */
export interface DropdownMenuItem {
  /** 显示标签 */
  label?: string;
  /** 图标类名（magic-idea 常用 codicon） */
  iconClass?: string;
  /** 命令ID（与 CommandRegistry 绑定） */
  commandId?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否分隔线 */
  separator?: boolean;
  /** 子菜单 */
  submenu?: DropdownMenuItem[];
}

/**
 * 工具栏项配置接口
 */
export interface ToolbarItemConfig {
  /** 工具项ID */
  id: string;
  /** 工具项类型 */
  type: ToolbarItemType;
  /** 图标类名（button/dropdown 可用） */
  iconClass?: string;
  /** 提示文本 */
  tooltip?: string;
  /** 命令ID（button 类型可用） */
  commandId?: string;
  /** 下拉菜单项（dropdown 类型可用） */
  menuItems?: DropdownMenuItem[];
  /** 自定义组件（custom 类型可用） */
  customWidget?: () => Widget | ReactWidget;
  /** 是否可见 */
  visible?: boolean | CommandFunc<boolean | Promise<boolean>>;
  /** CSS 类名 */
  className?: string;
}

/**
 * 工具栏配置接口
 */
export interface ActivityToolbarConfig {
  /** 工具栏ID */
  id?: string; // 可选，默认使用 activity-id + "-toolbar"
  /** 自定义工具栏样式类 */
  className?: string;
  /** 工具项列表 */
  items: ToolbarItemConfig[];
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 标题文本（默认使用活动标题） */
  title?: string;
  /** 标题右侧是否显示 */
  titlePosition?: 'left' | 'center' | 'right';
  /** 是否显示折叠按钮 */
  showCollapseButton?: boolean;
}

// ========== 扩展 ActivityOptions 接口（让插件传入工具栏配置） ==========
// 活动注册选项
export interface ActivityOptions {
  id: string;
  title: string;
  iconClass?: string;
  priority?: number;
  closable?: boolean;
  location?: string;
  factory?: () => Widget | ReactWidget;
  toolbarConfig?: ActivityToolbarConfig; // 新增：插件传入的工具栏配置
}

/**
 * 活动控制句柄
 */
export interface ActivityHandle {
  id: string;
  setBadge(value: number | string | boolean |null): void;
  open(): void;
  close(): void;
  toggle(): void;
  isInitialized(): boolean;
  isVisible(): boolean;
  updateToolbar(): void;
}