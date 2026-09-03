import React, { useMemo, useCallback } from "react";
import { Tree, NodeRendererProps } from "react-arborist";
import { useResizeDetector } from "react-resize-detector";
import { Resource, ResourceNode, ResourceTreeNodeRendererProps, ResourceTreeProps, ResourceTreeNode } from "./magic-api-tree-types";
import { MagicApiUserAvatarsGroup } from './magic-api-user-avatar';
import { useOnlineUsers } from './hooks/use-online-users';

import "./magic-api-tree.css";

// 图标类名映射（使用readonly确保不可修改）
const IconMap = {
  folder: "codicon codicon-folder",
  file: "file-icon icon-defaule",
  alert: "codicon codicon-circle-slash",
  flame: "codicon codicon-flame",
  check: "codicon codicon-circle-large",
  dirty: "codicon codicon-circle-filled"
};

/**
 * 节点渲染函数
 */
const ApiNodeRenderer: React.FC<ResourceTreeNodeRendererProps<ResourceTreeNode>> = ({
  node,
  style,
  dragHandle,
  currentSelectedId,
  lastSelectedId,
  apiTreeWidget
}) => {
  const { getUsersByFileId } = useOnlineUsers(apiTreeWidget.onlineUserService);
  const onlineUsers = getUsersByFileId(node.id);

  // 获取文件状态数据，并合并到data中
  const [data, setData] = React.useState({ ...node.data.node });

  const isGroup = !!data.parentId;
  const isSelected = node.id === currentSelectedId;
  const isLastSelected = node.id === lastSelectedId;
  
  const isDragOver = node.willReceiveDrop;

  const isDropAllowed = useMemo(() => {
    if (!node.tree.dragNodes.length) return true;
    if (!isDragOver) return true;

    if (node.isRoot) {
      return !node.tree.dragNodes.some(n => !n.data.node.parentId);
    }
    return !!node.data.node.parentId;
  }, [isDragOver, node]);

  // 节点点击处理
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    node.select();
    if (isGroup) node.toggle();
    apiTreeWidget.openResource(data);
  }, [node, isGroup, apiTreeWidget, data]);

  // 分组展开/折叠处理
  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGroup) node.toggle();
  }, [node, isGroup]);

  const fileIconColor = apiTreeWidget.toNodeIconColor(data)
  const fileIcon = apiTreeWidget.toNodeIcon(data)

  let stylePaddingLeft = style.paddingLeft;
  if (typeof stylePaddingLeft === 'number' && stylePaddingLeft === 0) {
    stylePaddingLeft += 10;
  }

  return (
    <div
      ref={dragHandle}
      style={{ paddingLeft: stylePaddingLeft }}
      className={`tree-node 
        ${isGroup ? "group-node" : "leaf-node"} 
        ${isSelected ? "selected" : ""} 
        ${isLastSelected ? 'lastSelected' : ''} 
        ${isDragOver ? (isDropAllowed ? "drag-over-allowed" : "drag-over-denied") : ""}
      `}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        node.data.onContextMenu?.(data, e);
      }}
    >
      {/* 分组展开/折叠图标 */}
      {isGroup ? (
        <span
          className={`${node.isOpen ? "codicon codicon-chevron-down" : "codicon codicon-chevron-right"}`}
          onClick={handleToggleClick}
          style={{ 
            margin: "0 4px 0 4px", 
            cursor: "pointer" 
          }}
        />
      ) : (
        <span style={{ marginLeft: node.level === 1 ? 10 : 0 }}></span>
      )}

      {/* 节点图标 */}
      <div className="node-icon">
        <span
          className={`${isGroup ? IconMap.folder : 'magic-resource-icon'} ${data.type?.toLowerCase()}`}
          style={{ marginRight: isGroup ? "4px" : '2px', color: fileIconColor }}
        >{fileIcon}</span>
      </div>

      <div className="node-item">
        <span className="api-node-name">{data.name}</span>
        <span className="api-node-info">
          {data.path && <span className="api-path">({data.path})</span>}
        </span>
      </div>

      {/* 用户头像组 */}
      {onlineUsers.length > 0 && (
        <MagicApiUserAvatarsGroup
          users={onlineUsers}
          maxDisplay={2}
          size="small"
        />
      )}

      <div className="node-operate">
        {data.isDirty && <span className={`codicon ${IconMap.dirty}`}></span>}
      </div>
    </div>
  );
};

