import { interfaces } from 'inversify';
import { bindContributionProvider, CommandContribution, PreferenceContribution, FrontendApplicationContribution, WidgetFactory } from '@MagicIdea/core';
import { ChatAgent, ChatAgentRecommendationService } from '@MagicIdea/ai-chat/common';
import { Agent, AIVariableContribution, bindToolProvider } from '@MagicIdea/ai-core/common';
import { ArchitectAgent } from './architect-agent';
import { CoderAgent } from './coder-agent';
import { AskAgent } from './ask-agent';
import { AgentModeConfirmationService, AgentModeConfirmationServiceImpl } from './agent-mode-confirmation-service';
import { aiIdePreferenceSchema } from './common/ai-ide-preferences';
import { MagicApiPromptContribution } from './magicapi-prompt-contribution';
import { ContextFilesVariableContribution } from './common/context-files-variable';
import {
    FileContentFunction
} from './workspace-functions';
import {
    bindViewContribution,
} from '@MagicIdea/core/shell';
import { TabBarToolbarContribution } from '@MagicIdea/core/shell/tab-bar-toolbar';
import {
    WriteFileContent
} from './file-changeset-functions';
import { ContextFileValidationService } from '@MagicIdea/ai-chat/context-file-validation-service';
import { ContextFileValidationServiceImpl } from './context-file-validation-service-impl';
import { AIConfigurationSelectionService } from './ai-configuration/ai-configuration-service';
import { AIAgentConfigurationViewContribution } from './ai-configuration/ai-configuration-view-contribution';
import { AIConfigurationContainerWidget } from './ai-configuration/ai-configuration-widget';
import { AIAgentConfigurationWidget } from './ai-configuration/agent-configuration-widget';
import { ModelAliasesConfigurationWidget } from './ai-configuration/model-aliases-configuration-widget';
import { AIToolsConfigurationWidget } from './ai-configuration/tools-configuration-widget';
import { AIMCPConfigurationWidget } from './ai-configuration/mcp-configuration-widget';
// import { ProjectInfoAgent } from './project-info-agent';

import './style/index.less';

import { TestSystemFunction } from './test-funtion';

export function bingAIIdeModule(bind: interfaces.Bind){

  bind(PreferenceContribution).toConstantValue({ schema: aiIdePreferenceSchema });

  bind(AgentModeConfirmationServiceImpl).toSelf().inSingletonScope();
  bind(AgentModeConfirmationService).toService(AgentModeConfirmationServiceImpl);

  bind(AIVariableContribution).to(ContextFilesVariableContribution).inSingletonScope();

  // bind(ArchitectAgent).toSelf().inSingletonScope();
  // bind(Agent).toService(ArchitectAgent);
  // bind(ChatAgent).toService(ArchitectAgent);

  bind(AskAgent).toSelf().inSingletonScope();
  bind(Agent).toService(AskAgent);
  bind(ChatAgent).toService(AskAgent);

  // bind(CoderAgent).toSelf().inSingletonScope();
  // bind(Agent).toService(CoderAgent);
  // bind(ChatAgent).toService(CoderAgent);

  // bind(ProjectInfoAgent).toSelf().inSingletonScope();
  // bind(Agent).toService(ProjectInfoAgent);
  // bind(ChatAgent).toService(ProjectInfoAgent);

  // bindToolProvider(TestSystemFunction, bind)
  bindToolProvider(FileContentFunction, bind);
  // bindToolProvider(WriteFileContent, bind);

  bind(ContextFileValidationServiceImpl).toSelf().inSingletonScope();
  bind(ContextFileValidationService).toService(ContextFileValidationServiceImpl);

  bind(AIConfigurationSelectionService).toSelf().inSingletonScope();
  bind(AIConfigurationContainerWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: AIConfigurationContainerWidget.ID,
      createWidget: () => ctx.container.get(AIConfigurationContainerWidget),
    }))
    .inSingletonScope();

  bind(AIAgentConfigurationWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: AIAgentConfigurationWidget.ID,
      createWidget: () => ctx.container.get(AIAgentConfigurationWidget),
    }))
    .inSingletonScope();

  bind(AIToolsConfigurationWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: AIToolsConfigurationWidget.ID,
      createWidget: () => ctx.container.get(AIToolsConfigurationWidget),
    }))
    .inSingletonScope();
      
  bind(AIMCPConfigurationWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: AIMCPConfigurationWidget.ID,
      createWidget: () => ctx.container.get(AIMCPConfigurationWidget),
    }))
    .inSingletonScope();

  bind(ModelAliasesConfigurationWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: ModelAliasesConfigurationWidget.ID,
      createWidget: () => ctx.container.get(ModelAliasesConfigurationWidget),
    }))
    .inSingletonScope();

  bindViewContribution(bind, AIAgentConfigurationViewContribution);
  bind(TabBarToolbarContribution).toService(AIAgentConfigurationViewContribution);

  // 注册magic-api 以及 magic-script 语法规范
  bind(FrontendApplicationContribution).to(MagicApiPromptContribution).inSingletonScope();
  // bind(FrntendApplicationContribution).to(MagicScriptPromptContribution).inSingletonScope();
}