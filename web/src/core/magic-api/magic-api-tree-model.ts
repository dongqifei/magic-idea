import { UUID } from "@lumino/coreutils";
import URI from "@MagicIdea/core/common/uri";
import { Resource, ResourceNode, SearchResourceResult } from "./magic-api-types";
import { forEach } from "lodash";

// 根节点ID后缀，根节点的ID为type_0，便于区分不同类型的根节点
const ROOT_ID_SUFFIX = '_0';

/**
 * 虚拟资源树模型，负责维护节点关系和搜索逻辑等
 */
export class MagicApiTreeModel {
  // 节点索引
  private nodeIndex = new Map<string, ResourceNode>();
  // 父节点索引映射（key=子节点ID，value=父节点ID），避免递归查找父节点，提升全路径计算效率
  private parentIndex = new Map<string, string>();

  constructor() {
  }

  // 初始化根节点数据
  initRoot(initialData?: Record<string, ResourceNode>) {
    if (initialData) {
      Object.entries(initialData).forEach(([type, root]) => {
        this.setRoot(type, root);
      });
    }
  }

  // 设置节点信息，同步构建父节点索引
  setRoot(type: string, root: ResourceNode): void {
    // 根节点的ID为type_id，便于区分不同类型的根节点
    const rootId = this.createRootNodeId(type);
    this.nodeIndex.set(rootId, root); 
    root.node.id = rootId;
    root.node.type = type;
    // 确保根节点的路径为空字符串
    root.node.fullPath = '';
    root.node.fullPathName = '';
    forEach(root.children, child => {
      this.buildIndex(child, root.node, '', '');
    });
    // 通知资源更新
    this.notifyResourcesUpdated();
  }

  // 父节点索引构建
  private buildIndex(
    node: ResourceNode,
    parentNode?: Resource,
    parentFullPath: string = '',
    parentFullPathName: string = ''
  ): void {
    const nodeId = node.node.id;
    if(nodeId && nodeId !== null) this.nodeIndex.set(nodeId, node);
    // 记录父节点索引（根节点无父节点，不记录）
    if (parentNode?.id && nodeId !== null) {
      this.parentIndex.set(nodeId, parentNode.id);
    } else {
      this.parentIndex.delete(nodeId); // 清除可能存在的旧父节点关联
    }
    // ========== 拼接 fullPath（英文路径） ==========
    const currentFullPath = this.buildSafePath(parentFullPath, node.node.path);

    // ========== 拼接 fullPathName（中文名称路径） ==========
    const currentFullPathName = this.buildSafePath(parentFullPathName, node.node.name);

    // 最终赋值（清理多余斜杠）
    node.node.fullPath = currentFullPath.replace(/\/+/g, '/');
    node.node.fullPathName = currentFullPathName.replace(/\/+/g, '/');
    node.node.type = parentNode?.type;
    // 是否是文件（叶子节点）
    const isFile = !node.children || node.children.length === 0;
    // 3. 创建 URI（传入完整路径！）
    node.node.uri = this.createUri(
      node.node,
      parentNode?.type,
      isFile
    );

    // 4. 递归子节点，把当前完整路径传给下一代
    if (node.children?.length) {
      node.children.forEach(child =>
        this.buildIndex(child, node.node, currentFullPath, currentFullPathName)
      );
    }
  }

  /**
   * 安全拼接节点路径（通用方法，解决 null/undefined/重复斜杠）
   * @param parentPath 父级完整路径
   * @param currentSegment 当前节点的 path/name
   */
  private buildSafePath(parentPath: string, currentSegment: string | null | undefined): string {
    // 安全过滤空值、null、undefined
    const safeSegment = this.safePathSegment(currentSegment);
    if (!safeSegment) return parentPath; // 无片段，直接返回父路径

    // 拼接 + 清理重复斜杠
    return `${parentPath}/${safeSegment}`.replace(/\/+/g, '/');
  }

