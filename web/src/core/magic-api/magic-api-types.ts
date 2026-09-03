import { FileData } from "../filesystem";
import { isObject } from '../common';

export const MAGIC_API_SOURCE = 'Magic IDEA';

// 用户信息
export interface MagicApiOnlineUserInfo {
  cid: string; // 会话ID
  fileId: string; // 文件ID
  id: string; // 用户ID
  username: string; // 用户名
  ip: string; // IP地址
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
export const DEFAULT_MAGIC_API_CONFIG: MagicApiConfig = {
  version: "2.0.0",
  web: "/magic/web",
  prefix: "",
  banner: false,
  throwException: false,
  autoImportModule: "db",
  autoImportPackage: "java.lang.*,java.util.*",
  allowOverride: false,
  sqlColumnCase: "camel",
  threadPoolExecutorSize: 8,
  editorConfig: "",
  supportCrossDomain: true,
  response: "",
  secretKey: "",
  pushPath: "",
  showUrl: true,
  showSql: false,
  datePattern: [],
  compileCacheSize: 500,
  persistenceResponseBody: true,
  instanceId: "",
  security: {
    username: null,
    password: null
  },
  page: {
    page: "page",
    size: "size",
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: -1
  },
  cache: {
    enable: true,
    capacity: 10000,
    ttl: 7200
  },
  debug: {
    timeout: 60
  },
  resource: {
    type: "database",
    location: "/magic-api/",
    readonly: false,
    prefix: "/magic-api",
    tableName: "magic_api_file_v2",
    datasource: null
  },
  responseCode: {
    success: 0,
    invalid: 1,
    exception: -1
  },
  crud: {
    logicDeleteColumn: "del_flag",
    logicDeleteValue: "1"
  },
  backup: {
    enable: false,
    maxHistory: -1,
    tableName: "magic_api_backup",
    datasource: null
  },
  autoImportModuleList: ["db"],
  autoImportPackageList: ["java.lang.*", "java.util.*"]
};

/**
 * 资源信息
 */
export type Resource = FileData & {
  isDirty?: boolean; // 标记节点是否被修改过，用于区分是否需要保存
};

export namespace Resource {
  export function is(node: unknown): node is Resource {
      return isObject(node) && 'id' in node && 'name' in node && ('groupId' in node || 'parentId' in node);
  }
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
  [key:string]: ResourceNode;
};

/**
 * 资源类型
 */
export type ResourceType = {
  type: string;
  label: string;
  icon?: string;
  iconColor?: string;
}

// 搜索结果类型（携带节点信息和匹配类型，方便UI高亮）
export interface SearchResourceResult {
  node: ResourceNode; // 匹配的节点
  matchType: 'fullPath' | 'fullPathName' | 'name' | 'keyword'; // 匹配类型（全路径/全路径名/名称/关键字）
  matchText: string; // 匹配的文本内容（便于UI高亮显示）
}