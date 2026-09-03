
export namespace CommonCommands {
  export const FILE_CATEGORY = 'File';
  export const VIEW_CATEGORY = 'View';

  // 创建项目
  export const NEW_PROJECT = { id: "magic-api.new-project", label: "新建项目" };
  export const OPEN_PROJECT = { id: "magic-api.open-projects", label: "打开最近的项目" };
  export const SAVE = { id: "core.save", label: "保存" };
  export const SAVE_ALL = { id: "core.saveAll", label: "全部保存" };
  export const AUTO_SAVE = { id: "core.autoSave", label: "自动保存" };

  export const UNDO = { id: "core.undo", label: "撤销" }; // 撤销命令
  export const REDO = { id: "core.redo", label: "恢复" }; // 重做命令

  export const CLOSE_TAB = { id: "core.closeTab", label: "关闭" };
  export const CLOSE_OTHER_TABS = { id: "core.close.other.tabs", label: "关闭其他" };
  export const CLOSE_RIGHT_TABS = { id: "core.close.right.tabs", label: "关闭右侧标签页" };
  export const CLOSE_LEFT_TABS = { id: "core.close.left.tabs", label: "关闭左侧标签页" };
  export const CLOSE_SAVED_TABS = { id: "workbench.action.closeUnmodifiedEditors", label: "关闭已保存" };
  export const CLOSE_ALL_TABS = { id: "core.close.all.tabs", label: "全部关闭" };
}