/**
 * Property service
 */
import { injectable, inject } from "inversify";
import { UndoRedoService } from "@MagicIdea/core/undo-redo/undo-redo-service";
import URI from "@MagicIdea/core/common/uri";
import { Emitter } from "@MagicIdea/core/common";
import { FileData } from "@MagicIdea/core/filesystem/file-system-types";

/** 属性修改的上下文（区分不同组件和字段） */
export interface PropertyChangeContext {
  uri: URI; // 关联的资源 URI
  fieldKey: string; // 字段唯一标识（如 'name'、'tags'、'table_1'）
  oldValue: any; // 修改前的值
  newValue: any; // 修改后的值
}

@injectable()
export class PropertyEditorService {

  private readonly onDidUpdatedPropertyEmitter = new Emitter<Partial<FileData>>();
  public readonly onPropertyUpdatedEvent = this.onDidUpdatedPropertyEmitter.event;

  constructor(
    @inject(UndoRedoService) private readonly undoRedoService: UndoRedoService
  ) {}

  updateProperty(uri: URI, updates: Partial<FileData>): void {
    // 更新数据
    // Object.assign(resource, updates);
    // 触发属性更新事件
    this.onDidUpdatedPropertyEmitter.fire(updates);
  }

  /**
   * 记录属性修改操作（所有输入组件共用此方法）
   * @param context 属性变更上下文
   * @param updateUI 同步 UI 的回调（undo/redo 时触发）
   */
  recordPropertyChange(
    context: Omit<PropertyChangeContext, "uri"> & { uri: URI },
    onUpdate: (data: Partial<FileData>) => Promise<void>
  ): void {
    const fullContext: PropertyChangeContext = { ...context };

    // 构建可撤销操作
    const operation = {
      async undo() {
        // 撤销：恢复旧值，同步 UI
        await onUpdate({ [fullContext.fieldKey]: fullContext.oldValue });
      },
      async redo() {
        // 重做：恢复新值，同步 UI
        await onUpdate({ [fullContext.fieldKey]: fullContext.newValue });
      },
    };

    // 推送到 UndoRedoService（绑定当前资源 URI）
    this.undoRedoService.pushElement(
      context.uri,
      operation.undo,
      operation.redo
    );
  }

  removePropertyChangeRecord(uri: URI): void {
    this.undoRedoService.removeElements(uri);
  }
}
