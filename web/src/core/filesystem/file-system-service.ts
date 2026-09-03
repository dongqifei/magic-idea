import { multiInject, injectable, inject } from "inversify";
import { Signal, ISignal } from "@lumino/signaling";
import { createElement } from "react";
import URI from "../common/uri";
import { Emitter, DisposableCollection } from "../common";
import { HashUtils } from "../common/hash-utils";
import { StorageService } from "../storage";
import {
  FileData,
  FileState,
  FileSaveStatus,
  FileChange,
  FileChangeType,
  FileSystemProvider,
  FileSystemService,
  FileLoadStatus, 
  FilePropertyProvider
} from "./file-system-types";
import { FileRunService } from "./file-run-service";
import { NotificationService } from '../notification'

@injectable()
export class DefaultFileSystemProvider implements FileSystemProvider {
  scheme = 'invalid'; // 默认文件系统方案

  async search(keyword: string): Promise<any> {
    return [];
  }

  async mkdir(uri: URI, data: FileData): Promise<void> {
    // 实现创建文件夹/分组逻辑
  }

  async readFile(uri: URI): Promise<FileData> {
    // 实现读取文件的逻辑，例如从本地文件系统中加载数据
    return {} as FileData; // 这里仅为示意，实际应替换为真实的文件内容
  }

  async writeFile(uri: URI, data: FileData, auto?: string): Promise<void> {
    // 实现写入文件的逻辑，例如保存到本地文件系统
  }

  async move(source: URI, target: URI): Promise<void> {
    // 实现移动文件/分组的逻辑
  }

  async delete(uri: URI): Promise<void> {
    // 实现删除文件的逻辑，例如从本地文件系统中删除文件
  }
}

@injectable()
export class DefaultFilePropertyProvider implements FilePropertyProvider {
  matches(uri: URI, fileData: FileData): boolean {
    return false;
  }

  getFormComponent(fileData: FileData, onUpdate: (data: Partial<FileData>) => void) {
    // 返回一个表单组件
    return createElement(""); // 这里仅为示意，实际应替换为真实的React元素
  }
}

@injectable()
export class SimpleFileSystemService implements FileSystemService {
  private readonly providers = new Map<string, FileSystemProvider>();
  private readonly disposables = new DisposableCollection();

  private readonly MAX_RECENT_FILES = 20; // 最大最近打开文件数
  private readonly RECENT_FILES_STORAGE_KEY = 'recentlyOpenedFileIds';

  // 属性贡献者管理
  private readonly propertyProviders: FilePropertyProvider[] = [];

  private _states = new Map<string, FileState>(); // uri -> FileState

  // 属性修改的上下文（用于AI实时更新文件属性，同步UI）
  private readonly onDidUpdatedPropertyEmitter = new Emitter<Partial<FileData>>();
  public readonly onPropertyUpdatedEvent = this.onDidUpdatedPropertyEmitter.event;

  private onDidChangedFileDataEmitter = new Signal<this, FileChange>(this);
  private onDidChangedFileStateEmitter = new Signal<this, FileState>(this);

  protected readonly onDidChangeReadonlyEmitter = new Emitter<boolean>();

  readonly onDidChangeReadOnly = this.onDidChangeReadonlyEmitter.event;

  get onDidFileStateChange(): ISignal<this, FileState> {
    return this.onDidChangedFileStateEmitter;
  }

  get onDidFileDataChange(): ISignal<this, FileChange> {
    return this.onDidChangedFileDataEmitter;
  }

  constructor(
    @inject(StorageService) private readonly storageService: StorageService,
    @multiInject(FileSystemProvider)
    private readonly fileSystemProvider: FileSystemProvider[],
    @multiInject(FilePropertyProvider)
    propertyContributors: FilePropertyProvider[] = [],
    @inject(FileRunService) private readonly fileRunService: FileRunService<FileData>,
    @inject(NotificationService) private notificationService: NotificationService,
  ) {
    for (const provider of this.fileSystemProvider) {
      this.registerProvider(provider.scheme, provider);
    }
    // 注册文件属性贡献者
    this.propertyProviders = propertyContributors;
  }

  registerProvider(scheme: string, provider: FileSystemProvider): void {
    this.providers.set(scheme, provider);
    this.disposables.push({
      dispose: () => this.providers.delete(scheme),
    });
  }

