import { JSONValue } from '@lumino/coreutils';
import { Deferred, DisposableCollection } from '../common';
import { ContributionProvider } from '../common/contribution-provider';
import { PreferenceProvider } from './preference-provider';
import { PreferenceChange, PreferenceProperty } from './preference-types';
export declare class PreferenceService {
    /** 偏好变更事件（对外暴露） */
    private readonly changeEmitter;
    readonly onDidPreferenceChanged: import("vscode-jsonrpc/lib/common/events").Event<PreferenceChange>;
    private schemaService;
    protected readonly providers: ContributionProvider<PreferenceProvider>;
    /** 作用域->Provider映射 */
    private providerMap;
    protected readonly toDispose: DisposableCollection;
    protected readonly _ready: Deferred<void>;
    get ready(): Promise<void>;
    protected _isReady: boolean;
    get isReady(): boolean;
    protected initializeProviders(): Promise<void>;
    init(): void;
    /** 获取偏好值（用户配置优先，其次默认值） */
    get<T>(key: string, value?: any): T;
    /** 设置偏好值（仅支持用户级） */
    set(key: string, value: JSONValue): Promise<boolean>;
    updateValue(key: string, value: JSONValue): Promise<void>;
    /** 获取键的属性定义 */
    getProperty(key: string): PreferenceProperty;
    /** 检查键是否允许修改 */
    isOverridable(key: string): boolean;
    /** 获取所有偏好键 */
    getAllKeys(): string[];
    /** 获取所有偏好属性定义 */
    getSchemaProperties(): ReadonlyMap<string, PreferenceProperty>;
}
