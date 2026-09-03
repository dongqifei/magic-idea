import { CommandRegistry } from "@lumino/commands";
import { Emitter, IEvent } from "../../common";
import { ToolbarService, ToolbarItemOptions, ToolbarItem, ToolbarAlignment } from "./toolbar-types";
export declare class DefaultToolbarService implements ToolbarService {
    private commandRegistry;
    /** 存储所有工具栏项（key: itemId） */
    private items;
    protected readonly onDidChangeToolBarEmitter: Emitter<void>;
    get onDidChangeToolbar(): IEvent<void>;
    constructor(commandRegistry: CommandRegistry);
    /**
     * 发送状态栏变化事件
     */
    protected fireOnDidChangeToolbar(): void;
    /** 注册工具栏项 */
    registerItem(options: ToolbarItemOptions): void;
    /** 移除工具栏项 */
    unregisterItem(itemId: string): void;
    /** 获取指定位置的工具栏项（按 rank 排序） */
    getItemsByAlignment(alignment: ToolbarAlignment): ToolbarItem[];
    /** 获取所有工具栏项 */
    getAllItems(): ToolbarItem[];
    update(): void;
}
