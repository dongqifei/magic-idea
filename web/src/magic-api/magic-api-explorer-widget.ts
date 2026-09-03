import { inject, injectable } from "inversify";
import { Message } from "@lumino/messaging";
import { CommandRegistry } from "@lumino/commands";
import { AccordionPanel } from "@lumino/widgets";
import URI from "@MagicIdea/core/common/uri";
import { ContextMenuRenderer } from "@MagicIdea/core/context-menu-renderer";
import { ApplicationShellLayout } from '../core/shell/application-shell';
import { ActivityHandle } from "../core/nav-activity/nav-activity-type";
import { Resource, ResourceData, ResourceType, MagicApiTreeService } from "./magic-api-tree-types";
import { EditorManager } from "../editor/editor-manager";
import { DisposableCollection } from "../core/common/disposable";
import { IEvent, Emitter } from "../core/common";
import { FileState, FileChange, FileSystemService } from "../core/filesystem/file-system-types";
import { OpenerService, open } from '../core/opener-service';
import { QuickAccessRegistry } from '../core/quick-input';
import { FileQuickAccessProvider } from "./provider/magic-api-quick-access-provider";
import { MagicApiServerService, MagicApiOnlineUserService, MagicApiServerStatus, MagicApiServerState } from "@MagicIdea/core/magic-api";
import { ContextKeyService, KeybindingRegistry } from "@MagicIdea/core/keybinding";
import { MagicApiTreeModel } from "../core/magic-api/magic-api-tree-model";
import { MagicApiResourceTitleRenderer } from "./magic-api-resource-title-renderer";
import { MagicApiResourceWidget, MagicApiWelcomeViewWidget } from "./magic-api-resource-widget";
import { EditorWidget } from "@MagicIdea/editor/editor-widget";
import { ResourceRegistry } from "@MagicIdea/core/magic-api/magic-api-resource-service";
import { LabelProvider } from "@MagicIdea/core";

import "./magic-api-explorer.css"

@injectable()
export class MagicApiExplorerWidget extends AccordionPanel {
  private _status: MagicApiServerState;
  private disposables = new DisposableCollection();
  private explorerPanel!: ActivityHandle;

  /** 清空面板所有子widget */
  private clearAllWidgets(): void {
    // 拷贝数组，避免遍历过程中集合变动
    const widgets = [...this.widgets];
    for (const w of widgets) {
      w.parent = null;
      w.dispose();
    }
  }

  protected readonly onDidChangeStatusEmitter = new Emitter<void>();
  protected readonly onDidChangeFileDataEmitter = new Emitter<FileChange>();

  get onDidChangeStatus(): IEvent<void> {
    return this.onDidChangeStatusEmitter.event;
  }

  get onDidChangeFileData(): IEvent<FileChange> {
    return this.onDidChangeFileDataEmitter.event;
  }

  // 封装状态，变更时触发事件
  get status(): MagicApiServerState {
    return this._status;
  }

