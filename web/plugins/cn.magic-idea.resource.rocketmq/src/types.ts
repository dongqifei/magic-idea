import { FileData } from "@capital/core/filesystem";
import { isObject } from '@capital/core/common';

export interface RocketMQResourceMetaData extends FileData{
  topic: string;
  tag: string;
  enabled: boolean;
  description: string;
}
export namespace RocketMQResourceMetaData {
  export function is(node: unknown): node is RocketMQResourceMetaData {
    if (!isObject(node)) return false;

    return (
      ("type" in node &&
        node.type === "rocketmq" &&
        "groupId" in node &&
        !!node.groupId) ||
      ("id" in node &&
        "enabled" in node &&
        "topic" in node &&
        "tag" in node)
    );
  }
}