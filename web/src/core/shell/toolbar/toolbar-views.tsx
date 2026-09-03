import * as React from "react";
import { CommandRegistry } from "@lumino/commands";
import { ToolbarService } from "./toolbar-types";

/** 工具栏根组件（依赖注入版） */
export const ToolbarView: React.FC<{
  toolbarService: ToolbarService;
  commandRegistry: CommandRegistry;
}> = ({ toolbarService, commandRegistry }) => {

  // 渲染指定位置的工具栏项
  const renderToolbarColumn = (alignment: string) => {
    const items = toolbarService.getItemsByAlignment(alignment);
    return (
      <div className={`toolbar-column ${alignment}`}>
        {items.map((item) => renderToolbarItem(item))}
      </div>
    );
  };

  // 渲染单个工具栏项
  const renderToolbarItem = (item: any) => {
    // 优先使用自定义渲染
    if (item.render) {
      return (
        <div key={item.id} className={`toolbar-item ${item.className || ""}`}>
          {item.render()}
        </div>
      );
    }

    // 基于命令 ID 渲染默认按钮
    if (!item.commandId) return null;
    // 获取命令标签（支持动态标签）
    const label = commandRegistry.label(item.commandId);

    if (!label) return null;
    // 获取命令状态（启用/禁用）
    const isEnabled = commandRegistry.isEnabled(item.commandId);
    // 获取命令图标（支持 codicon 类名）
    const iconClass = commandRegistry.iconClass(item.commandId);
    // 获取命令点击处理
    const handleClick = () => commandRegistry.execute(item.commandId);
    return (
      <div
        key={item.id}
        className={`toolbar-item ${item.className || ""}`}
        onClick={isEnabled ? handleClick : undefined}
        title={ label }
      >
        <div className={`item ${isEnabled ? "enabled" : "disabled"}`}>
          {iconClass ? (
            <div className={`codicon ${iconClass} action-label`}></div>
          ) : (
            <div className="action-label">{label}</div>
          )}
        </div>
        <div className="hover-overlay"></div>
      </div>
    );
  };

  return (
    <div className="toolbar-wrapper">
      {renderToolbarColumn("left")}
      {renderToolbarColumn("right")}
      {/* 支持扩展其他位置的列 */}
    </div>
  );
};

/** 无依赖注入的纯 UI 组件（供 ReactWidget 使用） */
export const ToolbarViewPure = (props: {
  toolbarService: ToolbarService;
  commandRegistry: CommandRegistry;
}) => <ToolbarView {...props} />;