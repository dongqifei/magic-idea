import React, { useState, useMemo } from "react";
import { Marker, MarkerPanelProps } from "./markers-types";
import { MarkerSeverity } from "monaco-editor";
import { UUID } from '@lumino/coreutils';
import "./markers.css";

/**
 * 严重程度图标组件
 */
const SeverityIcon: React.FC<{ severity: MarkerSeverity }> = ({ severity }) => {
  switch (severity) {
    case MarkerSeverity.Error:
      return <span className="codicon codicon-error error" />;
    case MarkerSeverity.Warning:
      return <span className="codicon codicon-warning warning" />;
    case MarkerSeverity.Info:
      return <span className="codicon codicon-info info" />;
    default:
      return <span className="codicon codicon-question" />;
  }
};

/**
 * 单个标记项组件
 */
const MarkerItem: React.FC<{
  marker: Marker;
  isActive: boolean;
  onMarkerClick: (marker: Marker) => void;
}> = ({ marker, isActive, onMarkerClick }) => (
  <div
    className={`marker-item ${isActive ? "active-resource" : ""}`}
    onClick={() => onMarkerClick(marker)}
    title={marker.message} // hover显示完整信息
  >
    <SeverityIcon severity={marker.severity} />
    <div className="marker-message">{marker.message}</div>
    <div className="marker-location">
      Line {marker.startLineNumber}:{marker.startColumn}
    </div>
  </div>
);

/**
 * 资源分组组件（带展开折叠功能）
 */
const ResourceGroup: React.FC<{
  resourceId: string;
  markers: Marker[];
  activeResourceId?: string;
  onMarkerClick: (marker: Marker) => void;
  isExpanded: boolean;
  onToggle: (resourceId: string) => void;
}> = ({ resourceId, markers, activeResourceId, onMarkerClick, isExpanded, onToggle }) => {
  return (
    <div className="marker-group">
      <div className="marker-group-items">
          {markers.map((marker) => (
            <MarkerItem
              key={marker.id + "_" + UUID.uuid4()}
              marker={marker}
              isActive={marker.resourceId === activeResourceId}
              onMarkerClick={onMarkerClick}
            />
          ))}
        </div>
    </div>
  );
};

/**
 * 空状态组件
 */
const EmptyState: React.FC = () => (
  <div className="marker-empty">
    <span>当前代码未检测到问题</span>
  </div>
);

/**
 * 标记面板主组件（带展开折叠控制）
 */
export const MarkerPanel: React.FC<MarkerPanelProps> = ({
  markers,
  activeResourceId,
  onMarkerClick,
}) => {
  // 1. 按资源分组
  const groupedMarkers = useMemo(() => {
    return markers.reduce<Record<string, Marker[]>>(
      (groups, marker) => {
        const groupKey = marker.resourceId;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(marker);
        return groups;
      },
      {}
    );
  }, [markers]);

  // 2. 展开状态管理：key=resourceId，value=是否展开
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  React.useEffect(() => { 
    // 激活资源变化时，展开对应分组
    setExpandedStates((prev) => {
      const newStates = { ...prev };
      Object.keys(groupedMarkers).forEach((resourceId) => {
        newStates[resourceId] = resourceId === activeResourceId ? true : newStates[resourceId];
      });
      return newStates;
    });
  }, [markers, activeResourceId]);

  // 3. 单个分组展开/折叠切换
  const handleToggleGroup = (resourceId: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId],
    }));
  };

  // 空状态处理
  if (markers.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="marker-view">
      {/* 分组列表 */}
      <div className="marker-list">
        {Object.entries(groupedMarkers).map(([resourceId, groupMarkers]) => (
          <ResourceGroup
            key={resourceId + "_" + UUID.uuid4()}
            resourceId={resourceId}
            markers={groupMarkers}
            activeResourceId={activeResourceId}
            onMarkerClick={onMarkerClick}
            isExpanded={expandedStates[resourceId]} // 传递展开状态
            onToggle={handleToggleGroup} // 传递切换事件
          />
        ))}
      </div>
    </div>
  );
};