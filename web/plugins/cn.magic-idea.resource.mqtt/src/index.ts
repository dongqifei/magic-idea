import { injectable, ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { LabelProviderContribution } from '@capital/core';
import { FilePropertyProvider } from '@capital/core/filesystem';
import { MagicApiResourceContribution, ResourceRegistry } from '@capital/core/magic-api';
import { MqttPropertyProvider } from './mqtt-property-provider';
import { MqttResourceLabelProvider } from './mqtt-lable-provider';

@injectable()
class MagicApiMqttResourceWidget implements MagicApiResourceContribution{

  registerResource(registry: ResourceRegistry): void {
    registry.registerResource({
      type: "mqtt",
      label: "MQTT"
    })
  }
}

const MagicApiMqttResourceModule = new ContainerModule(
  (bind: any) => {
  bind(MagicApiMqttResourceWidget).toSelf().inSingletonScope();
  bind(MagicApiResourceContribution).toService(MagicApiMqttResourceWidget);

  // 绑定属性提供者
  bind(FilePropertyProvider).to(MqttPropertyProvider).inSingletonScope();
  bind(LabelProviderContribution).to(MqttResourceLabelProvider).inSingletonScope();
})
// 注册容器模块到插件中心
regContainerModule(MagicApiMqttResourceModule);
