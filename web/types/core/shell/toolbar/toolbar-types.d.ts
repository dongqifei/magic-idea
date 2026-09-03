import { CommandRegistry } from "@lumino/commands";
import { ReactNode } from "react";
import { IEvent as Event } from "../../common";
/** 工具栏位置（支持扩展自定义位置） */
export type ToolbarAlignment = "left" | "right" | string;
/** 工具栏项配置 */
export interface ToolbarItemOptions {
    /** 唯一标识 */
    id: string;
    /** 关联的命令 ID（与 CommandRegistry 对应） */
    commandId?: string;
    /** 位置（默认 left） */
    alignment?: ToolbarAlignment;
    /** 排序权重（数值越小越靠前） */
    rank?: number;
    /** 自定义渲染（优先级高于 commandId 对应的默认渲染） */
    render?: () => ReactNode;
    /** 是否可见（默认 true） */
    isVisible?: (commandRegistry: CommandRegistry) => boolean;
    /** 自定义类名 */
    className?: string;
}
/** 工具栏项实例 */
export interface ToolbarItem extends ToolbarItemOptions {
    /** 计算后的排序权重 */
    rank: number;
    /** 默认可见性处理 */
    isVisible: (commandRegistry: CommandRegistry) => boolean;
}
/** 工具栏服务接口 */
export declare const ToolbarService: unique symbol;
export interface ToolbarService {
    onDidChangeToolbar: Event<void>;
    /** 注册工具栏项 */
    registerItem(options: ToolbarItemOptions): void;
    /** 移除工具栏项 */
    unregisterItem(itemId: string): void;
    /** 获取指定位置的工具栏项（已排序） */
    getItemsByAlignment(alignment: ToolbarAlignment): ToolbarItem[];
    /** 获取所有工具栏项 */
    getAllItems(): ToolbarItem[];
    update(): void;
}
