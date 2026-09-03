import { TreeApi } from "react-arborist";
import { createElement } from "react";
import { CommandRegistry } from "@lumino/commands";
import { ReactWidget } from "@MagicIdea/core/widgets"
import { ContextMenuRenderer } from "@MagicIdea/core/context-menu-renderer";
import { MagicApiServerState, MagicApiServerService } from "@MagicIdea/core/magic-api";
import { Resource, ResourceNode, ResourceTreeNode } from "./magic-api-tree-types";
import { MagicApiResourceTree, MagicApiWelcomeView } from "./magic-api-tree-views";
import { DisposableCollection } from "../core/common/disposable";
import { MagicApiTreeService } from "./magic-api-tree-types";
import { MagicApiCommands, MAGIC_API_RESOURCE_CONTEXT_MENU } from "./magic-api-commands";
import { MagicApiExplorerWidget } from "./magic-api-explorer-widget";
import { ContextKeyService, ContextKey } from "@MagicIdea/core";

type toolbarItem = { 
  id: string; 
  label: string; 
  icon: string; 
  execute: () => void; 
}

export class MagicApiResourceWidget extends ReactWidget { 
  private disposables = new DisposableCollection();
  private resourceType: string;
  private resourceTitle: string;
  private commands: CommandRegistry;
  private controller: MagicApiTreeService;
  private magicApiWidget: MagicApiExplorerWidget;
  private treeViewRef: any;
  private nodeContextMenuRenderer: ContextMenuRenderer;
  private contextKeyServiceOverlay: ContextKeyService;

  protected magicApiResourceTitleKey: ContextKey<string>;
  protected magicApiResourceTypeKey: ContextKey<string>;
  protected magicApiResourceIsDirectoryKey: ContextKey<boolean>;
  protected magicApiResourceIsRootKey: ContextKey<boolean>;

  constructor(magicApiWidget: MagicApiExplorerWidget, resourceType: string, resourceTitle: string) {
    super();
    this.magicApiWidget = magicApiWidget;
    this.controller = magicApiWidget.controller;
    this.commands = magicApiWidget.commands;
    this.contextKeyServiceOverlay = magicApiWidget.contextKeyServiceOverlay;
    this.nodeContextMenuRenderer = magicApiWidget.nodeContextMenuRenderer;
    this.resourceType = resourceType;
    this.resourceTitle = resourceTitle;
    this.title.label = resourceTitle;
    this.addClass('magic-api-resource-widget');
    this.node.style.minHeight = '120px';

    // 初始化上下文键
    this.initializeContextKeys();
    
    this.disposables.pushAll([
      // 监听父组件状态变化，触发重渲染
      this.magicApiWidget.onDidChangeStatus(() => {
        this.update();
      }),
      
      // 监听节点选择变化，触发重渲染
      this.controller.onDidChangeSelection((resource: Resource | undefined) => {
        this.update();
      }),
      // 监听节点变化
      this.controller.onDidChangeNodes(() => {
        this.update();
      })
    ])
  }

  protected initializeContextKeys(): void {
    this.magicApiResourceTitleKey = this.contextKeyServiceOverlay.createKey<string>('resourceTitle', '');
    this.magicApiResourceTypeKey = this.contextKeyServiceOverlay.createKey<string>('resourceType', '');
    // 是否根节点key
    this.magicApiResourceIsRootKey = this.contextKeyServiceOverlay.createKey<boolean>('isRootResource', false);
    // 是否目录节点key
    this.magicApiResourceIsDirectoryKey = this.contextKeyServiceOverlay.createKey<boolean>('isDirectoryResource', false);
  }