export const MagicApiWelcomeView: React.FC<{
  onCreateProject: () => void;
  onOpenExampleProject: () => void;
}> = ({onCreateProject, onOpenExampleProject}) => {
  return (
    <div className="welcome-view-content">
      <p>尚未打开项目，部分功能不可用。</p>
      <div className="button-container">
        <a className="magic-idea-button primary monaco-text-button" 
          role="button" 
          aria-disabled="false" 
          onClick={(e) => {
            e.preventDefault();
            onCreateProject();
          }}
          >
          <span>创建项目</span>
        </a>
      </div>
      <p>没有项目，可点击下方按钮查看官方示例项目。</p>
      <div className="button-container">
        <a className="magic-idea-button primary monaco-text-button" 
          role="button" 
          aria-disabled="false" 
          onClick={(e) => {
            e.preventDefault();
            onOpenExampleProject();
          }}
        >
          <span>示例项目</span>
        </a>
      </div>
      <p>
        若要详细了解如何在 Magic IDEA 中管理你的 magic-api 资源，
        <a className="monaco-link" href="#" role="button" aria-disabled="false">参阅我们的文档</a>。</p>
    </div>
  )
};

/**
 * 接口树主UI组件
 */
export const MagicApiResourceTree: React.FC<ResourceTreeProps> = ({
  currentSelectedId,
  lastSelectedId,
  resourceType,
  nodes,
  onTreeRefReady,
  onNodeContextMenu,
  onMoveNode,
  controller,
  apiTreeWidget
}) => {
  const { height: containerHeight, ref: containerRef } = useResizeDetector();
  const treeHeight = !containerHeight || containerHeight <= 0 ? 600 : containerHeight;

  const childrenAccessor = useMemo(
    () => (nodeData: ResourceTreeNode) => nodeData.children || null,
    []
  );

  // 处理节点回调
  const nodesWithCallbacks = useMemo(() => {
    const addCallbacks = (node: ResourceNode): ResourceTreeNode => {
      const nodeWithCb: ResourceTreeNode = {
        id: node.node.id,
        node: node.node,
        onContextMenu: (nodeData: Resource, e: React.MouseEvent) => {
          onNodeContextMenu?.(nodeData, e);
        },
      };

      if (node.children) {
        nodeWithCb.children = node.children.map(addCallbacks) || [];
      }

      return nodeWithCb;
    };

    return nodes.map(addCallbacks);
  }, [nodes, onNodeContextMenu]);

  const disableDrop = useCallback((args: { parentNode: any; dragNodes: any[] }) => {
    if (!args.dragNodes.length) return true;

    if (args.parentNode.isRoot) {
      return args.dragNodes.some(node => !node.data?.node?.parentId);
    }

    if (!args.parentNode.data?.node?.parentId) {
      return true;
    }

    return false;
  }, []);

  const handleMove = useCallback(({ dragIds, parentId }) => {
    if (dragIds?.length) {
      onMoveNode(dragIds[0], parentId);
    }
  }, [onMoveNode]);

  return (
    <div
      ref={containerRef}
      className="magic-api-tree"
      onClick={(e) => {
        e.stopPropagation();
        controller.setCurrentSelectionNode({
          id: "0",
          name: "root",
          type: resourceType
        });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onNodeContextMenu?.({
          id: "0",
          name: "root",
          type: resourceType
        }, e);
      }}
    >
      <Tree
        ref={view => {
          if (view) onTreeRefReady(view);
        }}
        className="tree-container"
        idAccessor="id"
        data={nodesWithCallbacks}
        childrenAccessor={childrenAccessor}
        height={treeHeight}
        width="100%"
        selection={currentSelectedId}
        indent={22}
        rowHeight={24}
        openByDefault={false}
        disableDrag={false}
        disableDrop={disableDrop}
        onMove={handleMove}
        overscanCount={1}
      >
        {(props: NodeRendererProps<ResourceTreeNode>) => (
          <ApiNodeRenderer
            {...props}
            apiTreeWidget={apiTreeWidget}
            currentSelectedId={currentSelectedId}
            lastSelectedId={lastSelectedId}
          />
        )}
      </Tree>
    </div>
  );
};