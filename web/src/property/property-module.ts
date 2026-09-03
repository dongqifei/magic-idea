import { interfaces } from 'inversify';
import { UndoRedoHandler } from '@MagicIdea/core/undo-redo/undo-redo-handler';
import { PropertyManager } from './property-manager';
import { PropertyEditorService } from './property-service';
import { PropertyEditorUndoRedoHandler } from "./property-undo-redo-handler";
/**
 * 绑定文件属性配置模块接口依赖
 * @param bind 
 */
export function bindPropertyModule(bind: interfaces.Bind): void {
  // 绑定服务层（单例）
  bind(PropertyEditorService).to(PropertyEditorService).inSingletonScope();
  bind(PropertyManager).toSelf().inSingletonScope();
  bind(PropertyEditorUndoRedoHandler).toSelf().inSingletonScope();
  bind(UndoRedoHandler).toService(PropertyEditorUndoRedoHandler);
}
