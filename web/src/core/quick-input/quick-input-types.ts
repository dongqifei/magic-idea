import { VirtualElement } from "@lumino/virtualdom";
import { CommandFunc } from "../commands";

/**
 * 快速输入行内按钮
 */
export interface QuickInputButton {
  /**
   * 按钮的提示文本(鼠标悬停时显示)
   */
  tooltip?: string;
  /**
   * 按钮的图标样式类 (如 codicon 类)
   */
  iconClass?: string;
  /**
   * 按钮的虚拟图标渲染器
   */
  icon?: VirtualElement.IRenderer;
  /**
   * 按钮点击回调。返回 true 可关闭面板，返回 false 或 undefined 则保持打开
   */
  callback: () => void | boolean | Promise<boolean>;
}

export interface QuickPickItem {
  label: string;
  description?: string;
  detail?: string;
  iconClass?: string;
  icon?: VirtualElement.IRenderer;
  picked?: boolean | CommandFunc<boolean | Promise<boolean>>;
  alwaysShow?: boolean;
  execute?: () => void | Promise<void>; // 被选中时的回调
  insertPrefix?: string; // 被选中时填入输入框触发 provider
  category?: string; // 分类
  /**
   * 行内按钮数组，显示在列表项右侧
   */
  buttons?: QuickInputButton[];
}

export interface QuickPickOptions {
  prefix?: string;
  inputValue?: string;
  placeholder?: string;
  items: QuickPickItem[];
  canSelectMany?: boolean;
  matchOnDescription?: boolean;
  matchOnDetail?: boolean;
  onDidAccept?: (selected: QuickPickItem | QuickPickItem[]) => void;
  onDidChangeSelection?: (selected: QuickPickItem | QuickPickItem[]) => void;
  onDidHide?: () => void;
  onInputChange?: (value: any) => Promise<QuickPickItem[]>;
}

export interface InputBoxOptions {
  prompt?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  labelTips?: string;
  validateInput?: (value: string) => string | undefined;
  onDidAccept?: (value: string) => void;
  onDidChangeValue?: (value: string) => void;
  onDidHide?: () => void;
  password?: boolean;
}

export interface QuickInputUI {
  showQuickPick(
    options: QuickPickOptions
  ): Promise<QuickPickItem | QuickPickItem[] | undefined>;
  showInputBox(options: InputBoxOptions): Promise<string | undefined>;
  hide(): void;
}

export const QuickInputUI = Symbol("QuickInputUI");

export interface QuickInputService {
  
  /**
   * 显示快速选择
   * @param options
   */
  showQuickPick(
    options: QuickPickOptions
  ): Promise<QuickPickItem | QuickPickItem[] | undefined>;

  /**
   * 显示输入框
   * @param options
   */
  showInputBox(options: InputBoxOptions): Promise<string | undefined>;

  /**
   * 快速访问面板(支持前缀 provider)
   * @param input 初始输入 (如">"、"@main")
   */
  showQuickAccess(input?: string): Promise<QuickPickItem[]>;

  /**
   * 隐藏当前快速输入
   */
  hide(): void;
}

export const QuickInputService = Symbol("QuickInputService");
