import * as React from "react";
import { CommandRegistry } from "@lumino/commands";
import { ToolbarService } from "./toolbar-types";
/** 工具栏根组件（依赖注入版） */
export declare const ToolbarView: React.FC<{
    toolbarService: ToolbarService;
    commandRegistry: CommandRegistry;
}>;
/** 无依赖注入的纯 UI 组件（供 ReactWidget 使用） */
export declare const ToolbarViewPure: (props: {
    toolbarService: ToolbarService;
    commandRegistry: CommandRegistry;
}) => import("react/jsx-runtime").JSX.Element;
