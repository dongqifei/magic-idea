import { interfaces } from 'inversify';
export * from './statusbar-types';
export * from './statusbar-service';
export * from './statusbar-widget';
/**
 * 绑定状态栏接口依赖
 * @param bind
 */
export declare function bindStatusBar(bind: interfaces.Bind): void;
