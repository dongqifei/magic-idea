import { injectable, inject } from "@capital/shared/inversify";
import { Resource, ResourceLabelProvider } from '@capital/core/magic-api';
import { RabbitMQResourceMetaData } from "./types";

@injectable()
export class RabbitMQResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return RabbitMQResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: RabbitMQResourceMetaData): string | undefined {
    return "#609928";
  }

  getIcon(node: RabbitMQResourceMetaData): string | undefined {
    return "RABBITMQ";
  }
}