  getProvider(scheme: string): FileSystemProvider {
    const provider = this.providers.get(scheme);
    if(!provider){
      throw new Error(`No provider found for scheme: ${scheme}`);
    }
    return provider;
  }

  // 获取文件对应的属性配置贡献者
  getPropertyProvider(uri: URI, fileData: FileData): FilePropertyProvider | undefined {
    return this.propertyProviders.find(provider => provider.matches(uri, fileData));
  }
  

  // 在文件中根据关键字查找资源，返回匹配的资源列表
  async search(scheme: string, keyword: string): Promise<any> {
    const provider = this.getProvider(scheme);
    return provider.search(keyword);
  }

  async doTest(uri: URI, isDebug?: boolean): Promise<void> {
    const fileData = this.getFileData(uri);
    await this.fileRunService.doTest(uri, fileData, isDebug);
  }

  async mkdir(uri: URI, data: FileData): Promise<void> { 
    const provider = this.getProvider(uri.scheme);
    const fileInfo = { ...data }; // 避免直接修改传入的fileData对象，以防外部调用者误操作导致问题
    delete fileInfo.uri;
    delete fileInfo.fullPath;
    delete fileInfo.isTemp; 
    delete fileInfo.fullPathName;
    await provider.mkdir(uri, fileInfo);
  }

  /**
   * 读取文件（添加缓存+加载状态+即时反馈）
   */
  async readFile(uri: URI, initData?: FileData): Promise<FileData> {
    const uriStr = this.uriToString(uri);
    const state = this._getOrCreateState(uri, initData);

    // 1. 检查缓存：已加载完成直接返回
    if (state.loadStatus === FileLoadStatus.SUCCESS && state.fileData) {
      // 仍记录最近打开（即使缓存命中）
      this._recordRecentlyOpenedFileId(uri).catch(console.error);
      return state.fileData;
    }

    // 2. 正在加载中：返回同一个Promise，避免重复请求
    if (state.loadStatus === FileLoadStatus.LOADING && state.loadPromise) {
      return state.loadPromise;
    }

    // 3. 未加载/加载失败：开始异步加载（先更新状态，保证即时反馈）
    const provider = this.getProvider(uri.scheme);

    // 同步更新加载状态（关键：即时反馈）
    state.loadStatus = FileLoadStatus.LOADING;
    state.loadError = undefined;
    this.onDidChangedFileStateEmitter.emit({ ...state });

    // 异步执行加载逻辑，不阻塞状态更新
    const loadPromise = (async () => {
      try {
        // 优先从缓存取，没有则调用provider
        let fileData: FileData = await provider.readFile(uri);
        
        // 更新文件数据和状态
        await this.updateFileData(uri, fileData);
        
        // 初始化时保存旧数据
        state.oldFileData = {...fileData};
        state.loadStatus = FileLoadStatus.SUCCESS;
        state.loadError = undefined;
        this.onDidChangedFileStateEmitter.emit({ ...state });
        
        // 记录最近打开
        await this._recordRecentlyOpenedFileId(uri);
        
        return fileData;
      } catch (error) {
        // 标记加载失败
        state.loadStatus = FileLoadStatus.FAILED;
        state.loadError = error instanceof Error ? error.message : 'Failed to load file';
        this.onDidChangedFileStateEmitter.emit({ ...state });
        throw error; // 抛出错误让上层处理
      } finally {
        // 清空加载Promise
        state.loadPromise = undefined;
      }
    })();

    // 保存加载Promise到状态，用于防重复请求
    state.loadPromise = loadPromise;
    this._states.set(uriStr, state);

    return loadPromise;
  }

  async writeFile(uri: URI, fileData: FileData, auto?: string): Promise<boolean> {
    const provider = this.getProvider(uri.scheme);

    try {
      const fileInfo = { ...fileData }; // 避免直接修改传入的fileData对象，以防外部调用者误操作导致问题
      delete fileInfo.uri;
      delete fileInfo.fullPath;
      delete fileInfo.isTemp; 
      delete fileInfo.fullPathName;
      await provider.writeFile(uri, fileInfo, auto);
      this.markSaved(uri);
      return true;
    } catch (error: any) {
      console.error(`Failed to write file ${uri.toString()}:`, error);
      this.notificationService.error("保存失败:" + error.message)
      throw error;
    }
  }