  // 安全获取路径片段，空值返回空字符串
  private safePathSegment(segment: string | null | undefined): string {
    if (!segment || segment === 'null' || segment === 'undefined') {
      return '';
    }
    return segment.trim();
  }

  /**
   * 支持全路径精确/模糊匹配、名称匹配、关键字模糊匹配
   * @param keyword 搜索关键字（如 "/user/findUserInfo"、"用户信息"、"findUser"）
   * @param excludeTypes 可选：排除的资源类型（如 ['api']，默认搜索所有类型）
   * @returns 搜索结果数组
   */
  search(keyword: string, excludeTypes?: string[]): SearchResourceResult[] {
    if (!keyword.trim()) return []; // 空关键字返回空结果

    const normalizedKeyword = keyword.trim().toLowerCase();
    const targetTypes = excludeTypes || []; // 确定要搜索的资源类型
    targetTypes.push('datasource');
    const results: SearchResourceResult[] = [];
    // 遍历目标资源类型下的所有节点（复用nodeIndex，无需递归，效率更高）
    for (const [nodeId, node] of this.nodeIndex.entries()) {
      // 仅搜索非排除的资源类型以外的节点
      if (targetTypes.includes(node.node.type || '') || nodeId.endsWith(ROOT_ID_SUFFIX)){
        continue;
      };

      // 1. 全路径匹配（优先级最高）
      try {
        const nodeFullPath = this.getFullPath(nodeId).toLowerCase();
        // 精确匹配全路径（如输入 "/user/findUserInfo" 完全匹配）
        if (nodeFullPath === normalizedKeyword) {
          results.push({
            node,
            matchType: 'fullPath',
            matchText: nodeFullPath
          });
          continue; // 全路径精确匹配后，无需再判断其他类型
        }
        // 模糊匹配全路径（如输入 "/user/find" 匹配 "/user/findUserInfo"）
        if (nodeFullPath.includes(normalizedKeyword)) {
          results.push({
            node,
            matchType: 'fullPath',
            matchText: nodeFullPath
          });
          continue;
        }
      } catch (error) {
        // 个别节点获取全路径失败，不影响整体搜索
        console.warn(`获取节点 ${nodeId} 全路径失败：`, error);
      }

      // 2. 全路径名匹配（优先级最高）
      try {
        const nodeFullPathName = this.getFullPathName(nodeId).toLowerCase();
        // 精确匹配全路径名（如输入 "/用户管理/查询用户信息" 完全匹配）
        if (nodeFullPathName === normalizedKeyword) {
          results.push({
            node,
            matchType: 'fullPathName',
            matchText: nodeFullPathName
          });
          continue; // 全路径名精确匹配后，无需再判断其他类型
        }
        // 模糊匹配全路径名（如输入 "/用户管理/查询" 匹配 "/用户管理/查询用户信息"）
        if (nodeFullPathName.includes(normalizedKeyword)) {
          results.push({
            node,
            matchType: 'fullPathName',
            matchText: nodeFullPathName
          });
          continue;
        }
      } catch (error) {
        // 个别节点获取全路径名失败，不影响整体搜索
        console.warn(`获取节点 ${nodeId} 全路径名失败：`, error);
      }

      // 3. 节点名称匹配（优先级次之）
      const nodeName = (node.node.name || '').toLowerCase();
      if (nodeName.includes(normalizedKeyword)) {
        results.push({
          node,
          matchType: 'name',
          matchText: node.node.name || ''
        });
        continue;
      }

      // 4. 关键字模糊匹配（匹配名称、path等字段，优先级最低）
      const nodePath = (node.node.path || '').toLowerCase();
      const nodeContent = `${nodeName} ${nodePath}`; // 拼接可搜索字段
      if (nodeContent.includes(normalizedKeyword)) {
        results.push({
          node,
          matchType: 'keyword',
          matchText: nodeContent
        });
      }
    }

    // 去重（避免同一节点被多种匹配类型重复命中）
    const uniqueResults = this.deduplicateSearchResourceResults(results);
    return uniqueResults;
  }

