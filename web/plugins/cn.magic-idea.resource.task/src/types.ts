import { FileData } from "@capital/core/filesystem";
import { isObject } from "@capital/core/common";

export interface TaskResourceMetaData extends FileData {
  enabled: boolean;
  cron: string;
  description: string;
}
export namespace TaskResourceMetaData {
  export function is(node: unknown): node is TaskResourceMetaData {
    if (!isObject(node)) return false;

    return (
      ("type" in node &&
        node.type === "task" &&
        "groupId" in node &&
        !!node.groupId) ||
      ("id" in node && "enabled" in node && "cron" in node)
    );
  }
}
