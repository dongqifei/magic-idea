import { interfaces } from "inversify";
import { bindContributionProvider } from '@MagicIdea/core/common';
import { MagicApiConstantsService } from "./magic-api-constants-service"
import { MagicApiServerService } from "./magic-api-server-service";
import { MagicApiSocketService } from "./magic-api-socket-service";
import { MagicApiClientService } from "./magic-api-client-service";
import { MagicApiOnlineUserService } from "./magic-api-online-user-service";
import { LabelProviderContribution } from '../label-provider';
import { MagicApiTreeModel } from './magic-api-tree-model';
import { MagicApiProjectService, MagicApiProjectServiceImpl } from './magic-api-project-service';

import { ResourceRegistry, MagicApiResourceService } from './magic-api-resource-service';
import { MagicApiResourceContribution, DefaultMagicApiResourceContribution } from './magic-api-resource-contribution';
import { MagicApiLabelProviderContribution } from './magic-api-label-provider-contribution';

import JavaClass from "@MagicIdea/core/magic-api/language/magic-script/editor/java-class";

export * from "./magic-api-constants-service";
export * from "./magic-api-server-service";
export * from "./magic-api-types";
export * from "./magic-api-socket-service";
export * from "./magic-api-online-user-service"
export * from './magic-api-resource-service';
export * from './magic-api-resource-contribution';
export * from "./magic-api-client-service";
export * from "./magic-api-resource-label-provider";
export * from "./magic-api-tree-model";

export { JavaClass };

export function bindMagicApiModule(bind: interfaces.Bind): void {
  bind(MagicApiTreeModel).toSelf().inSingletonScope();

  bind(MagicApiLabelProviderContribution).toSelf().inSingletonScope();
  bind(LabelProviderContribution).toService(MagicApiLabelProviderContribution);

  bind(MagicApiProjectService).to(MagicApiProjectServiceImpl).inSingletonScope();
  bind(MagicApiClientService).toSelf().inSingletonScope();
  bind(MagicApiConstantsService).toSelf().inSingletonScope();
  bind(MagicApiServerService).toSelf().inSingletonScope();
  // 绑定socket服务
  bind(MagicApiSocketService).toSelf().inSingletonScope();
  bind(MagicApiOnlineUserService).toSelf().inSingletonScope();

  // 绑定MagicApi偏好配置
  // bind(PreferenceContribution).toConstantValue({ schema: MagicApiPreferencesSchema });

  bind(DefaultMagicApiResourceContribution).toSelf();
  bindContributionProvider(bind, MagicApiResourceContribution);
  bind(MagicApiResourceContribution).toService(DefaultMagicApiResourceContribution);

  bind(ResourceRegistry).to(MagicApiResourceService).inSingletonScope();
}