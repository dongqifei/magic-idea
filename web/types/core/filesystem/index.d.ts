import { interfaces } from 'inversify';
export * from './file-system-types';
export * from './file-system-service';
export * from './file-persistence-service';
export * from './file-run-service';
/**
 * 绑定文件系统模块依赖
 * @param bind
 */
export declare function bindFileSystemModule(bind: interfaces.Bind): void;
