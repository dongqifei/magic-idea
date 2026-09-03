import { injectable, inject } from "@capital/shared/inversify";
import { Resource, ResourceLabelProvider } from '@capital/core/magic-api';
import { RocketMQResourceMetaData } from "./types";

@injectable()
export class RocketMQResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return RocketMQResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: RocketMQResourceMetaData): string | undefined {
    return "#e37933";
  }

  getIcon(node: RocketMQResourceMetaData): string | undefined {
    return "ROCKETMQ";
  }
}