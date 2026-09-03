import { Event } from '..\common';
import { StorageService } from '../storage';
export interface MagicApiProjectData {
    id: string;
    name: string;
    url: string;
    webPath: string;
    description?: string;
    proxyEnable?: boolean;
    token?: string;
    isOpened?: boolean;
    createdAt?: number;
    updatedAt?: number;
}
export interface CreateProjectParams {
    name: string;
    url: string;
    webPath: string;
    description?: string;
    proxyEnable?: boolean;
}
export interface MagicApiProjectService {
    /**
     * 获取所有项目
     */
    getProjects(): Promise<MagicApiProjectData[]>;
    /**
     * 根据ID获取项目
     * @param id 项目ID
     */
    getProject(id: string): Promise<MagicApiProjectData | undefined>;
    /**
     * 根据URL获取项目
     * @param url 服务地址
     */
    getProjectByUrl(url: string): Promise<MagicApiProjectData | undefined>;
    /**
     * 创建项目
     * @param params 项目创建参数
     */
    createProject(params: CreateProjectParams): Promise<MagicApiProjectData | undefined>;
    /**
     * 删除项目
     * @param id 项目ID
     */
    deleteProject(id: string): Promise<void>;
    /**
     * 删除项目（根据URL）
     * @param url 服务地址
     */
    deleteProjectByUrl(url: string): Promise<void>;
    /**
     * 更新项目
     * @param project 项目信息
     */
    updateProject(project: MagicApiProjectData): Promise<boolean>;
    /**
     * 根据URL更新项目
     * @param url 服务地址
     * @param updates 更新字段
     */
    updateProjectByUrl(url: string, updates: Partial<Omit<MagicApiProjectData, 'id' | 'url'>>): Promise<boolean>;
    /**
     * 获取最后打开的项目
     */
    getLastOpenProject(): Promise<MagicApiProjectData | undefined>;
    /**
     * 获取最近打开的项目列表
     */
    getRecentlyOpenedProjects(): Promise<MagicApiProjectData[]>;
    /**
     * 添加项目到最近打开列表
     * @param projectId 项目ID
     */
    addToRecentlyOpened(projectId: string): Promise<void>;
    /**
     * 从最近打开列表中移除项目
     * @param projectId 项目ID
     */
    removeFromRecentlyOpened(projectId: string): Promise<void>;
    /**
     * 更新项目访问令牌
     * @param id 项目ID
     * @param token 项目访问令牌
     */
    updateProjectToken(id: string, token: string): Promise<boolean>;
    /**
     * 更新项目打开状态
     * @param projectId 项目ID
     * @param isOpened 是否打开
     */
    updateProjectOpenStatus(projectId: string, isOpened: boolean): Promise<boolean>;
    /**
     * 获取所有打开的项目
     */
    getOpenedProjects(): Promise<MagicApiProjectData[]>;
    /**
     * 关闭所有项目
     */
    closeAllProjects(): Promise<void>;
    /**
     * 批量删除项目
     * @param ids 项目ID列表
     */
    deleteProjects(ids: string[]): Promise<void>;
    /**
     * 搜索项目
     * @param keyword 搜索关键词
     */
    searchProjects(keyword: string): Promise<MagicApiProjectData[]>;
    /**
     * 检查项目是否存在（根据URL）
     * @param url 服务地址
     */
    hasProject(url: string): Promise<boolean>;
    /**
     * 检查项目是否存在（根据ID）
     * @param id 项目ID
     */
    hasProjectById(id: string): Promise<boolean>;
    /**
     * 监听项目变化
     */
    onDidChangeProject: Event<MagicApiProjectData>;
}
export declare const MagicApiProjectService: unique symbol;
/**
 * Magic API 项目管理
 */
