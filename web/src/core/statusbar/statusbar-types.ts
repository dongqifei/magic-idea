import { IEvent } from '../common';

export type StatusBarAlignment = 'left' | 'right';

export type StatusBarItemType = 'text' | 'spinner' | 'progress' | 'custom' | 'button';

export interface StatusBarItemOptions {
  // 基础字段
  icon?: string;
  // 红点
  dot?: boolean;
  text?: string;
  alignment?: StatusBarAlignment;
  priority?: number;
  tooltip?: string;
  visible?: boolean;
  // 新增字段：渲染类型与回调
  type?: StatusBarItemType;
  // 用于 progress 类型（0..100）
  progress?: number;
  // 点击回调（可由 UI 调用）
  onClick?: (e: MouseEvent) => void;
  // render 返回 React.ReactNode（用于 custom 类型或复杂内容）
  render?: () => any;
  // 可扩展字段
  [k: string]: any;
}

/**
 * 状态栏项配置项
 */
export interface StatusBarItem {
  id: string;
  options: StatusBarItemOptions;
}

/**
 * 状态栏服务接口
 */
export interface IStatusBarService {
  onDidChangeStatusBar: IEvent<any>;
  registerItem(id: string, options: StatusBarItemOptions): { dispose: () => void; update: (opts: Partial<StatusBarItemOptions>) => void };
  removeItem(id: string): void;
  getItems(): StatusBarItem[];
}

/**
 * 状态栏接口
 */
export const IStatusBarService = Symbol('IStatusBarService')