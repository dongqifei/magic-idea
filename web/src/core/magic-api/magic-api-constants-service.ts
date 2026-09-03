import { inject, injectable } from "inversify";
import { MagicApiConfig, DEFAULT_MAGIC_API_CONFIG } from "./magic-api-types";

/**
 * Magic Api 常量类
 * 设计原则：
 * 1. 纯常量（不可变）用 readonly 直接定义
 * 2. 需动态配置的属性用静态方法管控，保证赋值语义清晰
 * 3. 增强类型安全，避免 any 滥用
 */
@injectable()
export class MagicApiConstantsService {
  
  public readonly MAGIC_IDEA_VERSION = '1.0.0';
  public readonly MAGIC_IDEA_TITLE = 'Magic IDEA';

  // ===================== 纯常量（不可修改） =====================
  public readonly MAGIC_API_SERVICE_URL = 'https://magic-api.ssssssss.org.cn';
  public readonly MAGIC_API_WEB_PATH = '/magic/web';
  
  // 请求头常量
  public readonly HEADER_REQUEST_CLIENT_ID = 'Magic-Request-Client-Id';
  public readonly HEADER_REQUEST_SCRIPT_ID = 'Magic-Request-Script-Id';
  public readonly HEADER_REQUEST_BREAKPOINTS = 'Magic-Request-Breakpoints';
  public readonly HEADER_MAGIC_TOKEN = 'magic-token';

  // ===================== 可动态配置的属性（受控） =====================
  private _clientId: string = '';
  // 项目ID
  private _projectId: string = '';
  // 私有静态存储（外部不可直接访问）
  private _headerMagicTokenValue = 'unauthorization';
  private _jdbcDrivers: string[] = [];
  private _options: any[] = [];
  private _dataSourceTypes: string[] = [];
  // 初始化为默认配置（避免空值问题）
  private _config: MagicApiConfig = DEFAULT_MAGIC_API_CONFIG;

  // ===================== 静态getter/setter（统一访问入口） =====================
  get clientId(): string {
    return this._clientId;
  }

  set clientId(value: string) {
    this._clientId = value;
  }

  get projectId(): string {
    return this._projectId;
  }

  set projectId(value: string) {
    this._projectId = value;
  }

  /**
   * 获取magic-token值
   */
  public get token(): string {
    return this._headerMagicTokenValue;
  }

  /**
   * 设置magic-token值（覆盖式赋值）
   */
  public set token(value: string) {
    if (!value) {
      console.warn('Magic token 不能为空');
      return;
    }
    this._headerMagicTokenValue = value;
  }

  /**
   * 获取JDBC驱动列表
   * 返回副本，避免外部直接修改内部数组
   */
  public get jdbcDrivers(): string[] {
    return [...this._jdbcDrivers]; // 返回浅拷贝，保证内部数组不可被外部篡改
  }

  /**
   * 设置JDBC驱动列表（覆盖式，替代原有的push累加）
   * 如果需要追加，可单独提供 addJdbcDriver 方法
   */
  public set jdbcDrivers(drivers: string[]) {
    if (!Array.isArray(drivers)) {
      console.warn('JDBC驱动必须是数组类型');
      return;
    }
    this._jdbcDrivers = drivers.filter(driver => !!driver); // 过滤空值，保证数据干净
  }

  /**
   * 追加单个JDBC驱动（按需提供，语义更清晰）
   */
  public addJdbcDriver(driver: string): void {
    if (driver && !this._jdbcDrivers.includes(driver)) {
      this._jdbcDrivers.push(driver);
    }
  }

  /**
   * 获取选项列表（返回副本）
   */
  public get options(): any[] {
    return [...this._options];
  }

  /**
   * 设置选项列表（覆盖式）
   */
  public set options(options: any[]) {
    if (!Array.isArray(options)) {
      console.warn('选项必须是数组类型');
      return;
    }
    this._options = options.filter(option => !!option);
  }

  /**
   * 获取数据源类型列表（返回副本）
   */
  public get dataSourceTypes(): string[] {
    return [...this._dataSourceTypes];
  }

  /**
   * 设置数据源类型列表（覆盖式）
   */
  public set dataSourceTypes(types: string[]) {
    if (!Array.isArray(types)) {
      console.warn('数据源类型必须是数组类型');
      return;
    }
    this._dataSourceTypes = types.filter(type => !!type);
  }

  /**
   * 获取配置对象（返回副本）
   */
  public get config(): MagicApiConfig {
    return { ...this._config }; // 返回浅拷贝，避免外部修改内部对象
  }

  /**
   * 设置配置对象（覆盖式）
   */
  public set config(newConfig: MagicApiConfig) {
    if (typeof newConfig !== 'object' || !newConfig) {
      console.warn('配置必须是对象类型');
      return;
    }
    this._config = { ...this._config, ...newConfig }; // 合并原有配置（可选，根据需求调整）
  }

  /**
   * 局部更新配置（比如只改secretKey、cache等子项）
   * @param partialConfig 部分配置项
   */
  public updateConfig(partialConfig: Partial<MagicApiConfig>): void {
    if (!partialConfig || typeof partialConfig !== 'object') {
      console.error('更新的配置必须是对象类型');
      return;
    }
    this._config = { ...this._config, ...partialConfig };
  }

  /**
   * 重置所有动态配置为初始值（便于复用/测试）
   */
  public resetConfig(): void {
    this._headerMagicTokenValue = 'unauthorization';
    this._jdbcDrivers = [];
    this._options = [];
    this._dataSourceTypes = [];
    this._config = DEFAULT_MAGIC_API_CONFIG;
  }
}
