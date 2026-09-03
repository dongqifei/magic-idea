import { injectable, inject } from "@capital/shared/inversify";
import { Resource, ResourceLabelProvider } from '@capital/core/magic-api';
import { MqttResourceMetaData } from "./types";

@injectable()
export class MqttResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return MqttResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: MqttResourceMetaData): string | undefined {
    return "#a074c4";
  }

  getIcon(node: MqttResourceMetaData): string | undefined {
    return "MQTT";
  }
}