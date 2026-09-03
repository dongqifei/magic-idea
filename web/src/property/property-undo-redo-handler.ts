import { injectable, inject } from "inversify";
import URI from "@MagicIdea/core/common/uri";
import { UndoRedoHandler } from "@MagicIdea/core/undo-redo/undo-redo-handler";
import { UndoRedoService } from "@MagicIdea/core/undo-redo/undo-redo-service";
import { ApplicationShellLayout } from "@MagicIdea/core/shell/application-shell";
import { PropertyEditorWidget } from "./property-manager";

@injectable()
export class PropertyEditorUndoRedoHandler implements UndoRedoHandler<URI> {
  /** 优先级：低于 Monaco 编辑器（10000），高于普通 DOM 组件（100） */
  priority = 900;

  constructor(
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(UndoRedoService) private readonly undoRedoService: UndoRedoService
  ) {}

  /**
   * 框架调用：判断当前是否激活属性配置组件
   * 返回当前激活的资源 URI（未激活则返回 undefined）
   */
  select(): URI | undefined {
    // 判断当前聚焦的 Widget 是属性配置组件
    const activeWidget = this.shellLayout.currentWidget;
    if (activeWidget && activeWidget instanceof PropertyEditorWidget) {
      return activeWidget.resourceUri; // 返回当前组件关联的资源 URI
  }
    return undefined;
  }

  /** 执行撤销（框架触发） */
  async undo(uri: URI): Promise<void> {
    await this.undoRedoService.undo(uri);
  }

  /** 执行重做（框架触发） */
  async redo(uri: URI): Promise<void> {
    await this.undoRedoService.redo(uri);
  }
}
