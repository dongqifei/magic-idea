import URI from '..\common\uri';
import { Resource, ResourceNode, SearchResourceResult } from "./magic-api-types";
/**
 * 虚拟资源树模型，负责维护节点关系和搜索逻辑等
 */
export declare class MagicApiTreeModel {
    private nodeIndex;
    private parentIndex;
    constructor();
    initRoot(initialData?: Record<string, ResourceNode>): void;
    setRoot(type: string, root: ResourceNode): void;
    private buildIndex;
    /**
     * 安全拼接节点路径（通用方法，解决 null/undefined/重复斜杠）
     * @param parentPath 父级完整路径
     * @param currentSegment 当前节点的 path/name
     */
    private buildSafePath;
    private safePathSegment;
    /**
     * 支持全路径精确/模糊匹配、名称匹配、关键字模糊匹配
     * @param keyword 搜索关键字（如 "/user/findUserInfo"、"用户信息"、"findUser"）
     * @param excludeTypes 可选：排除的资源类型（如 ['api']，默认搜索所有类型）
     * @returns 搜索结果数组
     */
    search(keyword: string, excludeTypes?: string[]): SearchResourceResult[];
    /**
     * 辅助方法：搜索结果去重（同一节点只保留优先级最高的匹配类型）
     * @param results 原始搜索结果
     * @returns 去重后的结果
     */
    private deduplicateSearchResourceResults;
    getFullPathName(nodeId: string): string;
    getFullPath(nodeId: string): string;
    createNode(type: string, nodeData: Resource, parentId: string, isFile?: boolean): ResourceNode;
    deleteNode(nodeId: string): void;
    private removeNodeAndChildren;
    moveNode(type: string, nodeId: string, targetParentId: string): void;
    updateNode(nodeId: string, updates: Partial<Resource>): ResourceNode | undefined;
    /**
     * 重命名节点路径（便捷方法）
     * @param nodeId 节点ID
     * @param newPath 新的路径名
     * @param newName 新的显示名称（可选，默认与 path 相同）
     */
    renameNodePath(nodeId: string, newPath: string, newName?: string): ResourceNode | undefined;
    /**
     * 重建节点及其所有子节点的派生数据（fullPath, fullPathName, uri）
     * 当节点的父节点发生变化或其自身的 path/name 发生改变时调用
     * @param nodeId 需要重建的节点ID
     */
    private rebuildNodeDerivedData;
    /**
     * 重建整个子树（当节点被移动或路径相关属性改变时调用）
     * @param rootNodeId 子树的根节点ID
     */
    private rebuildSubtree;
    /**
     * 获取指定类型的根节点（返回单个根节点对象，非数组）
     * 并对根节点下的所有层级子节点执行递归排序
     * @param type 资源类型
     * @returns 排序后的根节点（所有子节点已递归排序）
     */
    getRoot(type: string): ResourceNode[] | [];
    /**
     * 私有递归方法：遍历所有层级节点，对每个节点的children数组进行排序
     * @param node 要处理的节点（从根节点开始递归）
     */
    private recursiveSortNodeChildren;
    getNodeById(nodeId: string, type?: string): ResourceNode | undefined;
    findParent(nodeId: string): ResourceNode | undefined;
    /**
     * 获取节点整条向上父分组链路
     * @param nodeId 目标节点ID
     * @returns 父分组节点数组，顺序：顶层根目录 → 直接父节点
     */
    getGroups(nodeId: string): ResourceNode[];
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
    getChildrenNodeUris(nodeId: string, options?: {
        recursive?: boolean;
        includeCurrent?: boolean;
        maxDepth?: number;
        filter?: (node: ResourceNode) => boolean;
        onlyLeaves?: boolean;
    }): URI[];
    /**
     * 递归收集所有子节点的URI
     * @param node 当前节点
     * @param result 结果数组
     * @param options 递归选项
     */
    private collectUrisRecursively;
    generateId(): string;
    private createDefaultRoot;
    private createRootNodeId;
    private createUri;
    /**
     * 根据路径查找节点并返回 URI
     * @param path 要查找的路径（如 "/function/objToString" 或完整路径）
     * @param options 配置选项
     * @param options.matchType 匹配类型：'fullPath'（默认，全路径匹配）、'fullPathName'（中文路径匹配）、'exact'（精确匹配）、'fuzzy'（模糊匹配）
     * @param options.resourceType 可选，限制查找的资源类型（如 'api'、'datasource' 等）
     * @returns 匹配到的第一个节点的 URI，未找到返回 undefined
     */
    pathToUri(path: string, options?: {
        matchType?: 'fullPath' | 'fullPathName' | 'exact' | 'fuzzy';
        resourceType?: string[];
    }): URI | undefined;
    /**
     * 快捷方法：通过全路径获取 URI（等同于 pathToUri(path, { matchType: 'fullPath' })）
     * @param fullPath 完整路径（如 "/function/objToString"）
     * @returns URI 对象或 undefined
     */
    getUriByFullPath(fullPath: string): URI | undefined;
    /**
     * 快捷方法：通过中文路径获取 URI（等同于 pathToUri(path, { matchType: 'fullPathName' })）
     * @param fullPathName 中文完整路径（如 "/函数/对象转字符串"）
     * @returns URI 对象或 undefined
     */
    getUriByFullPathName(fullPathName: string): URI | undefined;
    /**
     * 获取所有 API 和函数资源的映射
     * @returns 返回格式化的资源映射，包含 @post:/path 和 @/path 格式的 key
     */
    getFormattedResources(): {
        apis: Map<string, {
            uri: URI;
            fullPath: string;
            fullPathName: string;
            method?: string;
        }>;
        functions: Map<string, {
            uri: URI;
            fullPath: string;
            fullPathName: string;
        }>;
    };
    /**
     * 递归收集格式化的资源
     */
    private collectFormattedResources;
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
    }>;
    /**
     * 当树结构更新时，触发资源更新回调
     */
    private onResourcesUpdated?;
    /**
     * 设置资源更新回调（当树结构变化时自动调用）
     */
    setResourceUpdateCallback(callback: (resources: ReturnType<MagicApiTreeModel['getAllResources']>) => void): void;
    /**
     * 通知资源已更新（在添加、删除、移动节点后调用）
     */
    private notifyResourcesUpdated;
}
