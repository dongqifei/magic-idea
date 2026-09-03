import { injectable, inject } from "inversify";
import { CommandRegistry } from "@lumino/commands";
import { Emitter, IEvent } from "../../common";
import {
  ToolbarService,
  ToolbarItemOptions,
  ToolbarItem,
  ToolbarAlignment,
} from "./toolbar-types";

@injectable()
export class DefaultToolbarService implements ToolbarService {
  /** 存储所有工具栏项（key: itemId） */
  private items = new Map<string, ToolbarItem>();

  protected readonly onDidChangeToolBarEmitter = new Emitter<void>();
  
  get onDidChangeToolbar(): IEvent<void> {
    return this.onDidChangeToolBarEmitter.event;
  }

  constructor(
    @inject(CommandRegistry) private commandRegistry: CommandRegistry
  ) {}

  /**
   * 发送状态栏变化事件
   */
  protected fireOnDidChangeToolbar(): void {
    this.onDidChangeToolBarEmitter.fire();
  }

  /** 注册工具栏项 */
  registerItem(options: ToolbarItemOptions): void {
    if (!options.id) {
      throw new Error("ToolbarItem must have a unique 'id'");
    }

    // 补全默认值
    const item: ToolbarItem = {
      id: options.id,
      commandId: options.commandId,
      alignment: options.alignment || "left",
      rank: options.rank ?? 100, // 默认权重 100
      render: options.render,
      isVisible: options.isVisible || (() => true),
      className: options.className,
    };

    this.items.set(item.id, item);
  }

  /** 移除工具栏项 */
  unregisterItem(itemId: string): void {
    this.items.delete(itemId);
  }

  /** 获取指定位置的工具栏项（按 rank 排序） */
  getItemsByAlignment(alignment: ToolbarAlignment): ToolbarItem[] {
    return Array.from(this.items.values())
      .filter((item) => item.alignment === alignment)
      .filter((item) => item.isVisible(this.commandRegistry))
      .sort((a, b) => a.rank - b.rank);
  }

  /** 获取所有工具栏项 */
  getAllItems(): ToolbarItem[] {
    return Array.from(this.items.values());
  }

  update(): void { 
    this.fireOnDidChangeToolbar();
  }
}