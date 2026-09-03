import VariablesTree from "./debug-variables-tree";

import "./debug-console-view.less";

interface DebugConsoleViewProps {
  isDebugging: boolean;
  breakpointInfo: any;
  expandedKeys: Record<string, boolean>;
  paginationState: Record<string, { page: number; loadedAll: boolean }>;
  handleDebugStep: (action: "step" | "continue" | "stop") => void;
  handleToggleExpand: (path: string) => void;
  handleLoadMore: (path: string) => void;
}

export const DebugConsoleView: React.FC<DebugConsoleViewProps> = ({
  breakpointInfo,
  expandedKeys,
  handleDebugStep,
  handleToggleExpand,
  handleLoadMore,
  paginationState,
  isDebugging,
}) => {
  return (
    <div className="debug-console-view">
      <div className="debug-header">
        <div className="debug-location">变量信息</div>
        <ul className="debug-toolbar">
          <li
            className={`debug-toolbar-button codicon codicon-debug-continue continue action-label ${
              isDebugging ? "disabled" : ""
            }`}
            title="继续"
            onClick={() => handleDebugStep("continue")}
          ></li>
          <li
            className={`debug-toolbar-button codicon codicon-debug-step-over step-into action-label ${
              isDebugging ? "disabled" : ""
            }`}
            title="单步执行"
            onClick={() => handleDebugStep("step")}
          />
        </ul>
        {breakpointInfo && (
          <>
            <div className="debug-location">
              <span className="debug-frame-icon codicon codicon-circle-filled" />
              <span className="debug-frame-title">
                断点位置： 行 {breakpointInfo.range[0]}, 列{" "}
                {breakpointInfo.range[1]}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="debug-content">
        {breakpointInfo ? (
          <VariablesTree
            data={breakpointInfo.variables}
            expandedKeys={expandedKeys}
            onToggleExpand={handleToggleExpand}
            paginationState={paginationState}
            onLoadMore={handleLoadMore}
          />
        ) : (
          <div className="debug-welcome">
            {isDebugging ? "等待断点..." : "调试未启动"}
          </div>
        )}
      </div>
    </div>
  );
};
