import { FileData } from "@capital/core/filesystem";
import { isObject } from "@capital/core/common";

export interface KafkaResourceMetaData extends FileData {
  topic: string;
  group: string;
  enabled: boolean;
  description: string;
}

export namespace KafkaResourceMetaData {
  export function is(node: unknown): node is KafkaResourceMetaData {
    if (!isObject(node)) return false;

    return (
      ("type" in node &&
        node.type === "kafka" &&
        "groupId" in node &&
        !!node.groupId) ||
      ("id" in node && "enabled" in node && "topic" in node && "group" in node)
    );
  }
}
