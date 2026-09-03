import { ReactElement, useState } from "react";
import "./tabs.css";

// 选项卡面板类型：将 key 改为 tabKey，避免和 React 特殊属性冲突
export interface TabPaneProps {
  tab: string; // 标签名称
  children: ReactElement | ReactElement[];
  tabKey: string; // 替代 key 的唯一标识（自定义属性）
}

// 选项卡容器类型
interface TabsProps {
  defaultActiveKey?: string; // 默认激活的标签key
  activeKey?: string; // 受控激活key
  onChange?: (key: string) => void; // 标签切换回调
  children: ReactElement<TabPaneProps>[]; // 子面板
}

// 选项卡面板子组件：不再使用 key，改用 tabKey
export const TabPane = ({ tab, children, tabKey }: TabPaneProps): ReactElement => {
  return <div className="tab-pane" role="tabpanel" data-key={tabKey}>{children}</div>;
};

// 选项卡容器主组件
export const Tabs = ({
  defaultActiveKey = "",
  activeKey: propActiveKey,
  onChange,
  children,
}: TabsProps): ReactElement => {
  // 获取所有面板的 tabKey，作为默认激活值
  const paneKeys = children.map(pane => pane.props.tabKey);
  // 非受控/受控模式兼容
  const [innerActiveKey, setInnerActiveKey] = useState<string>(
    propActiveKey || defaultActiveKey || (paneKeys[0] || "")
  );
  const activeKey = propActiveKey || innerActiveKey;

  // 标签切换处理
  const handleTabClick = (key: string) => {
    if (key === activeKey) return;
    // 非受控模式更新内部状态
    if (!propActiveKey) setInnerActiveKey(key);
    // 触发外部回调
    onChange && onChange(key);
  };

  return (
    <div className="tabs-container">
      {/* 标签栏：遍历 tabKey，添加唯一 key */}
      <div className="tabs-nav">
        {children.map((pane) => {
          const { tabKey, tab } = pane.props;
          const isActive = tabKey === activeKey;
          // 给每个标签项添加唯一 key（使用 tabKey）
          return (
            <div
              key={tabKey}
              className={`tabs-nav-item ${isActive ? "active" : ""}`}
              onClick={() => handleTabClick(tabKey)}
              role="tab"
              aria-selected={isActive}
            >
              {tab}
            </div>
          );
        })}
      </div>
      {/* 面板内容：遍历 tabKey，添加唯一 key */}
      <div className="tabs-content">
        {children.map((pane) => {
          const { tabKey } = pane.props;
          const isActive = tabKey === activeKey;
          // 给每个面板项添加唯一 key（使用 tabKey）
          return (
            <div
              key={tabKey}
              className={`tabs-content-item ${isActive ? "active" : ""}`}
              style={{ display: isActive ? "block" : "none" }}
            >
              {pane}
            </div>
          );
        })}
      </div>
    </div>
  );
};