import React from "react";
import { Dropdown, MenuProps } from "antd";
import { parseJavaMapString } from "../utils";
import { Variable } from "../run-debug-typs";

interface VariablesTreeProps {
  data: Variable[];
  depth?: number;
  expandedKeys: Record<string, boolean>;
  onToggleExpand: (path: string) => void;
  parentPath?: string;
  // 新增分页状态
  paginationState?: Record<string, { page: number; loadedAll: boolean }>;
  onLoadMore?: (path: string) => void;
}

const PAGE_SIZE = 50; // 每页加载的条数

const VariablesTree: React.FC<VariablesTreeProps> = ({
  data,
  depth = 0,
  expandedKeys,
  onToggleExpand,
  parentPath = "",
  paginationState = {},
  onLoadMore = () => {},
}) => {
  const isExpandable = (variable: Variable) => {
    if (Array.isArray(variable.value)) {
      return variable.value.length > 0;
    }
    if (typeof variable.value === "object" && variable.value !== null) {
      return Object.keys(variable.value).length > 0;
    }
    return false;
  };

  const renderVariableValue = (variable: Variable) => {
    if (variable.value === null) return "null";
    if (variable.value === undefined) return "undefined";

    if (Array.isArray(variable.value)) {
      return `[${variable.value.length}]`;
    }

    if (typeof variable.value === "object") {
      return `{${Object.keys(variable.value).length}}`;
    }

    if (typeof variable.value === "string") {
      const trimmedValue = variable.value.trim();

      if (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) {
        try {
          const parsedObject = parseJavaMapString(trimmedValue);
          return JSON.stringify(parsedObject);
        } catch (e) {
          console.warn("Failed to parse Java Map string:", e);
        }
      }

      return `"${variable.value}"`;
    }

    return String(variable.value);
  };

  const getContextMenuItems = (variable: Variable): MenuProps["items"] => [
    {
      key: "copy-name",
      label: "复制名称",
      onClick: () => navigator.clipboard.writeText(variable.name),
    },
    {
      key: "copy-value",
      label: "复制值",
      onClick: () =>
        navigator.clipboard.writeText(renderVariableValue(variable)),
    },
  ];

  // 获取当前路径的分页状态
  const getPaginationState = (path: string) => {
    return paginationState[path] || { page: 1, loadedAll: false };
  };

  // 渲染子项时应用分页
  const renderPaginatedChildren = (variable: Variable, currentPath: string) => {
    const children = renderVariableChildren(variable);
    const { page, loadedAll } = getPaginationState(currentPath);
    
    // 如果是数组且未加载全部，则只渲染部分数据
    if (Array.isArray(variable.value) && !loadedAll) {
      return children.slice(0, page * PAGE_SIZE);
    }
    
    return children;
  };

  return (
    <div className={`variables-tree variables-tree-${depth}`}>
      {data.map((variable) => {
        const currentPath = parentPath
          ? `${parentPath}.${variable.name}`
          : variable.name;
        const expandable = isExpandable(variable);
        const expanded = expandedKeys[currentPath];
        const { page, loadedAll } = getPaginationState(currentPath);
        const isArray = Array.isArray(variable.value);
        const totalItems = isArray ? variable.value.length : Object.keys(variable.value || {}).length;

        return (
          <div key={`${depth}-${variable.name}`} className="variable-node">
            <Dropdown
              menu={{ items: getContextMenuItems(variable) }}
              trigger={["contextMenu"]}
            >
              <div
                className="variable-header"
                onClick={() => expandable && onToggleExpand(currentPath)}
              >
                {expandable ? (
                  <span className={`variable-icon ${expanded ? "codicon codicon-chevron-down" : "codicon codicon-chevron-right"}`} />
                ) : (
                  <span className="variable-icon-spacer" />
                )}
                <span className="variable-name">{variable.name}</span>
                <span className="variable-equals">=</span>
                <span className="variable-type">{variable.type}</span>
                <span className="variable-value">
                  {renderVariableValue(variable)}
                </span>
              </div>
            </Dropdown>

            {expandable && expanded && (
              <div className="variable-children">
                <VariablesTree
                  data={renderPaginatedChildren(variable, currentPath)}
                  depth={depth + 1}
                  expandedKeys={expandedKeys}
                  onToggleExpand={onToggleExpand}
                  parentPath={currentPath}
                  paginationState={paginationState}
                  onLoadMore={onLoadMore}
                />
                {isArray && !loadedAll && page * PAGE_SIZE < totalItems && (
                  <div className="load-more-container">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onLoadMore(currentPath);
                      }}
                    >
                      ... (单击查看更多数据 {Math.min(page * PAGE_SIZE, totalItems)}/{totalItems})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  function renderVariableChildren(variable: Variable): Variable[] {
    if (Array.isArray(variable.value)) {
      return variable.value.map((item, index) => ({
        name: `[${index}]`,
        type: typeof item,
        value: item,
      }));
    }

    if (typeof variable.value === "object" && variable.value !== null) {
      return Object.entries(variable.value).map(([key, value]) => ({
        name: key,
        type: typeof value,
        value,
      }));
    }

    return [];
  }
};

export default VariablesTree;