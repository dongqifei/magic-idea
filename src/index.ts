import "reflect-metadata";
import {
  Container,
  ContainerModule,
} from "inversify";
import { ConnectionHandler, RpcConnectionHandler } from './core/common';
import { KeyStoreService, keyStoreServicePath } from './core/common/key-store';
import { KeyStoreServiceImpl } from './core/key-store-server';
import { bindRootContributionProvider } from "./core/common/contribution-provider";
import { bindNodeStopwatch, bindBackendStopwatchServer } from './core/performance/measurement-backend-bindings';
import { BackendApplication, BackendApplicationContribution, BackendApplicationServer } from './core/backend-application';
import { bindMessagingBackendModule } from './core/messaging/messaging-backend-module';
import { WsRequestValidator, WsRequestValidatorContribution } from './core/ws-request-validators';
import { bindAICoreConnectionModule } from './ai-core/ai-core-backend-module';
import { bindCopilotBackendModule } from './ai-copilot/copilot-backend-module';
import { bindOpenAIBackendModule } from './ai-openai/openai-backend-module';
import { bindAnthropicBackendModule } from './ai-anthropic/anthropic-backend-module';
import { bindRequestBackendModule } from './core/request/backend-request-module';
import { EnvVariablesServer, envVariablesPath } from './core/common/env-variables';
import { EnvVariablesServerImpl } from './core/env-variables';

// 创建容器实例
const container = new Container();

export const backendApplicationModule = new ContainerModule(bind => {
  // bind(Container).toConstantValue(container);
  bind(BackendApplication).toSelf().inSingletonScope();
  bindRootContributionProvider(bind, BackendApplicationContribution);
  // Bind the BackendApplicationServer as a BackendApplicationContribution
  // and fallback to an empty contribution if never bound.
  bind(BackendApplicationContribution).toDynamicValue(ctx => {
    if (ctx.container.isBound(BackendApplicationServer)) {
      return ctx.container.get(BackendApplicationServer);
    } else {
      console.warn('no BackendApplicationServer is set, frontend might not be available');
      return {};
    }
  }).inSingletonScope();

  // Bind the BackendApplicationServer as a BackendApplicationContribution
  bindMessagingBackendModule(bind);
  // Bind the RequestService
  bindRequestBackendModule(bind);

  bind(WsRequestValidator).toSelf().inSingletonScope();
  bindRootContributionProvider(bind, WsRequestValidatorContribution);

  bind(KeyStoreService).to(KeyStoreServiceImpl).inSingletonScope();
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new RpcConnectionHandler(keyStoreServicePath, () => ctx.container.get<KeyStoreService>(KeyStoreService))
  ).inSingletonScope();

  bind(EnvVariablesServer).to(EnvVariablesServerImpl).inSingletonScope();
  bind(ConnectionHandler).toDynamicValue(ctx =>
    new RpcConnectionHandler(envVariablesPath, () => {
      const envVariablesServer = ctx.container.get<EnvVariablesServer>(EnvVariablesServer);
      return envVariablesServer;
    })
  ).inSingletonScope();

  // Bind AI Core Backend Module
  bindAICoreConnectionModule(bind);

  // Bind AI Copilot Backend Module
  bindCopilotBackendModule(bind);

  // Bind AI OpenAI Backend Module
  bindOpenAIBackendModule(bind);

  // Bind AI Anthropic Backend Module
  bindAnthropicBackendModule(bind);

  bindNodeStopwatch(bind);
  bindBackendStopwatchServer(bind);
})
container.load(backendApplicationModule);

export const app = container.get<BackendApplication>(BackendApplication);
app.start(13579, '0.0.0.0');