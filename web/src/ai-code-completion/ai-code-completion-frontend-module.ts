import { interfaces } from 'inversify';
import { FrontendApplicationContribution } from "@MagicIdea/core";
import { PreferenceContribution } from '@MagicIdea/core/preferences/preference-contribution';
import { Agent, AIVariableContribution } from '@MagicIdea/ai-core';

import { AICodeCompletionPreferencesSchema } from "./ai-code-completion-preference";
import { AICodeInlineCompletionsProvider } from './code-inline-completion-provider';
import { CodeCompletionAgent, CodeCompletionAgentImpl } from './code-completion-agent';
import { CodeCompletionPostProcessor, DefaultCodeCompletionPostProcessor } from './code-completion-postprocessor';
import { CodeCompletionVariableContribution } from './code-completion-variable-contribution';
import { AIFrontendApplicationContribution } from "./ai-code-frontend-application-contribution";

export const bindCodeCompletionAgentModule = (bind: interfaces.Bind) => {
    // 代码补全智能体
    bind(CodeCompletionAgentImpl).toSelf().inSingletonScope();
    bind(CodeCompletionAgent).toService(CodeCompletionAgentImpl);
    bind(Agent).toService(CodeCompletionAgentImpl);
    bind(AICodeInlineCompletionsProvider).toSelf().inSingletonScope();
    bind(CodeCompletionPostProcessor).to(DefaultCodeCompletionPostProcessor).inSingletonScope();
    bind(AIVariableContribution).to(CodeCompletionVariableContribution).inSingletonScope();

    bind(AIFrontendApplicationContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).to(AIFrontendApplicationContribution);
    
    // 绑定ai助手偏好配置
    bind(PreferenceContribution).toConstantValue({ schema: AICodeCompletionPreferencesSchema });
}