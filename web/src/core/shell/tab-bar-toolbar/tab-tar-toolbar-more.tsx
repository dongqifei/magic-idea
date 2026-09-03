import * as React from "react";
import { codicon } from "../../widgets";
import { TabBarToolbar } from "./tab-bar-toolbar";
import { Widget } from "@lumino/widgets";

interface TabBarToolbarMoreProps {
  current: Widget | undefined;
  isMore: boolean;
  inline: any[]; // 建议使用更具体的类型替代 any
  onShowMoreContextMenu: (e: React.MouseEvent) => void;
}

export const TabBarToolbarMore: React.FC<TabBarToolbarMoreProps> = ({
  current,
  isMore,
  inline,
  onShowMoreContextMenu
}) => {
  return (
    <>
      {inline.map((item, index) => (
        <React.Fragment key={index}>
          {item.render(current)}
        </React.Fragment>
      ))}
      {isMore && (
        <div
          key="__more__"
          className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} enabled`}
        >
          <div
            id="__more__"
            className={codicon("ellipsis", true)}
            onClick={onShowMoreContextMenu}
            title={"More Actions..."}
            style={{ cursor: "pointer" }} // 添加指针样式表明可点击
          />
        </div>
      )}
    </>
  );
};