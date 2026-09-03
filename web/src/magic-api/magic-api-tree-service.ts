import { inject, injectable } from 'inversify';
import URI from '@MagicIdea/core/common/uri';
import { Emitter, IEvent } from '@MagicIdea/core/common';
import { NotificationService } from "@MagicIdea/core/notification";
import { MagicApiTreeService, ResourceData, ResourceNode, Resource } from './magic-api-tree-types';
import { MagicApiTreeModel } from '../core/magic-api/magic-api-tree-model';
import { MagicApiSocketService } from '@MagicIdea/core/magic-api/magic-api-socket-service';
import { FileSystemService } from '@MagicIdea/core/filesystem';
import { ApplicationShellLayout } from "@MagicIdea/core/shell";
import { NavigatableWidget } from "@MagicIdea/core/navigatable-types";
import { SaveableWidget } from "@MagicIdea/core/saveable";
import { ConfirmDialog } from '@MagicIdea/core/dialogs/confirm-dialog';

/**
 * 连接模型、服务和 UI，处理业务逻辑（如临时节点转正、状态同步）
 */
@injectable()
export class MagicApiTreeServiceImpl implements MagicApiTreeService {

  private lastTypeSelectedNode: Map<string, Resource | undefined> = new Map<string, Resource | undefined>();

  // 当前选中节点
  private currentSelectionNode: Resource | undefined;

  protected readonly onDidInitializedEmitter = new Emitter<void>();

  get onDidInitialize(): IEvent<void> {
    return this.onDidInitializedEmitter.event;
  }

  protected readonly onDidChangeSelectionEmitter = new Emitter<Resource | undefined>();
  protected readonly onDidChangeNodesEmitter = new Emitter<void>();

  get onDidChangeSelection(): IEvent<Resource | undefined> {
    return this.onDidChangeSelectionEmitter.event;
  }

  get onDidChangeNodes(): IEvent<void> {
    return this.onDidChangeNodesEmitter.event;
  }

  private fireDidChangeNodes(): void {
    this.onDidChangeNodesEmitter.fire();
  }

  getCurrentSelectionNode(): Resource | undefined {
    return this.currentSelectionNode;
  }

  setCurrentSelectionNode(node: Resource | undefined): void {
    if(node !== this.currentSelectionNode && node?.id !== this.currentSelectionNode?.id){
      this.currentSelectionNode = node;
      if(!node?.parentId) this.socketService.sendMessage('set_file_id', [node?.id]);
      this.onDidChangeSelectionEmitter.fire(this.currentSelectionNode);
    }
    if(!node){
      this.lastTypeSelectedNode.clear();
    }else if(node?.type){
      const _current = this.lastTypeSelectedNode.get(node?.type);
      if(node !== _current && _current?.id !== node.id) {
        this.lastTypeSelectedNode.set(node?.type, node);
      }
    }
  }
  
  getLastSelectedNode(type: string): Resource | undefined {
    return this.lastTypeSelectedNode.get(type);
  }

  removeLastSelectedNode(type: string): void {
    this.lastTypeSelectedNode.delete(type);
    this.onDidChangeSelectionEmitter.fire(this.currentSelectionNode);
  }

  constructor(
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(MagicApiSocketService) private socketService: MagicApiSocketService,
    @inject(MagicApiTreeModel) private model: MagicApiTreeModel,
    @inject(FileSystemService) private fileSystemService: FileSystemService,
    @inject(ApplicationShellLayout) protected readonly shell: ApplicationShellLayout
  ) {
  }

  async initialize(rawData: ResourceData): Promise<void> {
    if(rawData && Object.keys(rawData).length > 0){
      this.model.initRoot(rawData);
    }
    this.onDidInitializedEmitter.fire();
  }

  // 在文件中根据关键字查找资源，返回匹配的资源列表
  async search(keyword: string): Promise<any> {
    return this.fileSystemService.search("file", keyword);
  }

  // 创建分组（正式节点）并同步到服务端
  async createGroup(type: string, resource: Resource, parentId: string): Promise<URI> {
    const id = this.model.generateId();
    try {
      const formalNode = this.model.createNode(type, { ...resource, id, type }, parentId, false);
      if(formalNode.node.uri){
        await this.fileSystemService.mkdir(formalNode.node.uri, formalNode.node);
        this.fireDidChangeNodes();
        return formalNode.node.uri!;
      }
      throw new Error("未指定分组URI");
    } catch (error: any) {
      this.model.deleteNode(id)
      this.notificationService.error('创建分组失败: '+ error.message);
      throw error;
    }
  }

  // 修改分组（正式节点）并同步到服务端
  async updateGroup(nodeId: string, resource: Resource): Promise<void> {
    try {
      const nodeData = this.getNodeById(nodeId); 
      if(nodeData?.node.uri){
        await this.fileSystemService.mkdir(nodeData?.node.uri, {...nodeData?.node, ...resource});
        this.updateNode(nodeId, resource);
      }
    } catch (error: any) {
      this.notificationService.error('修改分组失败: '+ error.message);
      throw error;
    }
  }

