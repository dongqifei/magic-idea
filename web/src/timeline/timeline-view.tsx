import * as React from "react";
import { codicon } from "@MagicIdea/core";
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TimelineItem } from "./timeline-model";
import './timeline-view.less'

// 行渲染组件（必须接收 react-window 约定的 props）
const TimelineItemRow = ({ index, style, data }: ListChildComponentProps<{ items: TimelineItem[], activeVersionId?: number, openDiffEditor?: (item: TimelineItem) => void }>) => {
  const item = data.items[index];
  if (!item) return null;

  let iconString: string = codicon('circle');
  const { label, description, timestamp, icon } = item;
  if (icon && typeof icon === "string") {
    iconString = codicon(icon);
  }

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffInMs = now - timestamp;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 5) return '刚刚';
    if (diffInSeconds < 60) return `${diffInSeconds} 秒前`;
    if (diffInMinutes < 60) return `${diffInMinutes} 分钟前`;
    if (diffInHours < 24) return `${diffInHours} 小时前`;
    if (diffInDays < 7) return `${diffInDays} 天前`;
    if (diffInDays < 30) { // 1~4周
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} 周前`;
    }
    // 30天及以上，按月份
    const months = Math.floor(diffInDays / 30);
    if (months < 12) return `${months} 个月前`;
    const years = Math.floor(diffInDays / 365);
    return `${years} 年前`;
  };

  const selected = data.activeVersionId === timestamp;

  return (
    <div 
      style={style} 
      className={`timeline-item ${selected ? 'timeline-item-selected' : ''}`}
      onClick={() => data.openDiffEditor && data.openDiffEditor(item)}
    >
      <span className={`${iconString} timeline-item-icon`} />
      <div className="timeline-item-content">
        <span className="timeline-item-label">{label}</span>
        <span className="timeline-item-description">{description}</span>
      </div>
      <div className="timeline-timestamp-container">
        <span className="timeline-timestamp">{getRelativeTime(timestamp)}</span>
      </div>
    </div>
  );
};

export const TimelineListView: React.FC<{
  loading: boolean;
  items: TimelineItem[];
  open: (item: TimelineItem) => void;
}> = (props) => {
  const listRef = React.useRef<List>(null);
  const [activeVersionId, setActiveVersionId] = React.useState<number>();

  if (props.loading) {
    return (
      <div className="timeline-list-view-loading">
        <div className="loading-container magic-progress-container"></div>
      </div>
    );
  }

  if (props.items.length === 0) {
    return (
      <div className="timeline-outer-container">
        <div className="empty-container">
          <span>暂无历史版本</span>
        </div>
      </div>
    );
  }

  const openDiffEditor = (item: TimelineItem)=>{
    // item.timestamp => 版本号
    setActiveVersionId(item.timestamp);
    props.open?.(item)
  }

  return (
    <div className="timeline-outer-container">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            itemCount={props.items.length}
            itemSize={() => 22}
            width={width}
            itemData={{ items: props.items, activeVersionId, openDiffEditor }}   // 传递数据给行组件
          >
            {TimelineItemRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};