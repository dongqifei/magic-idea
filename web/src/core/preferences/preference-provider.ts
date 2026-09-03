import { injectable, inject, postConstruct } from 'inversify';
import { JSONExt, JSONObject, JSONValue } from '@lumino/coreutils';
import { Deferred, Emitter, Disposable, DisposableCollection } from '../common';
import { PreferenceSchemaService } from './preference-schema-service';
import {
  PreferenceScope,
  PreferenceProviderDataChange,
  PreferenceResolveResult,
} from './preference-types';
import { StorageService } from '../storage';

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

export const PreferenceProvider = Symbol('PreferenceProvider');

/** 默认值Provider（基于Schema） */
@injectable()
export class DefaultsPreferenceProvider implements PreferenceProvider {

  protected readonly _ready = new Deferred<void>();

  private readonly emitter = new Emitter<Record<string, PreferenceProviderDataChange>>();
  readonly onDidChange = this.emitter.event;

  protected readonly toDispose = new DisposableCollection();

  constructor(@inject(PreferenceSchemaService) private schemaService: PreferenceSchemaService) {
    this.toDispose.push(this.emitter);
    this._ready.resolve();
  }

  /**
   * Resolved when the preference provider is ready to provide preferences
   * It should be resolved by subclasses.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  getScopes(): PreferenceScope[] {
    return [PreferenceScope.Default];
  }

  canHandleScope(scope: PreferenceScope): boolean {
    return scope === PreferenceScope.Default;
  }

  get<T>(key: string): T | undefined {
    return this.schemaService.getDefaultValue(key) as T;
  }

  // 默认值不可修改
  async setPreference(): Promise<boolean> {
    return Promise.resolve(false);
  }

  resolve<T>(key: string): PreferenceResolveResult<T> {
    return {
      value: this.get(key),
      configUri: undefined
    };
  }

  getPreferences(): JSONObject {
    const defaults: JSONObject = {};
    for (const key of this.schemaService.getAllKeys()) {
      const value = this.schemaService.getDefaultValue(key);
      if (value !== undefined) {
        defaults[key] = value;
      }
    }
    return defaults;
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}

/** 浏览器存储的用户偏好Provider */
@injectable()
export class BrowserPreferenceProvider implements PreferenceProvider {
  protected readonly _ready = new Deferred<void>();

  private readonly emitter = new Emitter<Record<string, PreferenceProviderDataChange>>();
  readonly onDidChange = this.emitter.event;
  private storage: JSONObject = {};
  private static STORAGE_KEY = 'editor-preferences-v1'; // 版本号便于兼容

  @inject(PreferenceSchemaService)
  private schemaService: PreferenceSchemaService;

  @inject(StorageService)
  private storageService: StorageService;

  protected readonly toDispose = new DisposableCollection();