export declare class MagicApiProjectServiceImpl implements MagicApiProjectService {
    private readonly storageService;
    private readonly _onDidChangeProjects;
    readonly onDidChangeProjects: Event<void>;
    private readonly _onDidChangeProject;
    readonly onDidChangeProject: Event<MagicApiProjectData>;
    private readonly _onDidChangeProjectsStatus;
    readonly onDidChangeProjectsStatus: Event<void>;
    private readonly _onDidChangeRecentlyOpened;
    readonly onDidChangeRecentlyOpened: Event<void>;
    private projects;
    private initialized;
    private initPromise;
    constructor(storageService: StorageService);
    /**
     * 确保服务已初始化
     */
    private ensureInitialized;
    private init;
    /**
     * 从存储加载项目
     */
    private loadProjects;
    /**
     * 保存项目到存储
     */
    private saveProjects;
    /**
     * 生成项目ID（基于URL的hash或UUID）
     */
    private generateProjectId;
    /**
     * 对URL进行hash (如果选择方式2)
     */
    private hashUrl;
    /**
     * 规范化URL，用于比较
     */
    private normalizeUrl;
    /**
     * 根据URL查找项目索引
     */
    private findProjectIndexByUrl;
    /**
     * 根据URL查找项目
     */
    private findProjectByUrl;
    /**
     * 获取所有项目
     */
    getProjects(): Promise<MagicApiProjectData[]>;
    /**
     * 根据ID获取项目
     */
    getProject(id: string): Promise<MagicApiProjectData | undefined>;
    /**
     * 根据URL获取项目
     */
    getProjectByUrl(url: string): Promise<MagicApiProjectData | undefined>;
    /**
     * 创建项目
     */
    createProject(params: CreateProjectParams): Promise<MagicApiProjectData | undefined>;
    /**
     * 删除项目（根据ID）
     */
    deleteProject(id: string): Promise<void>;
    /**
     * 删除项目（根据URL）
     */
    deleteProjectByUrl(url: string): Promise<void>;
    /**
     * 更新项目
     */
    updateProject(project: MagicApiProjectData): Promise<boolean>;
    /**
     * 根据URL更新项目
     */
    updateProjectByUrl(url: string, updates: Partial<Omit<MagicApiProjectData, 'id' | 'url'>>): Promise<boolean>;
    /**
     * 更新项目访问令牌
     * @param id 项目ID
     * @param token 项目访问令牌
     */
    updateProjectToken(id: string, token: string): Promise<boolean>;
    /**
     * 更新项目打开状态
     */
    updateProjectOpenStatus(projectId: string, isOpened: boolean): Promise<boolean>;
    /**
     * 获取所有打开的项目
     */
    getOpenedProjects(): Promise<MagicApiProjectData[]>;
    /**
     * 关闭所有项目
     */
    closeAllProjects(): Promise<void>;
    /**
     * 获取最后打开的项目
     */
    getLastOpenProject(): Promise<MagicApiProjectData | undefined>;
    /**
     * 获取最近打开的项目
     */
    getRecentlyOpenedProjects(): Promise<MagicApiProjectData[]>;
    /**
     * 添加项目到最近打开列表
     */
    addToRecentlyOpened(projectId: string): Promise<void>;
    /**
     * 从最近打开列表中移除项目
     */
    removeFromRecentlyOpened(projectId: string): Promise<void>;
    /**
     * 搜索项目
     */
    searchProjects(keyword: string): Promise<MagicApiProjectData[]>;
    /**
     * 检查项目是否存在（根据URL）
     */
    hasProject(url: string): Promise<boolean>;
    /**
     * 检查项目是否存在（根据ID）
     */
    hasProjectById(id: string): Promise<boolean>;
    /**
     * 批量删除项目
     */
    deleteProjects(ids: string[]): Promise<void>;
    /**
     * 导出项目数据
     */
    exportProjects(ids?: string[]): Promise<MagicApiProjectData[]>;
    /**
     * 导入项目数据
     */
    importProjects(projects: MagicApiProjectData[]): Promise<{
        success: number;
        failed: number;
    }>;
}
