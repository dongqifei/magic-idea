import React from "react";
import { DatasourceResourceMetaData } from "./magic-api-tree-types";
import "./magic-api-datasource-views.less";
export const MagicApiDatasourceView = (props: {
  datasourceData: DatasourceResourceMetaData[];
  isLoading?: boolean;
  error?: string | null;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  const { datasourceData, isLoading, onDelete, onEdit } = props;
  return (
    <>
      {!isLoading ? (
        <div className="magic-progress-container"></div>
      ) : (
        <div className="magic-database-content">
          {datasourceData.length === 0 && (
            <div className="magic-database-welcome">暂无数据源</div>
          )}
          <div className="database-list">
            {datasourceData.length > 0 && datasourceData.map((item) => (
              <div className="database-item" key={item.key}>
                <div className="database-item-icon">
                  <span className="codicon codicon-database"></span>
                </div>
                <div className="database-item-title">
                  <span className="database-item-name">{item.name}</span>
                  <span className="database-item-key">
                    ({item.key || "default"})
                  </span>
                </div>
                {item.id && (
                  <div className="database-item-actions">
                    <span
                      className="action-label codicon codicon-edit"
                      title="编辑"
                      onClick={() => onEdit(item.id)}
                    ></span>
                    <span
                      className="action-label codicon codicon-trash"
                      title="删除"
                      onClick={() => onDelete(item.id)}
                    ></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
