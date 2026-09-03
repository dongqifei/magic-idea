import { FileData } from "../filesystem";
export declare const MAGIC_API_SOURCE = "Magic IDEA";
export interface MagicApiOnlineUserInfo {
    cid: string;
    fileId: string;
    id: string;
    username: string;
    ip: string;
}
/**
 * Magic API 配置项完整类型定义
 * 基于实际JSON结构精准映射，包含所有字段的类型约束
 */
export interface MagicApiSecurityConfig {
    username: string | null;
    password: string | null;
}
export interface MagicApiPageConfig {
    page: string;
    size: string;
    defaultPage: number;
    defaultSize: number;
    maxPageSize: number;
}
export interface MagicApiCacheConfig {
    enable: boolean;
    capacity: number;
    ttl: number;
}
export interface MagicApiDebugConfig {
    timeout: number;
}
export interface MagicApiResourceConfig {
    type: string;
    location?: string;
    readonly?: boolean;
    prefix?: string;
    tableName?: string;
    datasource?: string | null;
}
export interface MagicApiCrudConfig {
    logicDeleteColumn: string;
    logicDeleteValue: string;
}
export interface MagicApiResponseCodeConfig {
    success: number;
    invalid: number;
    exception: number;
}
export interface MagicApiBackupConfig {
    enable: boolean;
    maxHistory: number;
    tableName: string;
    datasource: string | null;
}
export interface MagicApiConfig {
    /** 版本号 */
    version: string;
    /** web访问路径 */
    web: string;
    /** API前缀 */
    prefix: string;
    /** 是否显示banner */
    banner: boolean;
    /** 是否抛出异常 */
    throwException: boolean;
    /** 自动导入的模块 */
    autoImportModule: string;
    /** 自动导入的包 */
    autoImportPackage: string;
    /** 是否允许覆盖 */
    allowOverride: boolean;
    /** SQL列名大小写转换（驼峰） */
    sqlColumnCase: string;
    /** 线程池执行器大小 */
    threadPoolExecutorSize: number;
    /** 编辑器配置文件路径 */
    editorConfig: string;
    /** 是否支持跨域 */
    supportCrossDomain: boolean;
    /** 响应体模板 */
    response: string;
    /** 秘钥 */
    secretKey: string;
    /** 推送路径 */
    pushPath: string;
    /** 是否显示URL */
    showUrl: boolean;
    /** 是否显示SQL */
    showSql: boolean;
    /** 日期格式化模式列表 */
    datePattern: string[];
    /** 编译缓存大小 */
    compileCacheSize: number;
    /** 是否持久化响应体 */
    persistenceResponseBody: boolean;
    /** 实例ID */
    instanceId: string;
    /** 安全配置 */
    security: MagicApiSecurityConfig;
    /** 分页配置 */
    page: MagicApiPageConfig;
    /** 缓存配置 */
    cache: MagicApiCacheConfig;
    /** 调试配置 */
    debug: MagicApiDebugConfig;
    /** 资源配置 */
    resource: MagicApiResourceConfig;
    /** 响应码配置 */
    responseCode: MagicApiResponseCodeConfig;
    /** CRUD配置 */
    crud: MagicApiCrudConfig;
    /** 备份配置 */
    backup: MagicApiBackupConfig;
    /** 自动导入模块列表 */
    autoImportModuleList: string[];
    /** 自动导入包列表 */
    autoImportPackageList: string[];
    /** 其它配置 */
    [key: string]: any;
}
/**
 * 配置项的默认值常量（便于初始化）
 */
export declare const DEFAULT_MAGIC_API_CONFIG: MagicApiConfig;
/**
 * 资源信息
 */
export type Resource = FileData & {
    isDirty?: boolean;
};
export declare namespace Resource {
    function is(node: unknown): node is Resource;
}
/**
 * 资源节点数据
 */
export type ResourceNode = {
    node: Resource;
    children: ResourceNode[] | [];
};
/**
 * 资源原始数据 api-> ResourceNode, function-> ResourceNode, task-> ResourceNode, datasource-> ResourceNode
 */
export type ResourceData = {
    [key: string]: ResourceNode;
};
/**
 * 资源类型
 */
export type ResourceType = {
    type: string;
    label: string;
    icon?: string;
    iconColor?: string;
};
export interface SearchResourceResult {
    node: ResourceNode;
    matchType: 'fullPath' | 'fullPathName' | 'name' | 'keyword';
    matchText: string;
}
