import { inject, injectable } from 'inversify';
import { Message } from '@lumino/messaging';
import { CommandRegistry } from '@lumino/commands';
import { ReactWidget } from '../core/widgets/react-widget';
import { createElement } from 'react';
import { MarkerPanel } from './marker-views';
import { Marker, MarkerService } from './markers-types';
import { EditorManager } from '@MagicIdea/editor/editor-manager';
import { ApplicationShellLayout } from '../core/shell/application-shell';
import { DisposableCollection } from '../core/common/disposable';
import { KeybindingRegistry } from "../core/keybinding";

@injectable()
export class MarkerWidget extends ReactWidget {
  private markers: Marker[] = [];
  private activeResourceId: string | undefined;
  private disposables = new DisposableCollection();
  private problemsActivity: any;
  private currentEditor: any;

  constructor(
    @inject(CommandRegistry) private commands: CommandRegistry,
    @inject(KeybindingRegistry) private keybindingRegistry: KeybindingRegistry,
    @inject(ApplicationShellLayout) private shellLayout: ApplicationShellLayout,
    @inject(MarkerService) private markerService: MarkerService,
    @inject(EditorManager) private editorManager: EditorManager
  ) {
    super();
    this.id = 'problems-panel';
    this.title.label = 'Problems';
    this.node.tabIndex = -1;
    this.initListeners();
  }

  /**
   * 初始化监听器
   */
  private initListeners(): void {
    // 监听标记变化
    this.disposables.push(
      this.markerService.onDidChangeMarkers(markers => {
        this.markers = markers;
        this.problemsActivity.setBadge(markers.length);
        this.update();
      })
    );

    // 监听活动编辑器变化
    this.editorManager.onCurrentEditorChanged((widget) => {
      if (widget?.editor) {
        const model = widget.editor.getControl().getModel();
        this.activeResourceId = model?.uri?.toString();
      } else {
        this.markers = [];
        this.problemsActivity.setBadge(0);
      }
      this.currentEditor = widget?.editor.getControl();
      this.update();
    });
    this.registerActivity();
  }

  /**
   * 处理标记点击（跳转到编辑器位置）
   */
  private handleMarkerClick(marker: any): void {
    // 定位到具体位置（确保列可见）
    this.currentEditor.revealPositionInCenter({
      lineNumber: marker.startLineNumber,
      column: marker.startColumn
    });
    const selection = {
      startLineNumber: marker.startLineNumber,
      startColumn: marker.startColumn,
      endLineNumber: marker.endLineNumber,
      endColumn: marker.endColumn
    };
    this.currentEditor.setSelection(selection);
  }

  /**
   * 注册到活动面板
   */
  registerActivity(): void {
    this.problemsActivity = this.shellLayout.activityManager.registerActivity({
      id: 'problems',
      title: '问题',
      iconClass: `codicon codicon-warning`,
      priority: 30,
      location: 'bottom',
      factory: () => this
    });

    this.commands.addCommand('view:problems', {
      label: '问题',
      execute: () => this.problemsActivity.open()
    });

    
    this.keybindingRegistry.registerKeybinding({
      command: "view:problems",
      keybinding: "ctrl+shift+m",
    });
    
    this.commands.addCommand('view:problems:toggle', {
      label: '切换问题面板',
      isVisible: () => false,
      execute: () => this.problemsActivity.toggle()
    });
  }

  /**
   * 渲染组件
   */
  protected render(): React.ReactNode {
    return createElement(MarkerPanel, {
      markers: this.markers,
      activeResourceId: this.activeResourceId,
      onMarkerClick: (marker) => this.handleMarkerClick(marker)
    });
  }

  /**
   * 销毁资源
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.disposables.dispose();
  }
}