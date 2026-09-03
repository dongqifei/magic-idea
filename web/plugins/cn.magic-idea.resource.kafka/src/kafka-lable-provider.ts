import { injectable, inject } from "@capital/shared/inversify";
import { Resource, ResourceLabelProvider } from '@capital/core/magic-api';
import { KafkaResourceMetaData } from "./types";

@injectable()
export class KafkaResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return KafkaResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: KafkaResourceMetaData): string | undefined {
    return "#a2852f";
  }

  getIcon(node: KafkaResourceMetaData): string | undefined {
    return "KAFKA";
  }
}