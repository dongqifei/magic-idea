// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************
import { CommandContribution } from '@MagicIdea/core/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { bindRootContributionProvider } from '@MagicIdea/core/common';
import {
    RemoteConnectionProvider,
    ServiceConnectionProvider,
} from '@MagicIdea/core/browser/messaging/service-connection-provider';
import { DefaultLanguageModelAliasRegistry } from './frontend-language-model-alias-registry';
import { interfaces } from 'inversify';
import { LanguageModelAliasRegistry } from './common/language-model-alias';
import { AICommandHandlerFactory, AICommandHandler } from './ai-command-handler-factory';
import {
    AIVariableContribution,
    AIVariableService,
    ToolInvocationRegistry,
    ToolInvocationRegistryImpl,
    LanguageModelDelegateClient,
    languageModelDelegatePath,
    LanguageModelFrontendDelegate,
    LanguageModelProvider,
    LanguageModelRegistry,
    LanguageModelRegistryClient,
    languageModelRegistryDelegatePath,
    LanguageModelRegistryFrontendDelegate,
    PromptFragmentCustomizationService,
    PromptService,
    PromptServiceImpl,
    ToolProvider,
    TokenUsageService,
    TOKEN_USAGE_SERVICE_PATH,
    TokenUsageServiceClient,
    // AIVariableResourceResolver,
    Agent,
    FrontendLanguageModelRegistry
} from './common';
import {
    FrontendLanguageModelRegistryImpl,
    LanguageModelDelegateClientImpl,
} from './frontend-language-model-registry';
import { FrontendApplicationContribution, LabelProviderContribution } from '@MagicIdea/core';
import { AICoreFrontendApplicationContribution } from './ai-core-frontend-application-contribution';
import { bindAICorePreferences } from './common/ai-core-preferences';
import { AISettingsServiceImpl } from './ai-settings-service';
import { DefaultFrontendVariableService, FrontendVariableService } from './frontend-variable-service';
import { FileVariableContribution } from './file-variable-contribution';
import { TodayVariableContribution } from './common/today-variable-contribution';
import { AgentService, AgentServiceImpl } from './common/agent-service';
import { AISettingsService } from './common/settings-service';
import { PromptVariableContribution } from './prompt-variable-contribution';
import { ProductNameVariableContribution } from './product-name-variable-contribution';
import { CapabilityVariableContribution } from './common/capability-variable-contribution';
import { GenericCapabilitiesVariableContribution } from './generic-capabilities-variable-contribution';
import { GenericCapabilitiesPromptFragmentContribution } from './generic-capabilities-prompt-fragment-contribution';
import { LanguageModelService } from './common/language-model-service';
import { FrontendLanguageModelServiceImpl } from './frontend-language-model-service';
import { TokenUsageFrontendService } from './token-usage-frontend-service';
import { TokenUsageFrontendServiceImpl, TokenUsageServiceClientImpl } from './token-usage-frontend-service-impl';
export function bindAICoreModule(bind: interfaces.Bind): void { 
    bindRootContributionProvider(bind, Agent);
    bindRootContributionProvider(bind, LanguageModelProvider);

    bind(FrontendLanguageModelRegistryImpl).toSelf().inSingletonScope();
    bind(FrontendLanguageModelRegistry).toService(FrontendLanguageModelRegistryImpl);
    bind(LanguageModelRegistry).toService(FrontendLanguageModelRegistryImpl);

    bind(LanguageModelDelegateClientImpl).toSelf().inSingletonScope();
    bind(LanguageModelDelegateClient).toService(LanguageModelDelegateClientImpl);
    bind(LanguageModelRegistryClient).toService(LanguageModelDelegateClient);

    bind(LanguageModelRegistryFrontendDelegate).toDynamicValue(
        ctx => {
            const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
            const client = ctx.container.get<LanguageModelRegistryClient>(LanguageModelRegistryClient);
            return connection.createProxy<LanguageModelRegistryFrontendDelegate>(languageModelRegistryDelegatePath, client);
        }
    );

    bind(LanguageModelFrontendDelegate)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
            const client = ctx.container.get<LanguageModelDelegateClient>(LanguageModelDelegateClient);
            return connection.createProxy<LanguageModelFrontendDelegate>(languageModelDelegatePath, client);
        })
        .inSingletonScope();

    bindAICorePreferences(bind);

    bind(PromptServiceImpl).toSelf().inSingletonScope();
    bind(PromptService).toService(PromptServiceImpl);

    bind(AISettingsServiceImpl).toSelf().inSingletonScope();
    bind(AISettingsService).toService(AISettingsServiceImpl);

    bindRootContributionProvider(bind, AIVariableContribution);
    bind(DefaultFrontendVariableService).toSelf().inSingletonScope();
    bind(FrontendVariableService).toService(DefaultFrontendVariableService);
    bind(AIVariableService).toService(FrontendVariableService);
    bind(FrontendApplicationContribution).toService(FrontendVariableService);

    bind(PromptVariableContribution).toSelf().inSingletonScope();
    bind(AIVariableContribution).toService(PromptVariableContribution);
    bind(AIVariableContribution).to(TodayVariableContribution).inSingletonScope();
    bind(AIVariableContribution).to(FileVariableContribution).inSingletonScope();
    bind(AIVariableContribution).to(CapabilityVariableContribution).inSingletonScope();
    bind(AIVariableContribution).to(ProductNameVariableContribution).inSingletonScope();

    bind(GenericCapabilitiesVariableContribution).toSelf().inSingletonScope();
    bind(AIVariableContribution).toService(GenericCapabilitiesVariableContribution);

    bind(GenericCapabilitiesPromptFragmentContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(GenericCapabilitiesPromptFragmentContribution);

    bind(FrontendApplicationContribution).to(AICoreFrontendApplicationContribution).inSingletonScope();

    bind(ToolInvocationRegistry).to(ToolInvocationRegistryImpl).inSingletonScope();
    bindRootContributionProvider(bind, ToolProvider);

    bind(AgentServiceImpl).toSelf().inSingletonScope();
    bind(AgentService).toService(AgentServiceImpl);

    bind(AICommandHandlerFactory).toFactory<AICommandHandler>(context => (handler: AICommandHandler) => {
        return {
            execute: (args: ReadonlyPartialJSONObject) => handler.execute(args),
            label: handler.label,
            iconClass: handler.iconClass || '',
            isEnabled: (args: ReadonlyPartialJSONObject) => (handler.isEnabled?.(args) ?? true),
            isVisible: (args: ReadonlyPartialJSONObject) => (handler.isVisible?.(args) ?? true),
            isToggled: (args: ReadonlyPartialJSONObject) => (handler.isToggled?.(args) ?? false)
        };
    });

    bind(FrontendLanguageModelServiceImpl).toSelf().inSingletonScope();
    bind(LanguageModelService).toService(FrontendLanguageModelServiceImpl);

    bind(TokenUsageFrontendService).to(TokenUsageFrontendServiceImpl).inSingletonScope();
    bind(TokenUsageServiceClient).to(TokenUsageServiceClientImpl).inSingletonScope();

    bind(DefaultLanguageModelAliasRegistry).toSelf().inSingletonScope();
    bind(LanguageModelAliasRegistry).toService(DefaultLanguageModelAliasRegistry);

    bind(TokenUsageService).toDynamicValue(ctx => {
        const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        const client = ctx.container.get<TokenUsageServiceClient>(TokenUsageServiceClient);
        return connection.createProxy<TokenUsageService>(TOKEN_USAGE_SERVICE_PATH, client);
    }).inSingletonScope();
}
