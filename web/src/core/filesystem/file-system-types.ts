import { ISignal } from "@lumino/signaling";
import { ReactElement } from 'react';
import { IEvent as Event } from "../common";
import URI from "../common/uri";

export enum FileType {
    File = 1,
    Directory = 2,
    SymbolicLink = 64
}

export enum FileLoadStatus {
  IDLE = 'idle',       // 未加载
  LOADING = 'loading', // 加载中
  SUCCESS = 'success', // 加载成功
  FAILED = 'failed'    // 加载失败
}

export enum FileChangeType {
  INITED = 'inited',
  CREATED = 'created',
  CHANGED = 'changed',
  DELETED = 'deleted'
}

export enum FileSaveStatus {
  UNSAVED = 'unsaved',
  SAVING = 'saving',
  SAVED = 'saved',
  FAILED = 'failed'
}

export interface FileChange {
  type: FileChangeType;
  uri: URI;
  isDirty?: boolean;
  data?: FileData;
  timestamp: number;
}

export interface FileState {
  uri: URI;
  isDirty: boolean;
  saveStatus: FileSaveStatus;
  lastSavedTime: number | null;
  lastModifiedTime: number | null;
  version: number; // 版本号，每次保存递增
  contentHash?: string; // 内容哈希值
  lastSavedHash?: string; // 最后保存的哈希值
  oldFileData?: FileData; // 原数据
  fileData?: FileData; // 新数据
  loadStatus?: FileLoadStatus; // 加载状态
  loadError?: string;          // 加载错误信息
  loadPromise?: Promise<FileData>; // 当前加载的Promise，用于避免重复请求
}

/**
 * 文件数据结构定义
 */
export type FileData = {
  id: string;
  name: string; // 允许为null以适应你的数据结构
  path?: string;
  parentId?: string;
  groupId?: string;
  type?: string; // 文件类型 （例如 "api", "function", "datasource"）
  lock?: boolean | null;
  script?: string | null;
  createTime?: number | string | null; // 兼容数字和时间戳
  updateTime?: number | string | null;
  createBy?: string | null;
  updateBy?: string | null;
  uri?: URI; // 内部属性
  fullPath?: string; // 内部属性，用于显示完整的路径
  fullPathName?: string; // 内部属性，用于显示完整的路径名
  isTemp?: boolean; // 内部属性，是否为临时文件，用于区分是否需要持久化存储
};

// 文件系统提供者接口，便于扩展不同实现的文件系统服务
export interface FileSystemProvider {
    readonly scheme: string;
    // 基础文件操作
    search(keyword: string): Promise<any>;
    readFile(uri: URI): Promise<FileData>;
    writeFile(uri: URI, data: FileData, auto?: string): Promise<void>;
    // stat(uri: string): Promise<Stat>;
    mkdir(uri: URI, data: FileData): Promise<void>;
    // readdir(uri: string): Promise<[string, FileType][]>;
    move(source: URI, target: URI): Promise<void>
    delete(uri: URI): Promise<void>;
    // rename(from: string, to: string): Promise<void>;

    // // 事件监听
    // onFileChange(listener: (changes: FileChange[]) => void): void;
    // offFileChange(listener: (changes: FileChange[]) => void): void;
}
export const FileSystemProvider = Symbol('FileSystemProvider');


/**
 * 文件属性配置提供者接口
 */
export interface FilePropertyProvider {
  /**
   * 匹配文件类型（返回true表示当前贡献者可处理该文件）
   */
  matches(uri: URI, fileData?: FileData): boolean;

  /**
   * 获取属性配置表单组件
   */
  getFormComponent(fileData: FileData, onUpdate: (data: Partial<FileData>) => void): ReactElement;
}

export const FilePropertyProvider = Symbol('FilePropertyProvider');

// 定义文件系统接口
export interface FileSystemService {
  readonly readOnly?: boolean;
  onDidFileDataChange: ISignal<this, FileChange>;
  onDidFileStateChange: ISignal<this, FileState>;
  onPropertyUpdatedEvent: Event<Partial<FileData>>;
  onDidChangeReadOnly: Event<boolean>;
  registerProvider(scheme: string, provider: FileSystemProvider): void;
  getProvider(scheme: string): FileSystemProvider | undefined;
  getPropertyProvider(uri: URI, fileData?: FileData): FilePropertyProvider | undefined;

  search(scheme: string, keyword: string): Promise<any>;
  doTest(uri: URI, isDebug?: boolean): Promise<void>;
  mkdir(uri: URI, data: FileData): Promise<void>;
  readFile(uri: URI, initData?: FileData): Promise<FileData>;
  writeFile(uri: URI, data: FileData, auto?: string): Promise<boolean>;
  move(source: URI, target: URI): Promise<void>
  delete(uri: URI): Promise<void>;
  revert(uri: URI): Promise<void>;
  exists(uri: URI): Promise<boolean>;

  /**
   * Tests if the service (i.e. any of its registered {@link FileSystemProvider}s) can handle the given resource.
   * @param resource `URI` of the resource to test.
   *
   * @returns `true` if the resource can be handled, `false` otherwise.
   */
  canHandleResource(resource: URI): boolean;
  updateFileData(uri: URI, data: Partial<FileData>): Promise<boolean>;
  updateProperty(uri: URI, updates: Partial<FileData>): void;
  getFileData(uri: URI): FileData | undefined;
  getFileState(uri: URI): FileState | undefined;
  getDirtyFileUris(): URI[];
  getRecentlyOpenedFileIds(): Promise<string[]>;
  clearRecentlyOpenedFileIds(): Promise<void>;
  cleanupState(uri: URI): void;
}
export const FileSystemService = Symbol('FileSystemService');