  /**
   * 辅助方法：搜索结果去重（同一节点只保留优先级最高的匹配类型）
   * @param results 原始搜索结果
   * @returns 去重后的结果
   */
  private deduplicateSearchResourceResults(results: SearchResourceResult[]): SearchResourceResult[] {
    const nodeIdMap = new Map<string, SearchResourceResult>();
    // 匹配类型优先级：fullPath > name > keyword
    const matchPriority = { fullPath: 4, fullPathName: 3, name: 2, keyword: 1 };

    for (const result of results) {
      const nodeId = result.node.node.id;
      const existingResult = nodeIdMap.get(nodeId);

      if (!existingResult) {
        // 该节点未存入，直接添加
        nodeIdMap.set(nodeId, result);
      } else {
        // 该节点已存在，保留优先级更高的匹配类型
        const existingPriority = matchPriority[existingResult.matchType];
        const currentPriority = matchPriority[result.matchType];
        if (currentPriority > existingPriority) {
          nodeIdMap.set(nodeId, result);
        }
      }
    }

    return Array.from(nodeIdMap.values());
  }
  
  getFullPathName(nodeId: string): string {
    const node = this.getNodeById(nodeId);
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`);
    }

    return node.node.fullPathName || '';
  }

  // 获取节点的全路径（如 /user/findUserInfo）
  getFullPath(nodeId: string): string {
    const node = this.getNodeById(nodeId);
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`);
    }

    return node.node.fullPath || '';
  }

  // 创建节点，同步维护父节点索引
  createNode(
    type: string,
    nodeData: Resource,
    parentId: string,
    isFile = false
  ): ResourceNode {
    const parent = this.getNodeById(parentId, type);
    if (!parent) throw new Error(`父节点 ${parentId} 不存在`);

    const nodeId = isFile ? this.generateId() : nodeData.id;
    
    // 使用 buildSafePath 正确拼接路径
    const nodePath = this.buildSafePath(parent.node.fullPath || '', nodeData.path);
    const nodePathName = this.buildSafePath(parent.node.fullPathName || '', nodeData.name);
    
    const newNode = {
      ...nodeData,
      id: nodeId,
      fullPath: nodePath.replace(/\/+/g, '/'),
      fullPathName: nodePathName.replace(/\/+/g, '/'),
      type,
      parentId: !isFile ? parent.node.id.endsWith(ROOT_ID_SUFFIX) ? '0': parent.node.id : undefined,
      groupId: isFile ? parent.node.id : nodeData.groupId
    };
    
    const node: ResourceNode = {
      node: { ...newNode, uri: this.createUri(newNode, type, isFile) },
      children: []
    };

    if(isFile){
      node.node.groupId = parent.node.id;
      node.node.isTemp = true;
    }

    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(node);

    // 更新节点索引和父节点索引
    this.nodeIndex.set(nodeId, node);
    this.parentIndex.set(nodeId, parent.node.id);

    // 通知资源更新
    this.notifyResourcesUpdated();
    return node;
  }

  // 删除节点，同步清理父节点索引
  deleteNode(nodeId: string): void {
    const node = this.getNodeById(nodeId);
    if (!node) return;

    // 从父节点中移除
    const parentId = this.parentIndex.get(nodeId);
    const parent = parentId ? this.getNodeById(parentId) : undefined;
    if (parent?.children) {
      parent.children = parent.children.filter(child => child.node.id !== nodeId);
    }

    // 递归删除子节点的索引和父节点索引
    this.removeNodeAndChildren(node);
    // 通知资源更新
    this.notifyResourcesUpdated();
  }

  // 删除节点以及子节点，清理父节点索引
  private removeNodeAndChildren(node: ResourceNode): void {
    const nodeId = node.node.id;
    this.nodeIndex.delete(nodeId);
    this.parentIndex.delete(nodeId); // 清理当前节点的父节点索引

    if (node.children) {
      node.children.forEach(child => this.removeNodeAndChildren(child));
    }
  }

  // 移动节点，自动重建受影响的子树
  moveNode(type: string, nodeId: string, targetParentId: string): void {
    const node = this.getNodeById(nodeId);
    const targetParent = this.getNodeById(targetParentId === '0' ? this.createRootNodeId(type) : targetParentId);
    if (!node || !targetParent) return;

    // 从原父节点移除
    let oldParentId = this.parentIndex.get(nodeId);
    // 根节点需特殊处理
    if (oldParentId === '0'){
      oldParentId = this.createRootNodeId(type, oldParentId);
    }
    const oldParent = oldParentId ? this.getNodeById(oldParentId) : undefined;
    if (oldParent?.children) {
      oldParent.children = oldParent.children.filter(child => child.node.id !== nodeId);
    }

    // 添加到新父节点
    if (!targetParent.children) targetParent.children = [];
    targetParent.children.push(node);

    // 更新父节点索引（切换节点的父节点关联）
    this.parentIndex.set(nodeId, targetParent.node.id);
    
    // 移动后需要重建整个子树的派生数据
    this.rebuildSubtree(nodeId);
  }

  // 更新节点属性，自动重建受影响的子树
  updateNode(nodeId: string, updates: Partial<Resource>): ResourceNode | undefined {
    const node = this.getNodeById(nodeId);
    if (!node) return undefined;
    
    // 更新节点属性
    node.node = { ...node.node, ...updates };
    this.nodeIndex.set(nodeId, node); // 刷新索引（防止引用丢失）
    
    // 重建当前节点及其所有子节点
    this.rebuildSubtree(nodeId);
    return node;
  }

  /**
   * 重命名节点路径（便捷方法）
   * @param nodeId 节点ID
   * @param newPath 新的路径名
   * @param newName 新的显示名称（可选，默认与 path 相同）
   */
  renameNodePath(nodeId: string, newPath: string, newName?: string): ResourceNode | undefined {
    return this.updateNode(nodeId, {
      path: newPath,
      name: newName || newPath
    });
  }

  /**
   * 重建节点及其所有子节点的派生数据（fullPath, fullPathName, uri）
   * 当节点的父节点发生变化或其自身的 path/name 发生改变时调用
   * @param nodeId 需要重建的节点ID
   */
  private rebuildNodeDerivedData(nodeId: string): void {
    const node = this.getNodeById(nodeId);
    if (!node) return;

    // 获取父节点信息用于重建路径
    const parentId = this.parentIndex.get(nodeId);
    const parentNode = parentId ? this.getNodeById(parentId) : undefined;
    
    // 获取父节点的完整路径（如果是根节点，父路径为空）
    const parentFullPath = parentNode?.node.fullPath || '';
    const parentFullPathName = parentNode?.node.fullPathName || '';
    
    // 重新构建当前节点的路径
    const currentFullPath = this.buildSafePath(parentFullPath, node.node.path);
    const currentFullPathName = this.buildSafePath(parentFullPathName, node.node.name);
    
    node.node.fullPath = currentFullPath.replace(/\/+/g, '/');
    node.node.fullPathName = currentFullPathName.replace(/\/+/g, '/');
    
    // 重新创建 URI
    const isFile = !node.children || node.children.length === 0;
    node.node.uri = this.createUri(node.node, node.node.type, isFile);
    
    // 递归重建所有子节点
    if (node.children?.length) {
      node.children.forEach(child => {
        // 子节点的 parentIndex 保持不变，但需要重建路径
        this.rebuildNodeDerivedData(child.node.id);
      });
    }
  }

  /**
   * 重建整个子树（当节点被移动或路径相关属性改变时调用）
   * @param rootNodeId 子树的根节点ID
   */
  private rebuildSubtree(rootNodeId: string): void {
    const rootNode = this.getNodeById(rootNodeId);
    if (!rootNode) return;
    
    // 重新建立该节点及其所有子节点的派生数据
    this.rebuildNodeDerivedData(rootNodeId);
    
    // 由于路径变化可能影响 URI，需要通知资源更新
    this.notifyResourcesUpdated();
  }

  /**
   * 获取指定类型的根节点（返回单个根节点对象，非数组）
   * 并对根节点下的所有层级子节点执行递归排序
   * @param type 资源类型
   * @returns 排序后的根节点（所有子节点已递归排序）
   */
  getRoot(type: string): ResourceNode[] | [] {
    // 获取根节点（不存在则创建默认根节点）
    let rootNode = this.nodeIndex.get(this.createRootNodeId(type));
    if (!rootNode) {
      rootNode = this.createDefaultRoot(type);
    }
    this.recursiveSortNodeChildren(rootNode.children);
    // 对根节点下的所有层级子节点执行递归排序
    rootNode.children.forEach(childNode => {
      this.recursiveSortNodeChildren(childNode.children);
    });
    return rootNode.children;
  }

  /**
   * 私有递归方法：遍历所有层级节点，对每个节点的children数组进行排序
   * @param node 要处理的节点（从根节点开始递归）
   */
  private recursiveSortNodeChildren(nodes: ResourceNode[]): void {
    // 1. 如果当前节点有子节点，先对子节点数组排序
    if (nodes && nodes.length > 0) {
      // 对当前节点的children数组执行排序
      nodes.sort((a, b) => {
        if (a.node.parentId && !b.node.parentId) {
          return -1; // a是文件夹，b是文件，a排在b前面
        }
        if (!a.node.parentId && b.node.parentId) {
          return 1; // a是文件，b是文件夹，b排在a前面
        }

        // 第二步：同类型（同为文件夹/文件），按名称字母排序（中文支持）
        const aName = a.node.name || '';
        const bName = b.node.name || '';
        return aName.localeCompare(bName, 'zh-CN'); // 传入zh-CN，优化中文排序
      });

      // 2. 递归处理每个子节点，实现深层级排序
      nodes.forEach(childNode => {
        this.recursiveSortNodeChildren(childNode.children);
      });
    }
    // 无子节点，直接返回（递归终止条件）
    return;
  }

  getNodeById(nodeId: string, type?: string): ResourceNode | undefined {
    if(nodeId === '0' && type){
      nodeId = `${type}${ROOT_ID_SUFFIX}`;
    }
    return this.nodeIndex.get(nodeId);
  }

  findParent(nodeId: string): ResourceNode | undefined {
    const parentId = this.parentIndex.get(nodeId);
    return parentId ? this.getNodeById(parentId) : undefined;
  }

  /**
   * 获取节点整条向上父分组链路
   * @param nodeId 目标节点ID
   * @returns 父分组节点数组，顺序：顶层根目录 → 直接父节点
   */
  getGroups(nodeId: string): ResourceNode[] {
    const groups: ResourceNode[] = [];
    let currentNodeId = nodeId;

    while (true) {
      // 获取当前节点的父ID
      const parentId = this.parentIndex.get(currentNodeId);
      if (!parentId) break;

      const parentNode = this.getNodeById(parentId);
      if (!parentNode) break;

      groups.push(parentNode);
      currentNodeId = parentId;
    }

    // 此时数组顺序：直接父 → 上层父 → 根
    // reverse 转为：根 → 一级父 → 二级父 → 直接父（和原L函数输出顺序保持一致）
    groups.reverse();
    return groups;
  }

  /**
   * 获取节点下子节点的URI
   * @param nodeId 目标节点ID
   * @param options 配置选项
   * @param options.recursive 是否递归获取所有子节点（包括子子节点等），默认为 false
   * @param options.includeCurrent 是否包含当前节点自身的URI，默认为 false
   * @param options.maxDepth 最大递归深度，-1 表示不限制，默认为 -1
   * @param options.filter 过滤函数，可基于节点信息进行过滤
   * @param options.onlyLeaves 是否只返回叶子节点（无子节点的节点），默认为 false
   * @returns 子节点URI数组
   */
  getChildrenNodeUris(
    nodeId: string, 
    options: {
      recursive?: boolean;
      includeCurrent?: boolean;
      maxDepth?: number;
      filter?: (node: ResourceNode) => boolean;
      onlyLeaves?: boolean;
    } = {}
  ): URI[] {
    const {
      recursive = false,
      includeCurrent = false,
      maxDepth = -1,
      filter = () => true,
      onlyLeaves = false
    } = options;

    const node = this.getNodeById(nodeId);
    if (!node) {
      return [];
    }

    const result: URI[] = [];
    
    // 包含当前节点
    if (includeCurrent && node.node.uri && filter(node)) {
      if (!onlyLeaves || (onlyLeaves && (!node.children || node.children.length === 0))) {
        result.push(node.node.uri);
      }
    }

    if (recursive) {
      // 递归获取所有子节点
      this.collectUrisRecursively(node, result, {
        maxDepth,
        currentDepth: 0,
        filter,
        onlyLeaves
      });
    } else {
      // 只获取直接子节点
      if (node.children) {
        node.children.forEach(child => {
          if (child.node.uri && filter(child)) {
            if (!onlyLeaves || (onlyLeaves && (!child.children || child.children.length === 0))) {
              result.push(child.node.uri);
            }
          }
        });
      }
    }

    return result;
  }

  /**
   * 递归收集所有子节点的URI
   * @param node 当前节点
   * @param result 结果数组
   * @param options 递归选项
   */
  private collectUrisRecursively(
    node: ResourceNode,
    result: URI[],
    options: {
      maxDepth: number;
      currentDepth: number;
      filter: (node: ResourceNode) => boolean;
      onlyLeaves: boolean;
    }
  ): void {
    const { maxDepth, currentDepth, filter, onlyLeaves } = options;
    
    // 检查深度限制
    if (maxDepth !== -1 && currentDepth >= maxDepth) {
      return;
    }

    if (!node.children || node.children.length === 0) {
      return;
    }

    const nextDepth = currentDepth + 1;
    
    node.children.forEach(child => {
      // 应用过滤条件
      if (child.node.uri && filter(child)) {
        // 检查是否只返回叶子节点
        const isLeaf = !child.children || child.children.length === 0;
        if (!onlyLeaves || (onlyLeaves && isLeaf)) {
          result.push(child.node.uri);
        }
      }
      
      // 继续递归
      this.collectUrisRecursively(child, result, {
        maxDepth,
        currentDepth: nextDepth,
        filter,
        onlyLeaves
      });
    });
  }

  // 生成唯一ID
  generateId(): string {
    return UUID.uuid4().replace(/-/g, '');
  }

  private createDefaultRoot(type: string): ResourceNode {
    const nodeId = this.createRootNodeId(type);
    const virtualNode: ResourceNode = { node: { id: nodeId, name: 'root', type }, children: [] };
    this.nodeIndex.set(nodeId, virtualNode);
    return virtualNode;
  }

  private createRootNodeId(type: string, nodeId?: string): string { 
    if(!nodeId){
      return type + ROOT_ID_SUFFIX;
    }
    return nodeId === '0' ? type + ROOT_ID_SUFFIX : nodeId;
  }

  private createUri(
    node: Resource,
    type?: string,
    isFile?: boolean
  ): URI | undefined {
    const nodeId = node.id;
    if (!nodeId || nodeId === '0' || nodeId.endsWith(ROOT_ID_SUFFIX)) {
      return undefined;
    }
    // const apiMethod = (node && typeof node === 'object' && 'method' in node) ? node.method : '';
    const resourceType = type || 'api';
    const fullPath = node.fullPathName || '';
    const filePath = isFile ? `${fullPath}.ms` : fullPath;
    return URI
      .fromFilePath(filePath)
      .withQuery(`resourceType=${resourceType}&resourceId=${nodeId}`);
  }

  /**
   * 根据路径查找节点并返回 URI
   * @param path 要查找的路径（如 "/function/objToString" 或完整路径）
   * @param options 配置选项
   * @param options.matchType 匹配类型：'fullPath'（默认，全路径匹配）、'fullPathName'（中文路径匹配）、'exact'（精确匹配）、'fuzzy'（模糊匹配）
   * @param options.resourceType 可选，限制查找的资源类型（如 'api'、'datasource' 等）
   * @returns 匹配到的第一个节点的 URI，未找到返回 undefined
   */
  pathToUri(
    path: string,
    options: {
      matchType?: 'fullPath' | 'fullPathName' | 'exact' | 'fuzzy';
      resourceType?: string[];
    } = {}
  ): URI | undefined {
    if (!path || !path.trim()) {
      return undefined;
    }

    const { matchType = 'fullPath', resourceType = ['api', 'function'] } = options;
    const normalizedPath = path.trim();
    const targetPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

    // 遍历所有节点查找匹配的路径
    for (const [nodeId, node] of this.nodeIndex.entries()) {
      // 过滤资源类型
      if (resourceType && !resourceType.includes(node.node.type || '')) {
        continue;
      }

      // 跳过根节点
      if (nodeId.endsWith(ROOT_ID_SUFFIX)) {
        continue;
      }

      let matched;

      switch (matchType) {
        case 'fullPath':
          // 全路径匹配（英文路径）
          const fullPath = node.node.fullPath || '';
          matched = fullPath === targetPath;
          break;
          
        case 'fullPathName':
          // 中文路径匹配
          const fullPathName = node.node.fullPathName || '';
          matched = fullPathName === targetPath;
          break;
          
        case 'exact':
          // 精确匹配（路径或名称完全相等）
          const exactPath = node.node.fullPath || '';
          const exactPathName = node.node.fullPathName || '';
          const exactName = node.node.name || '';
          matched = exactPath === targetPath || 
                    exactPathName === targetPath ||
                    exactName === targetPath ||
                    (node.node.path && `/${node.node.path}` === targetPath);
          break;
          
        case 'fuzzy':
          // 模糊匹配（包含关系）
          const fuzzyFullPath = node.node.fullPath || '';
          const fuzzyFullPathName = node.node.fullPathName || '';
          const fuzzyName = node.node.name || '';
          matched = fuzzyFullPath.includes(targetPath) ||
                    fuzzyFullPathName.includes(targetPath) ||
                    fuzzyName.includes(targetPath) ||
                    (node.node.path && node.node.path.includes(targetPath));
          break;
      }

      if (matched && node.node.uri) {
        return node.node.uri;
      }
    }

    return undefined;
  }

  /**
   * 快捷方法：通过全路径获取 URI（等同于 pathToUri(path, { matchType: 'fullPath' })）
   * @param fullPath 完整路径（如 "/function/objToString"）
   * @returns URI 对象或 undefined
   */
  getUriByFullPath(fullPath: string): URI | undefined {
    return this.pathToUri(fullPath, { matchType: 'fullPath' });
  }

  /**
   * 快捷方法：通过中文路径获取 URI（等同于 pathToUri(path, { matchType: 'fullPathName' })）
   * @param fullPathName 中文完整路径（如 "/函数/对象转字符串"）
   * @returns URI 对象或 undefined
   */
  getUriByFullPathName(fullPathName: string): URI | undefined {
    return this.pathToUri(fullPathName, { matchType: 'fullPathName' });
  }

  /**
   * 获取所有 API 和函数资源的映射
   * @returns 返回格式化的资源映射，包含 @post:/path 和 @/path 格式的 key
   */
  getFormattedResources(): {
    apis: Map<string, { uri: URI; fullPath: string; fullPathName: string; method?: string }>;
    functions: Map<string, { uri: URI; fullPath: string; fullPathName: string }>;
  } {
    const apis = new Map<string, { uri: URI; fullPath: string; fullPathName: string; method?: string }>();
    const functions = new Map<string, { uri: URI; fullPath: string; fullPathName: string }>();

    // 获取所有 API 类型的节点
    const apiRootNodes = this.getRoot('api');
    if (apiRootNodes && Array.isArray(apiRootNodes)) {
      this.collectFormattedResources(apiRootNodes, 'api', apis, functions);
    }

    // 获取所有函数类型的节点
    const functionRootNodes = this.getRoot('function');
    if (functionRootNodes && Array.isArray(functionRootNodes)) {
      this.collectFormattedResources(functionRootNodes, 'function', apis, functions);
    }

    return { apis, functions };
  }

  /**
   * 递归收集格式化的资源
   */
  private collectFormattedResources(
    nodes: ResourceNode[],
    resourceType: 'api' | 'function',
    apis: Map<string, any>,
    functions: Map<string, any>
  ): void {
    if (!nodes || !Array.isArray(nodes)) return;

    const traverse = (node: ResourceNode) => {
      if (!node || !node.node) return;

      const resourceNode = node.node;
      const fullPath = resourceNode.fullPath || '';
      const fullPathName = resourceNode.fullPathName || '';
      const uri = resourceNode.uri;

      if (uri && fullPath && resourceNode.groupId) {
        if (resourceType === 'api') {
          // API 格式：@post:/path/to/api
          const method = (resourceNode as any).method || 'get';
          const key = `@${method.toLowerCase()}:${fullPath}`;
          apis.set(key, {
            uri,
            fullPath,
            fullPathName,
            method: method.toLowerCase()
          });
        } else if (resourceType === 'function') {
          // 函数格式：@/path/to/function
          const key = `@${fullPath}`;
          functions.set(key, {
            uri,
            fullPath,
            fullPathName
          });
        }
      }

      // 递归处理子节点
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => traverse(child));
      }
    };

    nodes.forEach(node => traverse(node));
  }

  /**
   * 批量获取所有资源（简化格式）
   */
  getAllResources(): Array<{
    type: 'api' | 'function';
    key: string;
    uri: URI;
    fullPath: string;
    fullPathName: string;
    method?: string;
  }> {
    const { apis, functions } = this.getFormattedResources();
    const resources: Array<any> = [];

    // 添加 API 资源（只添加带 method 的版本）
    apis.forEach((info, key) => {
      if (key.includes(':')) {
        resources.push({
          type: 'api',
          key,
          uri: info.uri,
          fullPath: info.fullPath,
          fullPathName: info.fullPathName,
          method: info.method
        });
      }
    });

    // 添加函数资源
    functions.forEach((info, key) => {
      resources.push({
        type: 'function',
        key,
        uri: info.uri,
        fullPath: info.fullPath,
        fullPathName: info.fullPathName
      });
    });

    return resources;
  }

  /**
   * 当树结构更新时，触发资源更新回调
   */
  private onResourcesUpdated?: (resources: ReturnType<MagicApiTreeModel['getAllResources']>) => void;

  /**
   * 设置资源更新回调（当树结构变化时自动调用）
   */
  setResourceUpdateCallback(callback: (resources: ReturnType<MagicApiTreeModel['getAllResources']>) => void): void {
    this.onResourcesUpdated = callback;
  }

  /**
   * 通知资源已更新（在添加、删除、移动节点后调用）
   */
  private notifyResourcesUpdated(): void {
    if (this.onResourcesUpdated) {
      const resources = this.getAllResources();
      this.onResourcesUpdated(resources);
    }
  }
}