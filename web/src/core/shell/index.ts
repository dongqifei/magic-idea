import { interfaces } from 'inversify';
import { ApplicationShellLayout } from './application-shell'
import { ToolbarService } from "./toolbar/toolbar-types";
import { DefaultToolbarService } from "./toolbar/toolbar-service";

export * from './application-shell';
export * from './shell-layout-restorer';
export * from './toolbar/toolbar-types';
export * from './current-widget-command-adapter';
export * from './tab-bars';
export * from './tab-bar-toolbar';
export * from './view-contribution';

/**
 * 绑定状态栏接口依赖
 * @param bind 
 */
export function bindAppliconShellModule(bind: interfaces.Bind): void {
    // 绑定应用布局
    bind(ApplicationShellLayout).toSelf().inSingletonScope();
    // 绑定工具栏服务
    bind(ToolbarService).to(DefaultToolbarService).inSingletonScope();
}
