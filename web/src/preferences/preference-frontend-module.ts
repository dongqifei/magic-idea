import { injectable, interfaces } from "inversify";
import { PreferenceTreeGenerator } from "./utils/preference-tree-generator";
import { PreferenceLayoutProvider } from "./utils/preference-layout";
import { PreferenceWidget } from "./preference-widget";

export function bindPreferencesFrontendModule(bind: interfaces.Bind): void {
  bind(PreferenceWidget).toSelf().inSingletonScope();
  bind(PreferenceLayoutProvider).toSelf().inSingletonScope();
  bind(PreferenceTreeGenerator).toSelf().inSingletonScope();
}
