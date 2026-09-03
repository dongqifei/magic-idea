import { CommandRegistry } from '@lumino/commands';
import { interfaces } from 'inversify';
export * from "./command-palette-type";
export * from "./command-types";
export { CommandRegistry };
export type CommandFunc<T> = (...args: any[]) => T;
/**
 * 绑定接口依赖
 * @param bind
 */
export declare function bindCommandsModule(bind: interfaces.Bind): void;
