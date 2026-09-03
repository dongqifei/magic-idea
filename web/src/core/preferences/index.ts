import { injectable, interfaces } from "inversify";
import { bindContributionProvider } from "../common/contribution-provider";
import { PreferenceService } from "./preference-service";
import { PreferenceSchemaService, PreferenceSchemaServiceImpl } from "./preference-schema-service";
import {
  PreferenceProvider,
  DefaultsPreferenceProvider,
  BrowserPreferenceProvider,
} from "./preference-provider";
import { PreferenceImportExportService } from "./preference-import-export";
import { PreferenceContribution } from "./preference-contribution";
import { PreferenceScope } from "./preference-types";

export * from "./preference-types";
export * from "./preference-service";
export * from "./preference-schema-service";
export * from "./preference-provider";
export * from "./preference-contribution";

export function bindPreferencesModule(bind: interfaces.Bind): void {
  bind(PreferenceService).toSelf().inSingletonScope();
  bind(PreferenceSchemaServiceImpl).toSelf().inSingletonScope();
  bind(PreferenceSchemaService).toService(PreferenceSchemaServiceImpl);
  bind(PreferenceImportExportService).toSelf().inSingletonScope();

  // 绑定PreferenceProviders（必须是常量值数组）
  bind(PreferenceProvider)
    .to(DefaultsPreferenceProvider)
    .inSingletonScope()
    .whenTargetNamed(PreferenceScope.Default);
  bind(PreferenceProvider)
    .to(BrowserPreferenceProvider)
    .inSingletonScope()
    .whenTargetNamed(PreferenceScope.User);
  bindContributionProvider(bind, PreferenceProvider);

  bindContributionProvider(bind, PreferenceContribution);
}
