import { MarkerSeverity, IEvent } from '@MagicIdea/core/common';
import URI from '@MagicIdea/core/common/uri';

/**
 * 标记数据结构（与Monaco Marker对齐）
 */
export interface Marker {
  id: string; // 唯一标识
  resource: URI; // 资源URI
  resourceId: string; // 资源ID（用于分组）
  severity: MarkerSeverity; // 严重程度（使用Monaco枚举）
  message: string; // 错误信息
  startLineNumber: number; // 起始行
  startColumn: number; // 起始列
  endLineNumber: number; // 结束行
  endColumn: number; // 结束列
  source?: string; // 来源（如linter名称）
}

/**
 * 标记服务接口
 */
export interface MarkerService {
  onDidChangeMarkers: IEvent<Marker[]>;
  getMarkers(): Marker[];
  getMarkersForResource(resourceId: string): Marker[];
}

export const MarkerService = Symbol('MarkerService');

/**
 * 标记面板组件属性
 */
export interface MarkerPanelProps {
  markers: Marker[];
  activeResourceId: string | undefined;
  onMarkerClick: (marker: Marker) => void;
}