import { interfaces } from 'inversify';
export * from './plugin-loader';
export * from './plugin-manager';
export * from './plugin-types';
export * from './reg';
/**
 * 绑定系统插件模块接口依赖
 * @param bind
 */
export declare function bindPluginModule(bind: interfaces.Bind): void;
