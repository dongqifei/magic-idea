import { interfaces } from 'inversify';
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
export declare function bindAppliconShellModule(bind: interfaces.Bind): void;
