import { inject, injectable } from 'inversify';
import * as monaco from 'monaco-editor';
import { IEvent, Emitter, IDisposable } from '@MagicIdea/core/common';
import { URI } from '@MagicIdea/core/common/uri';
import { EditorManager } from '@MagicIdea/editor/editor-manager';
import { Marker, MarkerService } from './markers-types';

@injectable()
export class MarkerServiceImpl implements MarkerService {
  protected readonly onDidChangeMarkersEmitter = new Emitter<Marker[]>();

  private markers: Marker[] = [];
  private disposables: (() => void)[] = [];
  // 存储当前编辑器的诊断信息监听
  private currentDiagnosticDisposable?: IDisposable;

  constructor(
    @inject(EditorManager) private editorManager: EditorManager
  ) {
    this.initEditorListener();
  }

  /**
   * 初始化编辑器监听
   */
  private initEditorListener(): void {
    // 监听活动编辑器变化
    this.editorManager.onCurrentEditorChanged((widget) => {
      if (widget?.editor) {
        this.trackEditorMarkers(widget.editor.getControl());
      }
    });
  }

  /**
   * 跟踪指定编辑器的标记变化
   */
  private trackEditorMarkers(editor: monaco.editor.IStandaloneCodeEditor): void {
    // 先销毁之前的诊断监听
    this.currentDiagnosticDisposable?.dispose();

    const model = editor.getModel();
    if (!model) return;

    // 初始加载标记
    this.updateMarkersForModel(model);

    // 监听所有编辑器标记变化
    this.currentDiagnosticDisposable = monaco.editor.onDidChangeMarkers(() => {
      // this.updateAllMarkers();
      this.updateMarkersForModel(model);
    });
    this.disposables.push(() => this.currentDiagnosticDisposable?.dispose());
  }

  /**
   * 更新指定模型的标记
   */
  private updateMarkersForModel(model: monaco.editor.ITextModel): void {
    const monacoMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
    this.markers = monacoMarkers.map(marker => this.convertToMarker(marker));
    this.fireOnDidChangeMarkers(this.markers);
  }

  /**
   * 更新所有模型的标记
   */
  private updateAllMarkers(): void {
    const allModels = monaco.editor.getModels();
    const allMarkers: Marker[] = [];
    
    allModels.forEach(model => {
      const monacoMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
      allMarkers.push(...monacoMarkers.map(marker => this.convertToMarker(marker)));
    });

    this.markers = allMarkers;
    this.fireOnDidChangeMarkers(allMarkers);
  }

  /**
   * 转换Monaco标记为自定义标记
   */
  private convertToMarker(monacoMarker: monaco.editor.IMarker): Marker {
    const resourceUrl = monacoMarker.resource.toString();
    return {
      id: `${monacoMarker.resource.toString()}-${monacoMarker.code}-${monacoMarker.startLineNumber}`,
      resource: new URI(monacoMarker.resource),
      resourceId: resourceUrl,
      severity: monacoMarker.severity,
      message: monacoMarker.message,
      startLineNumber: monacoMarker.startLineNumber,
      startColumn: monacoMarker.startColumn,
      endLineNumber: monacoMarker.endLineNumber,
      endColumn: monacoMarker.endColumn,
      source: monacoMarker.source
    };
  }

  /**
   * 获取所有标记
   */
  getMarkers(): Marker[] {
    return [...this.markers];
  }

  /**
   * 获取指定资源的标记
   */
  getMarkersForResource(resourceId: string): Marker[] {
    return this.markers.filter(marker => marker.resourceId === resourceId);
  }

  /**
   * 订阅标记变化事件
   */
  get onDidChangeMarkers(): IEvent<Marker[]> {
    return this.onDidChangeMarkersEmitter.event;
  }

  /**
   * 发送标记变化事件
   */
  protected fireOnDidChangeMarkers(markers: Marker[]): void {
    this.onDidChangeMarkersEmitter.fire(markers);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.disposables.forEach(dispose => dispose());
  }
}