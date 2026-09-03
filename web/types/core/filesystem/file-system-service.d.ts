import { ISignal } from "@lumino/signaling";
import URI from "../common/uri";
import { Emitter } from "../common";
import { StorageService } from "../storage";
import { FileData, FileState, FileChange, FileSystemProvider, FileSystemService, FilePropertyProvider } from "./file-system-types";
import { FileRunService } from "./file-run-service";
import { NotificationService } from '../notification';
export declare class DefaultFileSystemProvider implements FileSystemProvider {
    scheme: string;
    search(keyword: string): Promise<any>;
    mkdir(uri: URI, data: FileData): Promise<void>;
    readFile(uri: URI): Promise<FileData>;
    writeFile(uri: URI, data: FileData, auto?: string): Promise<void>;
    move(source: URI, target: URI): Promise<void>;
    delete(uri: URI): Promise<void>;
}
export declare class DefaultFilePropertyProvider implements FilePropertyProvider {
    matches(uri: URI, fileData: FileData): boolean;
    getFormComponent(fileData: FileData, onUpdate: (data: Partial<FileData>) => void): import("react").DOMElement<import("react").DOMAttributes<Element>, Element>;
}
export declare class SimpleFileSystemService implements FileSystemService {
    private readonly storageService;
    private readonly fileSystemProvider;
    private readonly fileRunService;
    private notificationService;
    private readonly providers;
    private readonly disposables;
    private readonly MAX_RECENT_FILES;
    private readonly RECENT_FILES_STORAGE_KEY;
    private readonly propertyProviders;
    private _states;
    private readonly onDidUpdatedPropertyEmitter;
    readonly onPropertyUpdatedEvent: import("vscode-jsonrpc/lib/common/events").Event<Partial<FileData>>;
    private onDidChangedFileDataEmitter;
    private onDidChangedFileStateEmitter;
    protected readonly onDidChangeReadonlyEmitter: Emitter<boolean>;
    readonly onDidChangeReadOnly: import("vscode-jsonrpc/lib/common/events").Event<boolean>;
    get onDidFileStateChange(): ISignal<this, FileState>;
    get onDidFileDataChange(): ISignal<this, FileChange>;
    constructor(storageService: StorageService, fileSystemProvider: FileSystemProvider[], propertyContributors: FilePropertyProvider[], fileRunService: FileRunService<FileData>, notificationService: NotificationService);
    registerProvider(scheme: string, provider: FileSystemProvider): void;
    getProvider(scheme: string): FileSystemProvider;
    getPropertyProvider(uri: URI, fileData: FileData): FilePropertyProvider | undefined;
    search(scheme: string, keyword: string): Promise<any>;
    doTest(uri: URI, isDebug?: boolean): Promise<void>;
    mkdir(uri: URI, data: FileData): Promise<void>;
    /**
     * 读取文件（添加缓存+加载状态+即时反馈）
     */
    readFile(uri: URI, initData?: FileData): Promise<FileData>;
    writeFile(uri: URI, fileData: FileData, auto?: string): Promise<boolean>;
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
    /**
     * 更新文件属性（触发属性更新事件）
     * @param uri 文件路径
     * @param updates 要更新的属性
     */
    updateProperty(uri: URI, updates: Partial<FileData>): void;
    /**
     * 更新文件数据（支持增量更新）
     * @param uri 文件路径
     * @param data 要更新的FileData属性（可以是部分属性）
     */
    updateFileData(uri: URI, data: Partial<FileData>): Promise<boolean>;
    /**
     * 获取完整的FileData
     * @param uri 文件路径
     */
    getFileData(uri: URI): FileData | undefined;
    /**
     * 获取文件状态
     * @param uri 文件路径
     * @returns 文件状态
     */
    getFileState(uri: URI): FileState | undefined;
    /**
     * 获取所有处于脏状态的文件路径
     * @returns 脏文件路径数组
     */
    getDirtyFileUris(): URI[];
    /**
     * 获取最近打开的文件ID列表（按追加顺序，最多20个）
     * @returns 文件ID数组（即uri.toString()结果）
     */
    getRecentlyOpenedFileIds(): Promise<string[]>;
    /**
     * 清空最近打开的文件ID列表
     */
    clearRecentlyOpenedFileIds(): Promise<void>;
    /**
     * 清理指定文件的状态数据
     * 模型彻底销毁后，模型状态数据不再需要，可以清理
     * @param uri 文件路径
     */
    cleanupState(uri: URI): void;
    /**
     * 新增：清除文件缓存（用于资源更新后重新加载）
     */
    clearFileCache(uri: URI): void;
    /**
     * 释放资源
     */
    dispose(): void;
    private uriToString;
    /**
     * 标记文件为脏
     * @param uri
     */
    private markDirty;
    /**
     * 标记文件为已保存
     * @param uri
     * @param ETag
     */
    private markSaved;
    /**
     * 标记文件为干净状态
     */
    private markClean;
    /**
     * 获取或创建文件状态（内部使用）
     */
    private _getOrCreateState;
    /**
     * 记录文件状态改变
     */
    private _recordChange;
    /**
     * 记录最近打开的文件ID（仅存ID，按追加顺序，去重+限制20个）
     * @param uri 文件URI，用于生成唯一文件ID
     */
    private _recordRecentlyOpenedFileId;
    private saveRecentlyOpenedFileIds;
}
