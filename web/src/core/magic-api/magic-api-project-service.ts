import { inject, injectable } from "inversify";
import { Event, Emitter } from "@MagicIdea/core/common";
import { StorageService } from '../storage';

// 常量定义
const RECENTLY_OPENED_PROJECTS_KEY = 'magicApi.recentlyOpenedProjects';
const PROJECTS_KEY = 'magicApi.projects';

export interface MagicApiProjectData {
  id: string; // 项目ID (自动生成)
  name: string; // 项目名称
  url: string; // 服务地址 (唯一标识)
  webPath: string; // Web路径
  description?: string; // 项目描述
  proxyEnable?: boolean; // 是否启用代理
  token?: string; // 访问令牌
  isOpened?: boolean; // 是否已在工作区打开
  createdAt?: number; // 创建时间
  updatedAt?: number; // 更新时间
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

export const MagicApiProjectService = Symbol('IMagicApiProjectService');

/**
 * Magic API 项目管理
 */
@injectable()
export class MagicApiProjectServiceImpl implements MagicApiProjectService {
  private readonly _onDidChangeProjects = new Emitter<void>()
  readonly onDidChangeProjects = this._onDidChangeProjects.event
  private readonly _onDidChangeProject = new Emitter<MagicApiProjectData>()
  readonly onDidChangeProject = this._onDidChangeProject.event
  private readonly _onDidChangeProjectsStatus = new Emitter<void>()
  readonly onDidChangeProjectsStatus = this._onDidChangeProjectsStatus.event
  private readonly _onDidChangeRecentlyOpened = new Emitter<void>()
  readonly onDidChangeRecentlyOpened = this._onDidChangeRecentlyOpened.event
  
  private projects: MagicApiProjectData[] = [];

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    @inject(StorageService) private readonly storageService: StorageService,
  ) {
    // 在构造函数中启动初始化
    this.initPromise = this.init();
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }
  
