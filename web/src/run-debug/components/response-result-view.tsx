import React, { useState, useRef, useEffect } from "react";
import { RunResult } from "../run-debug-typs";
import { ResponseBodyView } from "./response-body-view";
import "./response-result-view.less";

// 表格形式展示响应头
const HeaderTable = ({
  headers,
}: {
  headers: Record<string, string | number | boolean | undefined> | undefined;
}) => {
  // 转换响应头为数组格式
  const responseHeaders: {
    key: string;
    value: string | number | boolean | undefined;
  }[] = Object.entries(headers || {}).map(([key, value]) => ({
    key,
    value,
  }));
  if (!headers || headers.length === 0) {
    return <div className="empty-state">暂无响应头数据</div>;
  }

  return (
    <table className="header-table">
      <thead>
        <tr>
          <th>参数名</th>
          <th>参数值</th>
        </tr>
      </thead>
      <tbody>
        {responseHeaders.map((header, index) => (
          <tr key={index}>
            <td className="key-cell">{header.key}</td>
            <td className="value-cell">{header.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// 主视图组件
export const ResponseResultView: React.FC<{
  activeResult: RunResult | undefined;
}> = ({ activeResult }) => {
  // 标签页状态
  const [activeTab, setActiveTab] = useState<"body" | "header" | "example">(
    "body"
  );

  return (
    <div className="run-result-view" style={{ height: "100%" }}>
      {/* 标签页切换（重构布局，增加右侧工具栏） */}
      <div className="tab-container">
        <div className="tab-nav">
          <div
            className={`tab-btn ${activeTab === "body" ? "active" : ""}`}
            onClick={() => setActiveTab("body")}
          >
            实时响应
          </div>
          <div
            className={`tab-btn ${activeTab === "header" ? "active" : ""}`}
            onClick={() => setActiveTab("header")}
          >
            响应头
          </div>
        </div>
      </div>

      {/* 内容展示区 - 确保有高度 */}
      <div
        className="content-area"
        style={{ height: "calc(100% - 40px)", overflow: "hidden" }}
      >
        <div
          style={{
            display: activeTab === "body" ? "block" : "none",
            height: "100%",
            overflow: "auto",
          }}
        >
          <ResponseBodyView result={activeResult} />
        </div>
        <div
          style={{
            display: activeTab === "header" ? "block" : "none",
            height: "100%",
            overflow: "auto",
          }}
        >
          <HeaderTable headers={activeResult?.responseHeaders} />
        </div>
      </div>
    </div>
  );
};
