import { injectable, ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { LabelProviderContribution } from '@capital/core';
import { FilePropertyProvider } from '@capital/core/filesystem';
import { MagicApiResourceContribution, ResourceRegistry } from '@capital/core/magic-api';
import { KafkaPropertyProvider } from './kafka-property-provider';
import { KafkaResourceLabelProvider } from './kafka-lable-provider';

@injectable()
class MagicApiKafkaResourceWidget implements MagicApiResourceContribution{

  registerResource(registry: ResourceRegistry): void {
    registry.registerResource({
      type: "kafka",
      label: "Kafka"
    })
  }
}

const MagicApiKafkaResourceModule = new ContainerModule(
  (bind: any) => {
  bind(MagicApiKafkaResourceWidget).toSelf().inSingletonScope();
  bind(MagicApiResourceContribution).toService(MagicApiKafkaResourceWidget);

  // 绑定属性提供者
  bind(FilePropertyProvider).to(KafkaPropertyProvider).inSingletonScope();
  bind(LabelProviderContribution).to(KafkaResourceLabelProvider).inSingletonScope();
})
// 注册容器模块到插件中心
regContainerModule(MagicApiKafkaResourceModule);
