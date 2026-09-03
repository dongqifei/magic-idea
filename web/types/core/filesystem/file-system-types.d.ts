import { ISignal } from "@lumino/signaling";
import { ReactElement } from 'react';
import { IEvent as Event } from "../common";
import URI from "../common/uri";
export declare enum FileType {
    File = 1,
    Directory = 2,
    SymbolicLink = 64
}
export declare enum FileLoadStatus {
    IDLE = "idle",// 未加载
    LOADING = "loading",// 加载中
    SUCCESS = "success",// 加载成功
    FAILED = "failed"
}
export declare enum FileChangeType {
    INITED = "inited",
    CREATED = "created",
    CHANGED = "changed",
    DELETED = "deleted"
}
export declare enum FileSaveStatus {
    UNSAVED = "unsaved",
    SAVING = "saving",
    SAVED = "saved",
    FAILED = "failed"
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
    version: number;
    contentHash?: string;
    lastSavedHash?: string;
    oldFileData?: FileData;
    fileData?: FileData;
    loadStatus?: FileLoadStatus;
    loadError?: string;
    loadPromise?: Promise<FileData>;
}
/**
 * 文件数据结构定义
 */
export type FileData = {
    id: string;
    name: string;
    path?: string;
    parentId?: string;
    groupId?: string;
    type?: string;
    lock?: boolean | null;
    script?: string | null;
    createTime?: number | string | null;
    updateTime?: number | string | null;
    createBy?: string | null;
    updateBy?: string | null;
    uri?: URI;
    fullPath?: string;
    fullPathName?: string;
    isTemp?: boolean;
};
export interface FileSystemProvider {
    readonly scheme: string;
    search(keyword: string): Promise<any>;
    readFile(uri: URI): Promise<FileData>;
    writeFile(uri: URI, data: FileData, auto?: string): Promise<void>;
    mkdir(uri: URI, data: FileData): Promise<void>;
    move(source: URI, target: URI): Promise<void>;
    delete(uri: URI): Promise<void>;
}
export declare const FileSystemProvider: unique symbol;
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
export declare const FilePropertyProvider: unique symbol;
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
    move(source: URI, target: URI): Promise<void>;
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
export declare const FileSystemService: unique symbol;