  get tools(): toolbarItem[]{
    return [
      {
        id: "create-group",
        label: "新建分组...",
        icon: "codicon codicon-new-folder",
        execute: () => {
          let lastSelectedResource = this.controller.getLastSelectedNode(this.resourceType);
          if(!lastSelectedResource){
            lastSelectedResource = {
              id: "0",
              name: "root",
              type: this.resourceType,
            }
          }
          this.commands.execute(MagicApiCommands.NEW_RESOURCE_GROUP.id, {...lastSelectedResource})
        }
      },
      {
        id: "expand",
        label: "全部展开",
        icon: "codicon codicon-expand-all",
        execute: () => {
          this.treeViewRef.openAll();
        }
      },{
        id: "collapse",
        label: "全部折叠",
        icon: "codicon codicon-collapse-all",
        execute: () => {
          this.treeViewRef.closeAll();
        }
      }
    ]
  }

  // 获取当前状态（从父组件获取）
  private get status(): MagicApiServerState {
    return this.magicApiWidget.status;
  }

  // 获取当前节点数据
  private get nodes(): ResourceNode[] {
    return this.controller.getRootByType(this.resourceType);
  }

  private handleNodeContextMenu(node: Resource, e: MouseEvent) {
    this.magicApiResourceTypeKey.set(this.resourceType);
    this.magicApiResourceTitleKey.set(this.resourceTitle);
    this.magicApiResourceIsRootKey.set(!node || node.id === '0');
    this.magicApiResourceIsDirectoryKey.set(node && !!node.parentId);
    if (this.nodeContextMenuRenderer && node && e.currentTarget instanceof HTMLElement) {
      e.stopPropagation();
      e.preventDefault();

      this.nodeContextMenuRenderer.render({
        menuPath: MAGIC_API_RESOURCE_CONTEXT_MENU,
        anchor: e,
        args: [{...node}],
        context: e.currentTarget,
        contextKeyService: this.contextKeyServiceOverlay,
      });
    }
  }

  handleMoveNodeOperation (sourceId: string, targetId: string | null):void {
    this.controller.moveResource(this.resourceType, sourceId, targetId || '0');
  };

  private getLastSelectedNodeId(): string | undefined {
    const node = this.controller.getLastSelectedNode(this.resourceType);
    return node ? node.id : undefined;
  }

  protected render(): React.ReactNode {
    // 1. 加载状态组件
    if (this.status === MagicApiServerState.Loading) {
      return createElement("div", { className: "magic-progress-container" });
    }

    if (this.status === MagicApiServerState.Error) {
      return createElement("div", { className: "api-loading" }, "加载资源出错，请检查代理服务器是否正常。");
    }

    // 2. 资源树组件
    return createElement(MagicApiResourceTree, {
      currentSelectedId: this.controller.getCurrentSelectionNode()?.id,
      lastSelectedId: this.getLastSelectedNodeId(),
      resourceType: this.resourceType,
      nodes: this.nodes,
      onTreeRefReady: (treeView: TreeApi<ResourceTreeNode>) => {
        this.treeViewRef = treeView;
      },
      onNodeContextMenu: (node: Resource, e: React.MouseEvent) => {
        this.handleNodeContextMenu(node, e.nativeEvent);
      },
      onMoveNode: (nodeId: string, targetParentId: string | null) => {
        this.handleMoveNodeOperation(nodeId, targetParentId);
      },
      controller: this.controller,
      apiTreeWidget: this.magicApiWidget,
    })
  }
}

export class MagicApiWelcomeViewWidget extends ReactWidget { 

  private magicApiServerService: MagicApiServerService;

  constructor(magicApiServerService: MagicApiServerService, resourceTitle: string) {
    super();
    this.magicApiServerService = magicApiServerService;
    this.addClass('magic-api-welcome-view-widget');
    this.title.label = resourceTitle;
    this.node.style.minHeight = '120px';
  }

  // 创建项目
  async createProject(): Promise<void> {
    // create project
   this.magicApiServerService.doCreateOrSwitchProject();
  }

  // 打开/创键示例项目
  openExampleProject(): void {
    this.magicApiServerService.openExampleProject();
  }

  render() {
    return createElement(MagicApiWelcomeView, {
      onCreateProject: () => this.createProject(),
      onOpenExampleProject: () => this.openExampleProject()
    });
  }

}