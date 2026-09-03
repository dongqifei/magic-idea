import { PreferenceContribution } from '@capital/core/preferences';
import { ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { CommandContribution } from '@capital/core/commands';
import { EmbeddedAgentWidget } from './embedded-agent-widget';
import { EmbeddedAgentPreferencesSchema } from './embedded-agent-preference';

const AIEmbeddedAgentModule = new ContainerModule(
  (bind: any) => {
  bind(EmbeddedAgentWidget).toSelf().inSingletonScope();

  bind(CommandContribution).toService(EmbeddedAgentWidget);
  bind(PreferenceContribution).toConstantValue({ schema: EmbeddedAgentPreferencesSchema });
})

// 注册容器模块到插件中心 
regContainerModule(AIEmbeddedAgentModule);