import { injectable, ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { LabelProviderContribution } from '@capital/core';
import { FilePropertyProvider } from '@capital/core/filesystem';
import { MagicApiResourceContribution, ResourceRegistry } from '@capital/core/magic-api';
import { RabbitMQPropertyProvider } from './rabbitmq-property-provider';
import { RabbitMQResourceLabelProvider } from './rabbitmq-label-provider';

@injectable()
class MagicApiRabbitMQResourceWidget implements MagicApiResourceContribution{

  registerResource(registry: ResourceRegistry): void {
    registry.registerResource({
      type: "rabbitmq",
      label: "RabbitMQ"
    })
  }
}

const MagicApiRabbitMQResourceModule = new ContainerModule(
  (bind: any) => {
  bind(MagicApiRabbitMQResourceWidget).toSelf().inSingletonScope();
  bind(MagicApiResourceContribution).toService(MagicApiRabbitMQResourceWidget);

  // 绑定属性提供者
  bind(FilePropertyProvider).to(RabbitMQPropertyProvider).inSingletonScope();
  bind(LabelProviderContribution).to(RabbitMQResourceLabelProvider).inSingletonScope();
})
// 注册容器模块到插件中心
regContainerModule(MagicApiRabbitMQResourceModule);