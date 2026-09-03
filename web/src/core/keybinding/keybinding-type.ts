export interface Keybinding {
  command: string; // 关联命令ID
  keybinding: string; // 按键组合（如 'ctrl+delete'、'mac:cmd+delete'）
  when?: string; // 激活条件表达式（如 'isGroupNodeSelected && !isLoading'）
}