import { interfaces } from 'inversify';
export * from './storage-service';
/**
 * 绑定本地储存接口依赖
 * @param bind
 */
export declare function bindStorageModule(bind: interfaces.Bind): void;
