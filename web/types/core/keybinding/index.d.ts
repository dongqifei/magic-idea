import { interfaces } from 'inversify';
export * from './keybinding-registry';
export * from './keybinding-type';
export * from '../context-key-service';
/**
 * 绑定快捷键服务接口依赖
 * @param bind
 */
export declare function bindCommandKeybindModule(bind: interfaces.Bind): void;