  set status(newStatus: MagicApiServerState) {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.onDidChangeStatusEmitter.fire(); // 通知子组件状态变化
    }
  }

  get selectedNode(): Resource | undefined {
    return this.magicApiTreeService.getCurrentSelectionNode();
  }

  get controller(): MagicApiTreeService {
    return this.magicApiTreeService;
  }

  get commands(): CommandRegistry {
    return this.commandRegistry;
  }

  get onlineUserService() : MagicApiOnlineUserService {
    return this.magicApiOnlineUserService;
  }

  get contextKeyServiceOverlay() : ContextKeyService {
    return this.contextKeyService;
  }

  get nodeContextMenuRenderer(): ContextMenuRenderer {
    return this.contextMenuRenderer;
  }

  protected toNodeIconColor(node: Resource): string {
    return this.labelProvider.getIconColor(node);
  }

  protected toNodeIcon(node: Resource): string {
    return this.labelProvider.getIcon(node);
  }

  openResource(resource: Resource | undefined): void {
    if(resource && resource.uri && resource.groupId) {
      open(this.openerService, resource.uri);
    }
    this.magicApiTreeService.setCurrentSelectionNode(resource);
  }
  
  getResoueceState(uri: URI): FileState | undefined {
    return this.fileSystemService.getFileState(uri);
  }

  constructor(
    @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
    @inject(KeybindingRegistry) protected keybindingRegistry: KeybindingRegistry,
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(EditorManager) private editorManager: EditorManager,
    @inject(FileSystemService) private fileSystemService: FileSystemService,
    @inject(OpenerService) private openerService: OpenerService,
    @inject(QuickAccessRegistry) private quickAccessRegistry: QuickAccessRegistry,
    @inject(MagicApiTreeModel) private model: MagicApiTreeModel,
    @inject(MagicApiTreeService) private magicApiTreeService: MagicApiTreeService,
    @inject(MagicApiServerService) private magicApiServerService: MagicApiServerService,
    @inject(MagicApiOnlineUserService) private magicApiOnlineUserService: MagicApiOnlineUserService,
    @inject(ContextKeyService) private contextKeyService: ContextKeyService,
    @inject(ContextMenuRenderer) private contextMenuRenderer: ContextMenuRenderer,
    @inject(ResourceRegistry) private resources: ResourceRegistry,
    @inject(LabelProvider) private labelProvider: LabelProvider,
  ) {
    super({
      spacing: 1,
      titleSpace: 24,
      renderer: new MagicApiResourceTitleRenderer(),
    });
    this.id = "magic-api-explorer";
    this.title.label = "资源管理器";
    this.addClass("magic-api-explorer");
    this.node.style.width = "100%";
    this.node.style.height = "100%";

    // 注册命令
    this.commands.addCommand("magic-api:resource:refresh", {
      label: "重新加载所有数据",
      isEnabled: () => this.isSuccess(),
      iconClass: 'codicon codicon-refresh',
      isVisible: () => this.isSuccess(),
      execute: () => {
        this.magicApiServerService.refresh();
      },
    });
    this.commands.addCommand("magic-api:resource:import", {
      label: "导入",
      isEnabled: () => false,
      isVisible: () => this.isSuccess(),
      iconClass: 'codicon codicon-cloud-upload',
      execute: () => {},
    });
    this.commands.addCommand("magic-api:resource:export", {
      label: "导出",
      isEnabled: () => false,
      isVisible: () => this.isSuccess(),
      iconClass: 'codicon codicon-cloud-download',
      execute: () => {},
    });
    this.commands.addCommand("magic-api:project:setting", {
      label: "项目设置",
      isVisible: () => this.isSuccess(),
      iconClass: 'codicon codicon-gear',
      execute: () => {
        this.magicApiServerService.settingProject();
      },
    });

    // 注册活动面板
    this.registerActivePanel();
    
    // 注册文件快速访问提供者
    this.quickAccessRegistry.registerProvider(new FileQuickAccessProvider(this.model, this.fileSystemService, this.openerService, this.labelProvider));
    
    // 监听编辑器切换
    this.disposables.push(
      this.editorManager.onCurrentEditorChanged(e=>{
        let resourceUri = e?.editor?.getResourceUri();
        if (resourceUri && resourceUri.resourceId) {
            const resourceNode = this.magicApiTreeService.getNodeById(resourceUri.resourceId);
            this.magicApiTreeService.setCurrentSelectionNode(resourceNode?.node);
          } else {
            this.magicApiTreeService.setCurrentSelectionNode(undefined);
          }
      })
    )

    //监听文件内容改变
    this.disposables.trackEvent(
      (cb) => this.fileSystemService.onDidFileDataChange.connect(cb),
      (cb) => this.fileSystemService.onDidFileDataChange.disconnect(cb),
      (_, result) => {
        this.onDidChangeFileDataEmitter.fire(result);
        const fileData = result.data;
        if(fileData)
          this.controller.updateNode(fileData.id, {...fileData, isDirty: result.isDirty});
      }
    );

    //监听文件状态改变
    this.disposables.trackEvent(
      (cb) => this.fileSystemService.onDidFileStateChange.connect(cb),
      (cb) => this.fileSystemService.onDidFileStateChange.disconnect(cb),
      (_, result) => {
        this.explorerPanel.setBadge(_.getDirtyFileUris().length);
        const fileData = result.fileData;
        if(fileData){
          this.controller.updateNode(fileData.id, { isDirty: result.isDirty });
        }
      }
    );

    this.disposables.push(
      this.shellLayout.onDidRemoveWidget((widget)=>{
        if(widget instanceof EditorWidget){
          let resourceUri = widget?.editor?.getResourceUri();
          if(resourceUri){
            const data = this.magicApiTreeService.getLastSelectedNode(resourceUri?.resourceType);
            if(data && data.id === resourceUri.resourceId){
              this.magicApiTreeService.removeLastSelectedNode(resourceUri?.resourceType);
            }
          }
        }
      })
    );

    this.disposables.pushAll([
      this.magicApiServerService.onDidChangeStatus(async (status: MagicApiServerStatus)=>{ 
        this.status = status.state;
        if(status.state === MagicApiServerState.Idle) { 
          this.clearAllWidgets();
          // 创建未打开任何资源连接
          const resourceEmpty = new MagicApiWelcomeViewWidget(this.magicApiServerService, '无打开的项目');
          this.addWidget(resourceEmpty);
          this.explorerPanel.updateToolbar();
        }
      }),
      this.magicApiServerService.onDidConnect((rawData: ResourceData)=>{
        this.clearAllWidgets();
        this.init(rawData);
        // 创建资源组件
        this.resources.getAllResourceTypes().forEach((resourceType: ResourceType) => {
          const resource = new MagicApiResourceWidget(this, resourceType.type, resourceType.label);
          this.addWidget(resource);
          const index = this.widgets.indexOf(resource);
          if (index > 0) {
            this.collapse(index);
          }
        });
        this.explorerPanel.updateToolbar();
      })
    ]);
  }
  
  private init(rawData: ResourceData): void {
    try {
      this.magicApiTreeService.initialize(rawData);
    } catch (error) {
      console.error("资源管理器初始化失败:", error);
    }
  }

  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.explorerPanel = activityManager.registerActivity({
      id: 'magic-api-explorer',
      title: '资源管理器',
      iconClass: 'codicon codicon-files',
      priority: 10,
      location: 'left-top',
      toolbarConfig: {
        showTitle: true,
        items: [
          {
            id: 'more-actions',
            type: 'dropdown',
            iconClass: 'codicon-ellipsis',
            tooltip: '更多操作',
            visible: () => this.isSuccess(),
            menuItems: [
              {
                commandId: 'magic-api:resource:import'
              },
              {
                commandId: 'magic-api:resource:export'
              },
              {
                separator: true,
              },
              {
                commandId: 'magic-api:project:setting'
              },
            ]
          },
          { id: "magic-resource-refresh", type: "button", commandId: "magic-api:resource:refresh" },
        ]
      },
      factory: () => {
        return this;
      }
    });
    this.commands.addCommand("view:magic-api-explorer", {
      label: "资源管理器",
      execute: () => {
        this.explorerPanel.open();
      },
    });
    
    this.keybindingRegistry.registerKeybinding({
      command: "view:magic-api-explorer",
      keybinding: "ctrl+shift+e",
    });
  }

  private isSuccess(): boolean {
    return this.status === MagicApiServerState.Connected;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.disposables.dispose();
  }

  override dispose(): void {
    super.dispose();
    this.disposables.dispose();
  }
}