  // 创建临时节点（临时节点用于编辑）
  async createResource(type: string, resource: Resource, parentId: string): Promise<Resource | undefined> {
    try {
      if(type === 'api'){
        (resource as any).method = 'GET';
      }
      const tempNode = this.model.createNode(type, resource, parentId, true);
      this.fireDidChangeNodes();
      return tempNode.node;
    } catch (error) {
      throw error;
    }
  }

  // 删除资源节点
  async deleteResource(nodeId: string): Promise<void> {
    const node = this.model.getNodeById(nodeId);
    if (!node) return;
    const nodeData = { ...node.node };
    const uris = this.model.getChildrenNodeUris(nodeId, { recursive: true, includeCurrent: !nodeData.parentId });
    if(await ConfirmDialog.openConfirm(this.getConfirmMessage(nodeData))){
      await this.delete(uris, nodeData);
    }
  }

  // 移动节点
  async moveResource(type: string, nodeId: string, targetParentId: string): Promise<void> {
    const sourceNode = this.model.getNodeById(nodeId);
    const targetNode = this.model.getNodeById(targetParentId);
    // const oldParent = this.model.findParent(nodeId);
    // const oldParentId = oldParent?.node.id || '';
    try {
      if(sourceNode?.node.uri && targetNode?.node.uri){
        await this.fileSystemService.move(sourceNode?.node.uri, targetNode?.node.uri);
        this.model.moveNode(type, nodeId, targetParentId);
      }
    } catch (error: any) {
      // this.model.moveNode(type, nodeId, oldParentId);
      this.notificationService.error("移动失败:" + error.message)
      throw error;
    } finally {
      this.fireDidChangeNodes();
    }
  }

    // 更新节点（如修改path/name时调用，触发面包屑更新）
  async updateNode(nodeId: string, updates: Partial<Resource>): Promise<ResourceNode | undefined> {
    const node = this.model.updateNode(nodeId, updates);
    // 触发更新事件，通知UI层刷新面包屑
    this.fireDidChangeNodes();
    return node;
  }

  // 获取节点全路径
  getNodeFullPath(nodeId: string): string {
    return this.model.getFullPath(nodeId);
  }

  // 获取节点
  getNodeById(nodeId: string): ResourceNode | undefined {
    return this.model.getNodeById(nodeId);
  }

  // 获取根节点
  getRootByType(type: string): ResourceNode[] | [] {
    return this.model.getRoot(type);
  }
  
  /**
   * Get the dialog confirmation message for deletion.
   *
   * @param uris URIs of selected resources.
   */
  protected getConfirmMessage(nodeData: Resource): string {
    // const dirty = this.getDirty(uris);
    // if(dirty.length){
    //   return `确定要删除${dirty.length}个有未保存的资源吗？`;
    // }
    if(!nodeData.parentId){
      return `确定要删除“${nodeData.name}”资源吗 ？`;
    }
    return `确定要删除“${nodeData.name}”分组及其所有子资源吗？`;
  }

  private async delete(uris: URI[], nodeData: Resource): Promise<void> { 
    try {
      // 执行删除（移入回收站/永久删除）
      await this.deleteFilePermanently(nodeData);
      // 删除后关闭关联编辑器（不保存更改）
      await this.closeWithoutSaving(uris);
      this.model.deleteNode(nodeData.id);
      this.fireDidChangeNodes();
    } catch (error: any) {
      this.notificationService.error('删除失败: '+ error.message);
      throw error;
    }
  }

  // 删除文件
  private async deleteFilePermanently(node: Resource): Promise<void> { 
    if(node.uri){
      await this.fileSystemService.delete(node.uri);
    }
  }

  // 检查待删除资源是否有「未保存（dirty）」的编辑器
  protected getDirty(uris: URI[]): URI[] {
    const dirty = new Map<string, URI>();
    // 筛选出所有关联的脏编辑器URI
    const widgets = NavigatableWidget.get(SaveableWidget.getDirty(this.shell.widgets), resourceUri => uris.some(uri => {
      return uri.isEqual(resourceUri);
    }));
    for (const [resourceUri] of widgets) {
        dirty.set(resourceUri.toString(), resourceUri);
    }
    return [...dirty.values()];
}

  // 关闭指定URI的所有关联编辑器
  protected async closeWithoutSaving(uris: URI[]): Promise<void> {
    if(!uris || uris.length === 0){
      return;
    }
    // 1. 筛选出与URI关联的所有已打开Widget（编辑器）
    const widgets = NavigatableWidget.get(this.shell.widgets, resourceUri => uris.some(uri => {
      return uri.isEqual(resourceUri);
    }));
    const toClose = [...widgets].map(([, widget]) => widget);
    // 2. 调用ApplicationShell批量关闭（强制不保存）
    await this.shell.closeMany(toClose, { save: false });
  }
}