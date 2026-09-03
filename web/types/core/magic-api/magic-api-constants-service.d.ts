import { MagicApiConfig } from "./magic-api-types";
/**
 * Magic Api 常量类
 * 设计原则：
 * 1. 纯常量（不可变）用 readonly 直接定义
 * 2. 需动态配置的属性用静态方法管控，保证赋值语义清晰
 * 3. 增强类型安全，避免 any 滥用
 */
export declare class MagicApiConstantsService {
    readonly MAGIC_IDEA_VERSION = "1.0.0";
    readonly MAGIC_IDEA_TITLE = "Magic IDEA";
    readonly MAGIC_API_SERVICE_URL = "https://magic-api.ssssssss.org.cn";
    readonly MAGIC_API_WEB_PATH = "/magic/web";
    readonly HEADER_REQUEST_CLIENT_ID = "Magic-Request-Client-Id";
    readonly HEADER_REQUEST_SCRIPT_ID = "Magic-Request-Script-Id";
    readonly HEADER_REQUEST_BREAKPOINTS = "Magic-Request-Breakpoints";
    readonly HEADER_MAGIC_TOKEN = "magic-token";
    private _clientId;
    private _projectId;
    private _headerMagicTokenValue;
    private _jdbcDrivers;
    private _options;
    private _dataSourceTypes;
    private _config;
    get clientId(): string;
    set clientId(value: string);
    get projectId(): string;
    set projectId(value: string);
    /**
     * 获取magic-token值
     */
    get token(): string;
    /**
     * 设置magic-token值（覆盖式赋值）
     */
    set token(value: string);
    /**
     * 获取JDBC驱动列表
     * 返回副本，避免外部直接修改内部数组
     */
    get jdbcDrivers(): string[];
    /**
     * 设置JDBC驱动列表（覆盖式，替代原有的push累加）
     * 如果需要追加，可单独提供 addJdbcDriver 方法
     */
    set jdbcDrivers(drivers: string[]);
    /**
     * 追加单个JDBC驱动（按需提供，语义更清晰）
     */
    addJdbcDriver(driver: string): void;
    /**
     * 获取选项列表（返回副本）
     */
    get options(): any[];
    /**
     * 设置选项列表（覆盖式）
     */
    set options(options: any[]);
    /**
     * 获取数据源类型列表（返回副本）
     */
    get dataSourceTypes(): string[];
    /**
     * 设置数据源类型列表（覆盖式）
     */
    set dataSourceTypes(types: string[]);
    /**
     * 获取配置对象（返回副本）
     */
    get config(): MagicApiConfig;
    /**
     * 设置配置对象（覆盖式）
     */
    set config(newConfig: MagicApiConfig);
    /**
     * 局部更新配置（比如只改secretKey、cache等子项）
     * @param partialConfig 部分配置项
     */
    updateConfig(partialConfig: Partial<MagicApiConfig>): void;
    /**
     * 重置所有动态配置为初始值（便于复用/测试）
     */
    resetConfig(): void;
}
