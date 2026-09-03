import { FileData } from "@capital/core/filesystem";
import { isObject } from '@capital/core/common';

export interface MqttResourceMetaData extends FileData{
  topic: string;
  qos: string;
  enabled: boolean;
  description: string;
}
export namespace MqttResourceMetaData {
  export function is(node: unknown): node is MqttResourceMetaData {
    if (!isObject(node)) return false;

    return (
      ("type" in node &&
        node.type === "mqtt" &&
        "groupId" in node &&
        !!node.groupId) ||
      ("id" in node &&
        "enabled" in node &&
        "topic" in node &&
        "qos" in node)
    );
  }
}