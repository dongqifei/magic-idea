import { JSONObject, JSONValue } from '@lumino/coreutils';
import { Deferred, Disposable, DisposableCollection } from '../common';
import { PreferenceSchemaService } from './preference-schema-service';
import { PreferenceScope, PreferenceProviderDataChange, PreferenceResolveResult } from './preference-types';
/** 偏好Provider接口 */
export interface PreferenceProvider extends Disposable {
    ready: Promise<void>;
    getScopes(): PreferenceScope[];
    canHandleScope(scope: PreferenceScope): boolean;
    get<T>(key: string): T | undefined;
    setPreference(key: string, value: JSONValue): Promise<boolean>;
    resolve<T>(key: string): PreferenceResolveResult<T>;
    getPreferences(): JSONObject;
    onDidChange: (callback: (changes: Record<string, PreferenceProviderDataChange>) => void) => void;
}
export declare const PreferenceProvider: unique symbol;
/** 默认值Provider（基于Schema） */
export declare class DefaultsPreferenceProvider implements PreferenceProvider {
    private schemaService;
    protected readonly _ready: Deferred<void>;
    private readonly emitter;
    readonly onDidChange: import("vscode-jsonrpc/lib/common/events").Event<Record<string, PreferenceProviderDataChange>>;
    protected readonly toDispose: DisposableCollection;
    constructor(schemaService: PreferenceSchemaService);
    /**
     * Resolved when the preference provider is ready to provide preferences
     * It should be resolved by subclasses.
     */
    get ready(): Promise<void>;
    getScopes(): PreferenceScope[];
    canHandleScope(scope: PreferenceScope): boolean;
    get<T>(key: string): T | undefined;
    setPreference(): Promise<boolean>;
    resolve<T>(key: string): PreferenceResolveResult<T>;
    getPreferences(): JSONObject;
    dispose(): void;
}
/** 浏览器存储的用户偏好Provider */
export declare class BrowserPreferenceProvider implements PreferenceProvider {
    protected readonly _ready: Deferred<void>;
    private readonly emitter;
    readonly onDidChange: import("vscode-jsonrpc/lib/common/events").Event<Record<string, PreferenceProviderDataChange>>;
    private storage;
    private static STORAGE_KEY;
    private schemaService;
    private storageService;
    protected readonly toDispose: DisposableCollection;
    constructor();
    get ready(): Promise<void>;
    /** 初始化：加载存储 + 监听多标签页同步 */
    init(): void;
    getScopes(): PreferenceScope[];
    canHandleScope(scope: PreferenceScope): boolean;
    get<T>(key: string): T | undefined;
    setPreference(key: string, value: JSONValue): Promise<boolean>;
    resolve<T>(key: string): PreferenceResolveResult<T>;
    getPreferences(): JSONObject;
    /** 导出用户配置为JSON字符串 */
    exportPreferences(): string;
    /** 导入用户配置 */
    importPreferences(content: string): Promise<boolean>;
    /** 加载偏好设置 */
    private loadFromStorage;
    /** 保存 */
    private saveToStorage;
    /** 监听localStorage变化（多标签页同步） */
    private listenToStorageChanges;
    /** 触发单个键变更事件 */
    private emitChanges;
    /** 触发全量变更事件 */
    private emitFullChanges;
    /** 触发新旧存储差异变更事件 */
    private emitDiffChanges;
    dispose(): void;
}
export declare namespace PreferenceUtils {
    function merge(source: JSONValue | undefined, target: JSONValue): JSONValue;
    /**
     * Handles deep equality with the possibility of `undefined`
     */
    function deepEqual(a: JSONValue | undefined, b: JSONValue | undefined): boolean;
}