  constructor() {
    this.toDispose.push(this.emitter);
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /** 初始化：加载存储 + 监听多标签页同步 */
  @postConstruct()
  init(): void {
    this.loadFromStorage();
    this.listenToStorageChanges();
  }

  getScopes(): PreferenceScope[] {
    return [PreferenceScope.User];
  }

  canHandleScope(scope: PreferenceScope): boolean {
    return scope === PreferenceScope.User;
  }

  get<T>(key: string): T | undefined {
    // 检查是否允许覆盖
    if (!this.schemaService.isOverridable(key)) {
      return undefined;
    }
    return this.storage[key] as T;
  }

  async setPreference(key: string, value: JSONValue): Promise<boolean> {
    // 校验：键必须存在且允许覆盖
    const prop = this.schemaService.getSchemaProperty(key);
    if (!prop || !prop.overridable) {
      console.error(`不允许修改偏好设置: ${key}`);
      return false;
    }

    const oldValue = this.storage[key];
    // 删除或更新值
    if (value === undefined || value === prop.default) {
      delete this.storage[key];
    } else {
      this.storage[key] = value;
    }

    this.saveToStorage();
    this.emitChanges(key, oldValue, value);
    return true;
  }

  resolve<T>(key: string): PreferenceResolveResult<T> {
    return {
      value: this.get(key),
      configUri: undefined
    };
  }

  getPreferences(): JSONObject {
    return { ...this.storage };
  }

  /** 导出用户配置为JSON字符串 */
  exportPreferences(): string {
    return JSON.stringify(this.getPreferences(), null, 2);
  }

  /** 导入用户配置 */
  async importPreferences(content: string): Promise<boolean> {
    try {
      const imported = JSON.parse(content) as JSONObject;
      const validConfig: JSONObject = {};

      // 校验导入的配置（仅保留合法键）
      for (const [key, value] of Object.entries(imported)) {
        const prop = this.schemaService.getSchemaProperty(key);
        if (prop && prop.overridable) {
          if (value === undefined || typeof value === prop.type) {
            validConfig[key] = value;
          } else {
            console.warn(`忽略非法类型的配置: ${key}`);
          }
        }
      }

      // 覆盖存储并触发全量更新
      this.storage = validConfig;
      this.saveToStorage();
      this.emitFullChanges();
      return true;
    } catch (e) {
      console.error('配置导入失败:', e);
      return false;
    }
  }

  /** 加载偏好设置 */
  private loadFromStorage(): void {
    this.storageService.getData(BrowserPreferenceProvider.STORAGE_KEY).then((raw) => {
      this.storage = raw ? raw as JSONObject : {};
      this._ready.resolve();
    }).catch((e) => {
      console.error('加载偏好设置失败:', e);
      this.storage = {};
      this._ready.reject(e);
    });
  }

  /** 保存 */
  private saveToStorage(): void {
    this.storageService.setData(BrowserPreferenceProvider.STORAGE_KEY, this.storage);
  }

  /** 监听localStorage变化（多标签页同步） */
  private listenToStorageChanges(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === BrowserPreferenceProvider.STORAGE_KEY && e.newValue) {
        const oldStorage = { ...this.storage };
        this.storage = JSON.parse(e.newValue) as JSONObject;
        this.emitDiffChanges(oldStorage, this.storage);
      }
    });
  }

  /** 触发单个键变更事件 */
  private emitChanges(key: string, oldValue: JSONValue, newValue?: JSONValue): void {
    this.emitter.fire({
      [key]: {
        preferenceName: key,
        oldValue,
        newValue,
        scope: PreferenceScope.User
      }
    });
  }

  /** 触发全量变更事件 */
  private emitFullChanges(): void {
    const changes: Record<string, PreferenceProviderDataChange> = {};
    for (const [key, value] of Object.entries(this.storage)) {
      changes[key] = {
        preferenceName: key,
        oldValue: undefined,
        newValue: value,
        scope: PreferenceScope.User
      };
    }
    this.emitter.fire(changes);
  }

  /** 触发新旧存储差异变更事件 */
  private emitDiffChanges(oldStorage: JSONObject, newStorage: JSONObject): void {
    const changes: Record<string, PreferenceProviderDataChange> = {};

    // 新增/更新的键
    for (const [key, newValue] of Object.entries(newStorage)) {
      const oldValue = oldStorage[key];
      if (oldValue !== newValue) {
        changes[key] = {
          preferenceName: key,
          oldValue,
          newValue,
          scope: PreferenceScope.User
        };
      }
    }

    // 删除的键
    for (const key of Object.keys(oldStorage)) {
      if (!newStorage.hasOwnProperty(key)) {
        changes[key] = {
          preferenceName: key,
          oldValue: oldStorage[key],
          newValue: undefined,
          scope: PreferenceScope.User
        };
      }
    }

    this.emitter.fire(changes);
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}

export namespace PreferenceUtils {
    export function merge(source: JSONValue | undefined, target: JSONValue): JSONValue {
        if (source === undefined || !JSONExt.isObject(source)) {
            return JSONExt.deepCopy(target);
        }
        if (JSONExt.isPrimitive(target)) {
            return {};
        }
        for (const [key, value] of Object.entries(target)) {
            if (key in source) {
                const sourceValue = source[key];
                if (JSONExt.isObject(sourceValue) && JSONExt.isObject(value)) {
                    merge(sourceValue, value);
                    continue;
                } else if (JSONExt.isArray(sourceValue) && JSONExt.isArray(value)) {
                    source[key] = [...JSONExt.deepCopy(sourceValue), ...JSONExt.deepCopy(value)];
                    continue;
                }
            }
            source[key] = JSONExt.deepCopy(value);
        }
        return source;
    }

    /**
     * Handles deep equality with the possibility of `undefined`
     */
    export function deepEqual(a: JSONValue | undefined, b: JSONValue | undefined): boolean {
        if (a === b) { return true; }
        if (a === undefined || b === undefined) { return false; }
        return JSONExt.deepEqual(a, b);
    }

}

