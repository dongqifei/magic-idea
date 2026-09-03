import { interfaces } from 'inversify';
import { bindContributionProvider } from "../common/contribution-provider";
import {
  UndoRedoHandler,
  UndoRedoHandlerService,
  DomInputUndoRedoHandler,
} from "./undo-redo-handler";
import { UndoRedoService } from './undo-redo-service';

export * from './undo-redo-handler';
export * from './undo-redo-service';

/**
 * 绑定撤销重做模块依赖
 * @param bind 
 */
export function bindUndoRedoModule(bind: interfaces.Bind): void {
    // 注册撤销重做服务
    bind(UndoRedoService).toSelf().inSingletonScope();
    bind(UndoRedoHandlerService).toSelf().inSingletonScope();
    bindContributionProvider(bind, UndoRedoHandler);
    bind(DomInputUndoRedoHandler).toSelf().inSingletonScope();
    bind(UndoRedoHandler).toService(DomInputUndoRedoHandler);
}
