import React, { useRef, useLayoutEffect } from "react";
import { ConsoleLogSourceType, MagicLogItem } from "./console-widget";
import "./console-view.less";

export const MagicConsoleComponent: React.FC<{
  logs: MagicLogItem[];
  onToggleShowMore: any;
  sourceType?: ConsoleLogSourceType;
}> = ({ logs, onToggleShowMore, sourceType }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs.length]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const visibleLogs = sourceType
    ? logs.filter((item) => item.sourceType === sourceType)
    : logs;

  return (
    <div className="magic-console-wrapper" ref={containerRef}>
      {visibleLogs.length === 0 && (
        <div className="console-empty">暂无日志输出</div>
      )}

      {visibleLogs.length > 0 && (
        <div
          className="console-logs h-full w-full"
          onContextMenu={(e) => handleContextMenu(e)}
        >
          {visibleLogs.map((item, index) => (
            <div
              key={`run_log_${index}`}
              className={`log-item ${item.multiple ? "multiple" : ""} ${item.showMore ? "more" : ""}`}
              onContextMenu={(e) => handleContextMenu(e)}
            >
              <pre
                dangerouslySetInnerHTML={{ __html: item.html }}
                style={{
                  lineHeight: "20px",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  ...(item.multiple &&
                    !item.showMore && {
                      maxHeight: "60px",
                      overflow: "hidden",
                    }),
                }}
              />

              {item.multiple && (
                <span
                  className="log-toggle"
                  onClick={() => onToggleShowMore(item.id)}
                  style={{
                    opacity: 0.5,
                    fontSize: "13px",
                    textDecoration: "underline",
                    cursor: "pointer",
                    display: "block",
                    marginTop: "2px",
                  }}
                >
                  {item.showMore
                    ? "点击隐藏多行日志"
                    : `有 ${item.lines} 行日志被隐藏 点击显示`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};