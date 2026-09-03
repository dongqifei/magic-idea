import { injectable, inject, postConstruct, named } from 'inversify';
import { JSONValue } from '@lumino/coreutils';
import { Deferred, Emitter, Disposable, DisposableCollection } from '../common';
import { ContributionProvider } from '../common/contribution-provider';
import { PreferenceSchemaService } from './preference-schema-service';
import { PreferenceProvider } from './preference-provider';
import { PreferenceScope, PreferenceChange, PreferenceProperty } from './preference-types';

@injectable()
export class PreferenceService {
  /** 偏好变更事件（对外暴露） */
  private readonly changeEmitter = new Emitter<PreferenceChange>();
  readonly onDidPreferenceChanged = this.changeEmitter.event;

  @inject(PreferenceSchemaService)
  private schemaService: PreferenceSchemaService;

  @inject(ContributionProvider) @named(PreferenceProvider)
  protected readonly providers: ContributionProvider<PreferenceProvider>;

  /** 作用域->Provider映射 */
  private providerMap = new Map<PreferenceScope, PreferenceProvider>();

  protected readonly toDispose = new DisposableCollection(this.changeEmitter);

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected _isReady = false;
  get isReady(): boolean {
    return this._isReady;
  }

  protected async initializeProviders(): Promise<void> {
    try {
      // 初始化Provider映射 + 监听Provider变更
      for (const provider of this.providers.getContributions()) {
        for (const scope of provider.getScopes()) {
          this.providerMap.set(scope, provider);
          // 转发Provider的变更事件
          provider.onDidChange(changes => {
            for (const [key, change] of Object.entries(changes)) {
              this.changeEmitter.fire({
                key: change.preferenceName,
                oldValue: change.oldValue,
                newValue: change.newValue,
                scope: change.scope
              });
            }
          });
          // 等待Provider就绪
          await provider.ready;
        }
      }
      this._ready.resolve();
      this._isReady = true;
    } catch (e) {
      this._ready.reject(e);
    }
  }

  @postConstruct()
  init(): void {
    this.toDispose.push(Disposable.create(() => this._ready.reject(new Error('preference service is disposed'))));
    this.initializeProviders();
  }

  /** 获取偏好值（用户配置优先，其次默认值） */
  get<T>(key: string, value?: any): T {
    // 1. 优先取用户配置
    const userProvider = this.providerMap.get(PreferenceScope.User);
    const userValue = userProvider?.get<T>(key);
    if (userValue !== undefined) {
      return userValue;
    }

    // 2.  fallback到默认值
    const defaultProvider = this.providerMap.get(PreferenceScope.Default);
    return defaultProvider?.get<T>(key) || value;
  }

  /** 设置偏好值（仅支持用户级） */
  async set(key: string, value: JSONValue): Promise<boolean> {
    const userProvider = this.providerMap.get(PreferenceScope.User);
    return userProvider?.setPreference(key, value) ?? Promise.resolve(false);
  }

  async updateValue(key: string, value: JSONValue): Promise<void> {
    const userProvider = this.providerMap.get(PreferenceScope.User);
    await userProvider?.setPreference(key, value);
  }

  /** 获取键的属性定义 */
  getProperty(key: string) {
    return this.schemaService.getSchemaProperty(key);
  }

  /** 检查键是否允许修改 */
  isOverridable(key: string): boolean {
    return this.schemaService.isOverridable(key);
  }

  /** 获取所有偏好键 */
  getAllKeys(): string[] {
    return this.schemaService.getAllKeys();
  }

  /** 获取所有偏好属性定义 */
  getSchemaProperties(): ReadonlyMap<string, PreferenceProperty> {
    return this.schemaService.getSchemaProperties();
  }
}