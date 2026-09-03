import { interfaces } from 'inversify';
export * from './undo-redo-handler';
export * from './undo-redo-service';
/**
 * 绑定撤销重做模块依赖
 * @param bind
 */
export declare function bindUndoRedoModule(bind: interfaces.Bind): void;
