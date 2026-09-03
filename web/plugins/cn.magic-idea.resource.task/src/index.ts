import { injectable, ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { LabelProviderContribution } from '@capital/core';
import { FileRunServiceProvider, FilePropertyProvider } from '@capital/core/filesystem';
import { MagicApiResourceContribution, ResourceRegistry } from '@capital/core/magic-api';
import { TaskPropertyProvider } from './task-property-provider';
import { TaskResourceLabelProvider } from "./task-lable-provider";

@injectable()
class MagicApiTaskResourceWidget implements MagicApiResourceContribution{

  registerResource(registry: ResourceRegistry): void {
    registry.registerResource({
      type: "task",
      label: "定时任务"
    })
  }
}

const MagicApiTaskResourceModule = new ContainerModule(
  (bind: any) => {
  bind(MagicApiTaskResourceWidget).toSelf().inSingletonScope();
  bind(MagicApiResourceContribution).toService(MagicApiTaskResourceWidget);

  // 绑定属性提供者
  bind(FilePropertyProvider).to(TaskPropertyProvider).inSingletonScope();
  bind(LabelProviderContribution).to(TaskResourceLabelProvider).inSingletonScope();
})
// 注册容器模块到插件中心
regContainerModule(MagicApiTaskResourceModule);