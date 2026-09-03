export namespace EditorCommands {
  const EDITOR_CATEGORY = "Editor";

  export const SPLIT_EDITOR_RIGHT = {
    id: "workbench.action.splitEditorRight",
    category: EDITOR_CATEGORY,
    label: "Split Editor Right",
  };

  export const SPLIT_EDITOR_DOWN = {
    id: "workbench.action.splitEditorDown",
    category: EDITOR_CATEGORY,
    label: "Split Editor Down",
  };

  export const SPLIT_EDITOR_UP = {
    id: "workbench.action.splitEditorUp",
    category: EDITOR_CATEGORY,
    label: "Split Editor Up",
  };

  export const SPLIT_EDITOR_LEFT = {
    id: "workbench.action.splitEditorLeft",
    category: EDITOR_CATEGORY,
    label: "Split Editor Left",
  };

  /**
   * Default horizontal split: right.
   */
  export const SPLIT_EDITOR_HORIZONTAL = {
    id: "workbench.action.splitEditor",
    label: "Split Editor",
  };

  /**
   * Default vertical split: down.
   */
  export const SPLIT_EDITOR_VERTICAL = {
    id: "workbench.action.splitEditorOrthogonal",
    label: "Split Editor Orthogonal",
  };
}
