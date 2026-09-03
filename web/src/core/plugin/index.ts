import { interfaces } from 'inversify';
import { PluginManager } from './plugin-manager';
import { PluginLoader } from './plugin-loader';

export * from './plugin-loader';
export * from './plugin-manager';
export * from './plugin-types';
export * from './reg'

/**
 * 绑定系统插件模块接口依赖
 * @param bind 
 */
export function bindPluginModule(bind: interfaces.Bind): void {
    bind(PluginManager).to(PluginManager).inSingletonScope();
    bind(PluginLoader).to(PluginLoader).inSingletonScope();
}
