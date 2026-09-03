import { interfaces } from 'inversify';
import { QuickInputServiceImpl } from "./quick-input-service";
import { QuickInputService, QuickInputUI } from "./quick-input-types";
import { QuickInputUILumino } from "./components/quick-input-ui";
import { QuickAccessProvider, QuickAccessRegistry } from "./quick-access-registry";
import { QuickCommandContribution } from "./contribution/quick-command-contribution";
import { HelpQuickAccessProvider } from './provider/command-view-provider'

// 接口导出
export * from './quick-input-types';
// 实现导出（供DI绑定）
export * from "./quick-input-service";
export * from   "./quick-access-registry";
export { QuickInputUILumino };
export { QuickCommandContribution };


/**
 * 绑定状态栏接口依赖
 * @param bind 
 */
export function bindQuickInputModule(bind: interfaces.Bind): void {
    // 绑定快速输入服务
    bind(QuickInputService).to(QuickInputServiceImpl).inSingletonScope();
    // 绑定Lumino贡献
    bind(QuickCommandContribution).toSelf().inSingletonScope();
    // 绑定Lumino贡献
    bind(QuickInputUI).to(QuickInputUILumino).inSingletonScope();
    // 绑定快速访问注册表
    bind(QuickAccessRegistry).toSelf().inSingletonScope();
    bind(QuickAccessProvider).to(HelpQuickAccessProvider).inSingletonScope();
}
