import { injectable, ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { LabelProviderContribution } from '@capital/core';
import { FilePropertyProvider } from '@capital/core/filesystem';
import { MagicApiResourceContribution, ResourceRegistry } from '@capital/core/magic-api';
import { RocketMQPropertyProvider } from './rocketmq-property-provider';
import { RocketMQResourceLabelProvider } from './rocketmq-lable-provider';

@injectable()
class MagicApiRocketMQResourceWidget implements MagicApiResourceContribution{

  registerResource(registry: ResourceRegistry): void {
    registry.registerResource({
      type: "rocketmq",
      label: "RocketMQ"
    })
  }
}

const MagicApiRocketMQResourceModule = new ContainerModule(
  (bind: any) => {
  bind(MagicApiRocketMQResourceWidget).toSelf().inSingletonScope();
  bind(MagicApiResourceContribution).toService(MagicApiRocketMQResourceWidget);

  // 绑定属性提供者
  bind(FilePropertyProvider).to(RocketMQPropertyProvider).inSingletonScope();
  bind(LabelProviderContribution).to(RocketMQResourceLabelProvider).inSingletonScope();
})
// 注册容器模块到插件中心
regContainerModule(MagicApiRocketMQResourceModule);
