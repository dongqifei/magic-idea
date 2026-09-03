import { interfaces } from 'inversify';
import { QuickInputUILumino } from "./components/quick-input-ui";
import { QuickCommandContribution } from "./contribution/quick-command-contribution";
export * from './quick-input-types';
export * from "./quick-input-service";
export * from "./quick-access-registry";
export { QuickInputUILumino };
export { QuickCommandContribution };
/**
 * 绑定状态栏接口依赖
 * @param bind
 */
export declare function bindQuickInputModule(bind: interfaces.Bind): void;