  private async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.projects = await this.loadProjects();
    this.initialized = true;
  }

  /**
   * 从存储加载项目
   */
  private async loadProjects(): Promise<MagicApiProjectData[]> {
    const projects = await this.storageService.getData<MagicApiProjectData[]>(PROJECTS_KEY, []);
    return projects;
  }

  /**
   * 保存项目到存储
   */
  private async saveProjects(): Promise<void> {
    await this.storageService.setData(PROJECTS_KEY, this.projects);
    this._onDidChangeProjects.fire();
  }

  /**
   * 生成项目ID（基于URL的hash或UUID）
   */
  private generateProjectId(url: string): string {
    return this.hashUrl(url);
  }

  /**
   * 对URL进行hash (如果选择方式2)
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `project_${Math.abs(hash).toString(16)}`;
  }

  /**
   * 规范化URL，用于比较
   */
  private normalizeUrl(url: string): string {
    // 移除末尾的斜杠，统一转为小写
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }

  /**
   * 根据URL查找项目索引
   */
  private findProjectIndexByUrl(url: string): number {
    const normalizedUrl = this.normalizeUrl(url);
    return this.projects.findIndex(project => 
      this.normalizeUrl(project.url) === normalizedUrl
    );
  }

  /**
   * 根据URL查找项目
   */
  private findProjectByUrl(url: string): MagicApiProjectData | undefined {
    const index = this.findProjectIndexByUrl(url);
    return index !== -1 ? this.projects[index] : undefined;
  }

  /**
   * 获取所有项目
   */
  async getProjects(): Promise<MagicApiProjectData[]> {
    await this.ensureInitialized();
    // return [...this.projects].sort((a, b) => {
    //   const timeA = a.updatedAt ?? 0;
    //   const timeB = b.updatedAt ?? 0;
    //   return timeB - timeA;
    // });
    return [...this.projects]
  }

  /**
   * 根据ID获取项目
   */
  async getProject(id: string): Promise<MagicApiProjectData | undefined> {
    await this.ensureInitialized();
    return this.projects.find(project => project.id === id);
  }

  /**
   * 根据URL获取项目
   */
  async getProjectByUrl(url: string): Promise<MagicApiProjectData | undefined> {
    await this.ensureInitialized();
    return this.findProjectByUrl(url);
  }

  /**
   * 创建项目
   */
  async createProject(params: CreateProjectParams): Promise<MagicApiProjectData | undefined> {
    await this.ensureInitialized();
    // 检查URL是否已存在
    const existingProject = this.findProjectByUrl(params.url);
    if (existingProject) {
      console.warn(`Project with URL ${params.url} already exists`);
      return undefined;
    }

    const now = Date.now();
    const project: MagicApiProjectData = {
      id: this.generateProjectId(params.url),
      name: params.name,
      url: params.url,
      webPath: params.webPath || '',
      description: params.description || '',
      proxyEnable: params.proxyEnable ?? false,
      isOpened: false,
      createdAt: now,
      updatedAt: now
    };

    this.projects.push(project);
    await this.saveProjects();
    this._onDidChangeProject.fire(project);
    return project;
  }

  /**
   * 删除项目（根据ID）
   */
  async deleteProject(id: string): Promise<void> {
    await this.ensureInitialized();
    const projectToDelete = await this.getProject(id);
    if (!projectToDelete) {
      return;
    }

    this.projects = this.projects.filter(project => project.id !== id);
    await this.removeFromRecentlyOpened(id);
    await this.saveProjects();
    this._onDidChangeProject.fire(projectToDelete);
  }

  /**
   * 删除项目（根据URL）
   */
  async deleteProjectByUrl(url: string): Promise<void> {
    await this.ensureInitialized();
    const projectToDelete = this.findProjectByUrl(url);
    if (!projectToDelete) {
      return;
    }

    await this.deleteProject(projectToDelete.id);
  }

  /**
   * 更新项目
   */
  async updateProject(project: MagicApiProjectData): Promise<boolean> {
    await this.ensureInitialized();
    const index = this.projects.findIndex(p => p.id === project.id);
    if (index === -1) {
      console.warn(`Project with ID ${project.id} not found`);
      return false;
    }

    // 如果URL被修改，检查新URL是否与其他项目冲突
    if (project.url !== this.projects[index].url) {
      const existingProject = this.findProjectByUrl(project.url);
      if (existingProject && existingProject.id !== project.id) {
        console.warn(`URL ${project.url} is already used by another project`);
        return false;
      }
    }

    this.projects[index] = { 
      ...project, 
      updatedAt: Date.now() 
    };
    await this.saveProjects();
    this._onDidChangeProject.fire(project);
    return true;
  }

  /**
   * 根据URL更新项目
   */
  async updateProjectByUrl(
    url: string, 
    updates: Partial<Omit<MagicApiProjectData, 'id' | 'url'>>
  ): Promise<boolean> {
    await this.ensureInitialized();
    const project = this.findProjectByUrl(url);
    if (!project) {
      return false;
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: Date.now()
    };

    return await this.updateProject(updatedProject);
  }

  
  /**
   * 更新项目访问令牌
   * @param id 项目ID
   * @param token 项目访问令牌
   */
  async updateProjectToken(id: string, token: string): Promise<boolean>{
    await this.ensureInitialized();
    const project = await this.getProject(id);
    if (!project) {
      return false;
    }

    project.token = token;
    await this.updateProject(project);
    return true;
  }

  /**
   * 更新项目打开状态
   */
  async updateProjectOpenStatus(projectId: string, isOpened: boolean): Promise<boolean> {
    await this.ensureInitialized();
    const project = await this.getProject(projectId);
    if (!project) {
      return false;
    }

    project.isOpened = isOpened;
    await this.updateProject(project);
    
    if (isOpened) {
      await this.addToRecentlyOpened(projectId);
    }
    
    return true;
  }

  /**
   * 获取所有打开的项目
   */
  async getOpenedProjects(): Promise<MagicApiProjectData[]> {
    await this.ensureInitialized();
    return this.projects.filter(project => project.isOpened);
  }

  /**
   * 关闭所有项目
   */
  async closeAllProjects(): Promise<void> {
    await this.ensureInitialized();
    this.projects.forEach(project => {
      project.isOpened = false;
    });
    await this.saveProjects();
    await this.storageService.setData(RECENTLY_OPENED_PROJECTS_KEY, []);
    this._onDidChangeProjects.fire();
    this._onDidChangeRecentlyOpened.fire();
  }

  /**
   * 获取最后打开的项目
   */
  async getLastOpenProject(): Promise<MagicApiProjectData | undefined> {
    await this.ensureInitialized();
    const recentProjects = await this.getRecentlyOpenedProjects();
    if (recentProjects.length === 0) {
      return undefined;
    }

    const lastProjectId = recentProjects[0]?.id;
    if (!lastProjectId) {
      return undefined;
    }

    return await this.getProject(lastProjectId);
  }

  /**
   * 获取最近打开的项目
   */
  async getRecentlyOpenedProjects(): Promise<MagicApiProjectData[]> {
    await this.ensureInitialized();
    const projects = await this.storageService.getData<MagicApiProjectData[]>(RECENTLY_OPENED_PROJECTS_KEY, []);
    return projects;
  }

  /**
   * 添加项目到最近打开列表
   */
  async addToRecentlyOpened(projectId: string): Promise<void> {
    await this.ensureInitialized();
    const recentProjects = await this.getRecentlyOpenedProjects();
    const project = await this.getProject(projectId);
    
    if (!project) {
      return;
    }

    const filteredProjects = recentProjects.filter(p => p.id !== projectId);
    const updatedProjects = [project, ...filteredProjects];
    const limitedProjects = updatedProjects.slice(0, 10);
    
    await this.storageService.setData(RECENTLY_OPENED_PROJECTS_KEY, limitedProjects);
    this._onDidChangeRecentlyOpened.fire();
  }

  /**
   * 从最近打开列表中移除项目
   */
  async removeFromRecentlyOpened(projectId: string): Promise<void> {
    await this.ensureInitialized();
    const recentProjects = await this.getRecentlyOpenedProjects();
    const filteredProjects = recentProjects.filter(p => p.id !== projectId);
    await this.storageService.setData(RECENTLY_OPENED_PROJECTS_KEY, filteredProjects);
    this._onDidChangeRecentlyOpened.fire();
  }

  /**
   * 搜索项目
   */
  async searchProjects(keyword: string): Promise<MagicApiProjectData[]> {
    await this.ensureInitialized();
    if (!keyword || keyword.trim() === '') {
      return this.getProjects();
    }

    const searchTerm = keyword.toLowerCase().trim();
    return this.projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm) ||
      project.url.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * 检查项目是否存在（根据URL）
   */
  async hasProject(url: string): Promise<boolean> {
    await this.ensureInitialized();
    const project = this.findProjectByUrl(url);
    return !!project;
  }

  /**
   * 检查项目是否存在（根据ID）
   */
  async hasProjectById(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const project = await this.getProject(id);
    return !!project;
  }

  /**
   * 批量删除项目
   */
  async deleteProjects(ids: string[]): Promise<void> {
    await this.ensureInitialized();
    const projectsToDelete = this.projects.filter(project => ids.includes(project.id));
    this.projects = this.projects.filter(project => !ids.includes(project.id));
    
    for (const id of ids) {
      await this.removeFromRecentlyOpened(id);
    }
    
    await this.saveProjects();
    projectsToDelete.forEach(project => {
      this._onDidChangeProject.fire(project);
    });
  }

  /**
   * 导出项目数据
   */
  async exportProjects(ids?: string[]): Promise<MagicApiProjectData[]> {
    await this.ensureInitialized();
    if (ids && ids.length > 0) {
      return this.projects.filter(project => ids.includes(project.id));
    }
    return this.getProjects();
  }

  /**
   * 导入项目数据
   */
  async importProjects(projects: MagicApiProjectData[]): Promise<{ success: number; failed: number }> {
    await this.ensureInitialized();
    let success = 0;
    let failed = 0;

    for (const project of projects) {
      // 检查URL是否已存在
      const existingProject = this.findProjectByUrl(project.url);
      if (existingProject) {
        failed++;
        continue;
      }

      // 重新生成ID，避免冲突
      const newProject = {
        ...project,
        id: this.generateProjectId(project.url),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.projects.push(newProject);
      success++;
    }

    if (success > 0) {
      await this.saveProjects();
    }

    return { success, failed };
  }
}