  async move(source: URI, target: URI): Promise<void> {
    const sourceProvider = this.getProvider(source.scheme);
    const targetProvider = this.getProvider(target.scheme);
    await targetProvider.move(source, target);
  }

  async delete(uri: URI): Promise<void> {
    const provider = this.getProvider(uri.scheme);
    const data = this.getFileData(uri);
    if(data && data.isTemp){
      this.cleanupState(uri);
    }else{
      await provider.delete(uri);
    }
  }

  async revert(uri: URI): Promise<void> {
    const data = this.getFileState(uri);
    if (!data) {
      return;
    }
    await this.updateFileData(uri, {...data.oldFileData})
  }

  async exists(uri: URI): Promise<boolean> {
    const provider = this.getProvider(uri.scheme);
    try {
      await provider.readFile(uri);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Tests if the service (i.e. any of its registered {@link FileSystemProvider}s) can handle the given resource.
   * @param resource `URI` of the resource to test.
   *
   * @returns `true` if the resource can be handled, `false` otherwise.
   */
  canHandleResource(resource: URI): boolean {
    return this.providers.has(resource.scheme);
  }
  
  /**
   * 更新文件属性（触发属性更新事件）
   * @param uri 文件路径
   * @param updates 要更新的属性
   */
  updateProperty(uri: URI, updates: Partial<FileData>){
    this.onDidUpdatedPropertyEmitter.fire({ uri, ...updates});
  }

  /**
   * 更新文件数据（支持增量更新）
   * @param uri 文件路径
   * @param data 要更新的FileData属性（可以是部分属性）
   */
  async updateFileData(
    uri: URI,
    data: Partial<FileData>
  ): Promise<boolean> {
    const state = this._getOrCreateState(uri);
    // 合并新旧数据（初始化或增量更新）
    const oldData = state.fileData || ({} as FileData);
    const newData: FileData = { ...oldData, ...data };

    // 计算新数据的哈希
    const contentStr = JSON.stringify(newData, (key, value) => {
      if (key === 'uri') {
        return value.toString(); 
      }
      return value;
    });
    const newHash = await HashUtils.computeHash(contentStr);

    // 检查是否有变化
    const hasChange = newHash !== state.contentHash;
    if (hasChange) {
      state.fileData = newData;
      state.contentHash = newHash;
      state.lastModifiedTime = Date.now();

      // 首次加载时初始化lastSavedHash
      if (state.lastSavedHash === undefined) {
        state.lastSavedHash = newHash;
        return false;
      }

      // 更新脏状态
      const isDirty = newHash !== state.lastSavedHash;
      if (isDirty !== state.isDirty) {
        isDirty ? this.markDirty(uri) : this.markClean(uri);
      }
    }

    // 原有变更历史记录保留（兼容原有_onDataChange信号）
    this._recordChange(uri, FileChangeType.CHANGED);

    return hasChange;
  }

  /**
   * 获取完整的FileData
   * @param uri 文件路径
   */
  getFileData(uri: URI): FileData | undefined {
    return this._states.get(this.uriToString(uri))?.fileData;
  }

  /**
   * 获取文件状态
   * @param uri 文件路径
   * @returns 文件状态
   */
  getFileState(uri: URI): FileState | undefined {
    let state = this._states.get(this.uriToString(uri));
    if (!state) {
      return undefined;
    }
    return { ...state }; // 返回副本防止外部修改
  }

  /**
   * 获取所有处于脏状态的文件路径
   * @returns 脏文件路径数组
   */
  getDirtyFileUris(): URI[] {
    return Array.from(this._states.entries())
      .filter(([_, state]) => state.isDirty)
      .map(([_, data]) => data.uri);
  }

  /**
   * 获取最近打开的文件ID列表（按追加顺序，最多20个）
   * @returns 文件ID数组（即uri.toString()结果）
   */
  async getRecentlyOpenedFileIds(): Promise<string[]> {
    return await this.storageService.getData<string[]>(this.RECENT_FILES_STORAGE_KEY) || [];
  }

  /**
   * 清空最近打开的文件ID列表
   */
  async clearRecentlyOpenedFileIds(): Promise<void> {
    await this.saveRecentlyOpenedFileIds([]);
  }

  /**
   * 清理指定文件的状态数据
   * 模型彻底销毁后，模型状态数据不再需要，可以清理
   * @param uri 文件路径
   */
  cleanupState(uri: URI): void {
    this.markClean(uri);
    // this._recordChange(uri, FileChangeType.CHANGED);
    this._states.delete(this.uriToString(uri));
  }

  /**
   * 新增：清除文件缓存（用于资源更新后重新加载）
   */
  clearFileCache(uri: URI): void {
    const state = this._getOrCreateState(uri);
    state.loadStatus = FileLoadStatus.IDLE;
    state.fileData = undefined;
    state.contentHash = undefined;
    state.lastSavedHash = undefined;
    this._states.set(this.uriToString(uri), state);
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.disposables.dispose();
  }

  private uriToString(uri: URI): string{
    return uri.toString();
  }
  
  /**
   * 标记文件为脏
   * @param uri
   */
  private markDirty(uri: URI): void {
    const state = this._getOrCreateState(uri);
    if (!state.isDirty) {
      state.isDirty = true;
      state.lastModifiedTime = Date.now();
      this.onDidChangedFileStateEmitter.emit({ ...state });
    }
  }

  /**
   * 标记文件为已保存
   * @param uri
   * @param ETag
   */
  private markSaved(uri: URI): void {
    const state = this._getOrCreateState(uri);
    state.isDirty = false;
    state.saveStatus = FileSaveStatus.SAVED;
    state.lastSavedTime = Date.now();
    state.version++;
    state.lastSavedHash = state.contentHash; // 保存当前哈希作为基准
    this.onDidChangedFileStateEmitter.emit({ ...state });
    // 记录变更历史
    this._recordChange(uri, FileChangeType.CHANGED);
  }

  /**
   * 标记文件为干净状态
   */
  private markClean(uri: URI): void {
    const state = this._getOrCreateState(uri);
    if (state.isDirty) {
      state.isDirty = false;
      this.onDidChangedFileStateEmitter.emit({ ...state });
    }
  }

  /**
   * 获取或创建文件状态（内部使用）
   */
  private _getOrCreateState(uri: URI, initData?: FileData): FileState {
    let state = this._states.get(this.uriToString(uri));
    if (!state) {
      state = {
        uri,
        isDirty: false,
        saveStatus: FileSaveStatus.UNSAVED,
        lastSavedTime: null,
        lastModifiedTime: null,
        fileData: initData || {} as FileData,
        version: 0,
        loadStatus: FileLoadStatus.IDLE, // 默认空闲状态
        loadError: undefined,            // 默认无错误
        loadPromise: undefined           // 默认无加载Promise
      };
      this._states.set(this.uriToString(uri), state);
    }
    return state;
  }

  /**
   * 记录文件状态改变
   */
  private _recordChange(
    uri: URI,
    type: FileChangeType,
  ): void {
    const fileState = this._states.get(this.uriToString(uri));
    const isDirty = fileState?.isDirty;
    const data = fileState?.fileData;
    const change: FileChange = {
      type,
      uri,
      isDirty,
      data,
      timestamp: Date.now(),
    };

    this.onDidChangedFileDataEmitter.emit(change);
  }

  /**
   * 记录最近打开的文件ID（仅存ID，按追加顺序，去重+限制20个）
   * @param uri 文件URI，用于生成唯一文件ID
   */
  private async _recordRecentlyOpenedFileId(uri: URI): Promise<void> {
    const fileId = this.uriToString(uri);
    const _recentlyOpenedFileIds = await this.getRecentlyOpenedFileIds() || [];

    // 1. 去重：移除已存在的该文件ID（确保重复打开时后续追加为最新）
    const recentlyOpenedFileIds = _recentlyOpenedFileIds.filter(id => id !== fileId);

    // 2. 按顺序追加到数组末尾（满足"依次往集合中追加"的需求）
    recentlyOpenedFileIds.push(fileId);

    // 3. 限制最多20个文件：超出时删除数组头部的最旧记录
    if (recentlyOpenedFileIds.length > this.MAX_RECENT_FILES) {
      recentlyOpenedFileIds.shift(); // 删除数组第一个元素（最旧的记录）
    }
    await this.saveRecentlyOpenedFileIds(recentlyOpenedFileIds);
  }

  private async saveRecentlyOpenedFileIds(fileIds: string[]): Promise<void> {
    this.storageService.setData(this.RECENT_FILES_STORAGE_KEY, fileIds);
  }
}