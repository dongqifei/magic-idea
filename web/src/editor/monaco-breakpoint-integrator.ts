import { inject, injectable, postConstruct } from "inversify";
import * as monaco from 'monaco-editor';
import URI from '../core/common/uri';
import { BreakpointManager, Breakpoint } from '../core/breakpoint-manager';
import { EditorWidget } from './editor-widget';
import { EditorManager } from "./editor-manager";
import { ApplicationShellLayout } from "@MagicIdea/core/shell";

@injectable()
export class MonacoBreakpointIntegrator {
  // 跟踪每个编辑器的临时悬停装饰ID
  private _hoverDecorationIds = new Map<string, string>(); // resourceUri -> decorationId

  private _disposables: monaco.IDisposable[] = [];

  constructor(
    @inject(BreakpointManager) private breakpointManager: BreakpointManager,
    @inject(ApplicationShellLayout) private shell: ApplicationShellLayout,
    @inject(EditorManager) private editorManager: EditorManager
  ) {
  }

  @postConstruct()
  protected _init(): void {
    // 监听断点变化，同步到编辑器
    this.breakpointManager.onDidChangeBreakpoints.connect((_, event) => {
      this._updateBreakpointDecorations(event.resourceUri, event.breakpoints);
    });

    // 监听新编辑器创建，初始化断点交互
    this.editorManager.onCreated((widget)=>{
      if (widget instanceof EditorWidget) {
        this._setupEditorBreakpointInteraction(widget);
      }
    })
  }

  private _setupEditorBreakpointInteraction(widget: EditorWidget): void {
    const resourceUri = widget.editor.getResourceUri();
    if (!resourceUri) return;
    const editor = widget.editor.getControl();

    // 监听鼠标进入行号区域
    const mouseMoveListener = editor.onMouseMove(e => {
      // 仅处理行号区域和 glyph 边距的鼠标移动
      if (
        (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS || 
         e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) &&
        e.target.position
      ) {
        const lineNumber = e.target.position.lineNumber;
        this._showHoverDecoration(editor, resourceUri, lineNumber);
      } else {
        // 鼠标离开行号区域，清除临时装饰
        this._clearHoverDecoration(editor, resourceUri);
      }
    });

    // 监听鼠标离开编辑器区域（避免鼠标移出编辑器后装饰残留）
    const mouseLeaveListener = editor.onMouseLeave(() => {
      this._clearHoverDecoration(editor, resourceUri);
    });

    // 监听行号区域点击（原有逻辑）
    const mouseDownListener = editor.onMouseDown(e => {
      if (
        (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS || 
         e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) &&
        e.target.position
      ) {
        this.breakpointManager.toggleBreakpoint(
          resourceUri,
          e.target.position.lineNumber
        );
      }
    });

    // 初始同步断点
    setTimeout(() => { 
      this._updateBreakpointDecorations(
        resourceUri,
        this.breakpointManager.getBreakpoints(resourceUri)
      );
    }, 30);

    // 销毁时清理事件监听
    widget.disposed.connect(() => {
      mouseMoveListener.dispose();
      mouseLeaveListener.dispose();
      mouseDownListener.dispose();
      this._clearHoverDecoration(editor, resourceUri); // 清除临时装饰
    });

    this._disposables.push(mouseMoveListener, mouseLeaveListener, mouseDownListener);
  }

  /** 显示鼠标悬停时的临时断点装饰 */
  private _showHoverDecoration(
    editor: monaco.editor.IStandaloneCodeEditor,
    resourceUri: URI,
    lineNumber: number
  ): void {
    const model = editor.getModel();
    if (!model) return;

    // 检查当前行是否已有真实断点（有则不显示临时装饰）
    const existingBreakpoints = this.breakpointManager.getBreakpoints(resourceUri);
    const hasRealBreakpoint = existingBreakpoints.some(bp => bp.lineNumber === lineNumber);
    if (hasRealBreakpoint) {
      this._clearHoverDecoration(editor, resourceUri);
      return;
    }

    // 清除之前的临时装饰
    this._clearHoverDecoration(editor, resourceUri);

    // 创建临时悬停装饰（浅色样式）
    const decoration:monaco.editor.IModelDeltaDecoration = {
      range: new monaco.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: 'debug-breakpoint-hover codicon-circle-filled', // 悬停样式类
        glyphMarginHoverMessage: { value: '单击以添加断点' }, // 悬停提示信息
      }
    };

    // 添加装饰并记录ID
    const decorationIds = model.deltaDecorations([], [decoration]);
    if (decorationIds.length > 0) {
      this._hoverDecorationIds.set(resourceUri.toString(), decorationIds[0]);
    }
  }

  /** 清除鼠标悬停时的临时断点装饰 */
  private _clearHoverDecoration(
    editor: monaco.editor.IStandaloneCodeEditor,
    resourceUri: URI
  ): void {
    const model = editor.getModel();
    if (!model) return;

    const decorationId = this._hoverDecorationIds.get(resourceUri.toString());
    if (decorationId) {
      model.deltaDecorations([decorationId], []); // 移除装饰
      this._hoverDecorationIds.delete(resourceUri.toString());
    }
  }

  private _updateBreakpointDecorations(resourceUri: URI, breakpoints: Breakpoint[]): void {
    const editors = Array.from(this.shell.widgets)
      .filter(w => w instanceof EditorWidget)
      .filter(w => w.getResourceUri()?.isEqual(resourceUri)) as EditorWidget[];

    editors.forEach(widget => {
      const editor = widget.editor;
      const model = editor.document.model!;
      if (!editor || !model) return;
      // 1. 获取当前编辑器中所有真实断点装饰的ID（用于清除旧装饰）
      const oldDecorations = model.getAllDecorations().filter(
        dec => dec.options.glyphMarginClassName?.includes('debug-breakpoint-enabled') ||
               dec.options.glyphMarginClassName?.includes('debug-breakpoint-disabled')
      ).map(dec => dec.id);

      // 2. 根据最新断点列表创建新装饰
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = breakpoints.map(breakpoint => ({
        range: new monaco.Range(breakpoint.lineNumber, 1, breakpoint.lineNumber, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: breakpoint.enabled 
            ? 'debug-breakpoint-enabled codicon-circle-filled' 
            : 'debug-breakpoint-disabled codicon-circle-filled',
          glyphMarginHoverMessage: { value: '单击以删除断点' },
        }
      }));

      // 3. 应用装饰：先清除旧的，再添加新的
      model.deltaDecorations(oldDecorations, newDecorations);
    });
  }

  dispose(): void {
    this._disposables.forEach(d => d.dispose());
    this._hoverDecorationIds.clear();
  }
}