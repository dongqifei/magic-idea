import { FileData } from "@capital/core/filesystem";
import { isObject } from '@capital/core/common';

/**
 * RabbitMQ 资源元数据类型
 */
export interface RabbitMQResourceMetaData extends FileData {
  name: string;
  queue: string;
  exchange: string;
  exchangeType: 'direct' | 'topic' | 'fanout' | 'headers';
  routingKey: string;
  enabled: boolean;
  description: string;
  path?: string;
}

export namespace RabbitMQResourceMetaData {
  export function is(node: unknown): node is RabbitMQResourceMetaData {
    if (!isObject(node)) return false;

    return (
      ("type" in node &&
        node.type === "rabbitmq" &&
        "exchange" in node &&
        !!node.exchange) ||
      ("id" in node &&
        "enabled" in node &&
        "queue" in node &&
        "exchange" in node &&
        "exchangeType" in node &&
        "routingKey" in node)
    );
  }
}