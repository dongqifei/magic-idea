import { TreeApi, NodeRendererProps } from 'react-arborist';
import URI from '@MagicIdea/core/common/uri';
import { IEvent, isObject } from '@MagicIdea/core/common';
import { FileData } from "@MagicIdea/core/filesystem/file-system-types";
import { Resource, ResourceNode, ResourceData } from '@MagicIdea/core/magic-api/magic-api-types';

export * from '@MagicIdea/core/magic-api/magic-api-types';

// 定义参数行类型（基于你的数据源结构）
export interface ApiParamItem {
  name: string | null;
  value: any;
  description?: string | null;
  required?: boolean;
  dataType?: string | null;
  type?: string | null;
  defaultValue?: string | null;
  validateType?: string | null;
  error?: string | null;
  expression?: string | null;
  children?: any | null;
}

export interface ApiResourceMetaData extends FileData{
  method: string;
  paths: ApiParamItem[];
  groupId: string;
  description: string;
  options: ApiParamItem[];
  parameters: ApiParamItem[];
  headers: ApiParamItem[];
  requestBody: string;
  requestBodyDefinition: string;
  responseBody: string;
  responseBodyDefinition: string;
}

export namespace ApiResourceMetaData {
  export function is(node: unknown): node is ApiResourceMetaData {
    if (!isObject(node)) return false;

    return (
      (
        "type" in node &&
        node.type === "api" &&
        "groupId" in node &&
        !!node.groupId
      ) || (
        "id" in node &&
        "method" in node &&
        "parameters" in node &&
        "headers" in node &&
        "requestBody" in node
      )
    );
  }
}

export interface FunctionResourceMetaData extends FileData{
  returnType: string;
  mappingPath: string;
  paths: ApiParamItem[];
  groupId: string;
  description: string;
  parameters: ApiParamItem[];
  properties: any;
}

export namespace FunctionResourceMetaData {
  export function is(node: unknown): node is FunctionResourceMetaData {
    if (!isObject(node)) return false;
    
    return (
      ('id' in node && 'returnType' in node)|| (
      'type' in node && 
      node.type === 'function' && 
      'groupId' in node && 
      !!node.groupId
    ));
  }
}

export interface DatasourceResourceMetaData extends FileData {
  key: string;
  url: string;
  username: string;
  password: string;
  driverClassName?: string;
  maxRows?: number;
  extraParams?: string; // JSON格式的额外配置
}

export interface ApiParamTableProps {
  fileParams: ApiParamItem[]; // 关联的文件数据（用于挂载params字段）
  onUpdate: (data: Partial<ApiResourceMetaData>) => void; // 统一的更新回调
}

/**
 * 资源树服务接口（定义与服务层交互的契约）
 */
export interface MagicApiTreeService {
  onDidInitialize: IEvent<void>;
  onDidChangeSelection: IEvent<Resource | undefined>;
  onDidChangeNodes: IEvent<void>;
  
  getCurrentSelectionNode(): Resource | undefined;
  setCurrentSelectionNode(node: Resource | undefined): void;

  getLastSelectedNode(type: string): Resource | undefined;
  removeLastSelectedNode(type: string): void;

  initialize(rawData: ResourceData): void;
  getNodeById(nodeId: string): ResourceNode | undefined;
  getNodeFullPath(nodeId: string): string;
  getRootByType(type: string): ResourceNode[];

  search(keyword: string): Promise<any>;
  createGroup(type: string, resource: Resource, parentId: string): Promise<URI>;
  updateGroup(nodeId: string, resource: Resource): Promise<void>;
  createResource(type: string, resource: Resource, parentId: string): Promise<Resource | undefined>;
  deleteResource(nodeId: string): Promise<void>;
  moveResource(type: string, nodeId: string, targetParentId: string): Promise<void>;
  updateNode(nodeId: string, updates: Partial<Resource>): Promise<ResourceNode | undefined>
}
export const MagicApiTreeService = Symbol('MagicApiTreeService');

/**
 * 资源树UI组件节点
 */
export interface ResourceTreeNode {
  id: string;
  label?: string; // 显示文本
  icon?: string; // 图标
  node: Resource; // 原始资源数据
  children?: ResourceTreeNode[]; // 子节点列表
  // 透传的回调函数（用于节点交互）
  onContextMenu?: (node: Resource, e: React.MouseEvent) => void;
}

/**
 * 资源树树节点渲染属性接口（UI层与控制层交互）
 */
export interface ResourceTreeNodeRendererProps<T = any> extends NodeRendererProps<T> {
  currentSelectedId?: string;
  lastSelectedId?: string;
  apiTreeWidget: any; // 注入的树组件实例（用于调用API）
}

/**
 * 资源树UI组件属性接口（UI层与控制层交互）
 */
export interface ResourceTreeProps {
  currentSelectedId?: string;
  lastSelectedId?: string;
  resourceType?: string;
  nodes: ResourceNode[];
  controller: MagicApiTreeService; 
  apiTreeWidget: any;
  onTreeRefReady: (treeView: TreeApi<ResourceTreeNode>) => void;
  onNodeContextMenu: (node: Resource, e: React.MouseEvent) => void;
  onMoveNode: (nodeId: string, targetParentId: string | null) => void;
}

// 定义文件上传结果类型
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}