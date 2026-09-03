import { FileRunServiceProvider, RunTestData } from "@MagicIdea/core/filesystem";
import { injectable, inject } from "inversify";
import { RequestService, RequestOptions, RequestContext } from "@MagicIdea/core/request/common-request-service";
import { PreferenceService } from "@MagicIdea/core/preferences/preference-service";
import { ApiResourceMetaData } from "../magic-api-tree-types";
import { MagicApiConstantsService, MagicApiServerService } from "@MagicIdea/core/magic-api";
import { MagicApiTreeModel } from "@MagicIdea/core/magic-api/magic-api-tree-model";
import { GLOBAL_REQUEST_CONFIG_PREFERENCE_ID } from "../magic-api-global-preferences";

@injectable()
export class MagicApiRunServiceProvider implements FileRunServiceProvider<ApiResourceMetaData> {

  readonly resourceType = 'api';

  constructor(
    @inject(RequestService) private requestService: RequestService,
    @inject(MagicApiConstantsService) private constants: MagicApiConstantsService,
    @inject(MagicApiServerService) private server: MagicApiServerService,
    @inject(MagicApiTreeModel) private model: MagicApiTreeModel,
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService
  ) {
  }

  async doTest(data: RunTestData<ApiResourceMetaData>): Promise<RequestContext> {
    const fullPath = this.model.getFullPath(data?.item?.id);
    const item = data.item;
    const prefix = this.constants.config?.prefix;
    const requestOptions: RequestOptions = {
      baseURL: this.server.getProjectUrl(),
      url: prefix? prefix + fullPath : fullPath,
      type: item.method || 'GET',
      headers: {
        "Content-Type": "application/json",
        [this.constants.HEADER_MAGIC_TOKEN]: this.server.getClientSecret(),
        [this.constants.HEADER_REQUEST_CLIENT_ID]: this.server.getClientId(),
        [this.constants.HEADER_REQUEST_SCRIPT_ID]: data.item.id,
      },
      params: {},
      data: {},
      responseType: "blob",
      withCredentials: true,
      timeout: 60000,
      validateStatus: () => true,
      proxyEnable: this.server.getProxyEnable(),
      sessionId: this.server.getClientId(),
    };

    // 获取节点整条向上父分组链路
    const groups:any[] = this.model.getGroups(item.id);
    
    // 1.收集所有层级路径参数
    const allPathParams = [];
    groups
      .filter(g => g.node.paths && g.node.paths.length > 0)
      .forEach(g => allPathParams.push(...g.node.paths));
    allPathParams.push(...(item.paths || []));

    // 2.合并参数，下层覆盖上层
    const pathMap: Record<string, string> = {};
    allPathParams.forEach(item => {
      if (typeof item.name === 'string' && item.name && item.value && item.value.trim()) {
        pathMap[item.name] = item.value.trim();
      }
    });
    // 处理路径变量
    Object.entries(pathMap).forEach(([name, val]) => {
      requestOptions.url = requestOptions.url.replace(new RegExp(`\\{${name}}`, "g"), val);
    });

    // 正则检测是否仍然存在未替换的 {变量名} 占位符
    if (/\{[\w]+\}/.test(requestOptions.url)) {
      throw new Error("请填写所有路径变量后再测试！");
    }

    // 处理查询参数和请求体
    const params: Record<string, any> = {};
    if (item.parameters) {
      item.parameters.forEach((it) => {
        it.name && (params[it.name] = it.value);
      });
    }
    // 查询参数中存在文件
    if (this.hasFileUpload(params)) {
      requestOptions.headers = {
        ...requestOptions.headers,
        "Content-Type": "multipart/form-data"
      };
      const formData = new FormData();
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (this.isFileList(value)) {
          Array.from(value).forEach(
            (fileData: any) =>
              fileData.file instanceof File && formData.append(key, fileData.file, fileData.name)
          );
        } else if (value.file instanceof File) {
          formData.append(key, value.file, value.name);
        } else {
          formData.append(key, String(value));
        }
      });
      requestOptions.data = formData;
    } else {
      // 设置查询参数
      if (Object.keys(params).length > 0) {
        requestOptions.headers = {
          ...requestOptions.headers,
          "Content-Type": "application/x-www-form-urlencoded"
        };
        if (requestOptions.type !== "POST" || item.requestBody) {
          requestOptions.params = params;
        } else {
          requestOptions.data = params;
        }
      }
      // 处理普通参数和请求体
      if (item.requestBody) {
        try {
          requestOptions.data = JSON.parse(item.requestBody);
          requestOptions.params = params;
          requestOptions.headers = {
            ...requestOptions.headers,
            "Content-Type": "application/json"
          };
        } catch (e) {
          console.error("请求体格式化失败:", e);
          throw new Error("请求体格式化失败");
        }
      }
    }

    // 处理请求头
    if (item.headers) {
      item.headers
      .filter((it) => it.name)
      .forEach((it) => {
        if(it.name && it.value){
          requestOptions.headers = {
            ...requestOptions.headers,
            [it.name]: it.value
          };
        }
      });
    }
    
    // ====================== 合并全局参数 ======================
    this.mergeGlobalParams(requestOptions);
    // ================================================================

    // 添加断点信息（调试模式）
    if(data.isDebug && data.breakpoints){
      requestOptions.headers = {...requestOptions.headers, [this.constants.HEADER_REQUEST_BREAKPOINTS]: data.breakpoints}
    }
    return this.requestService.request(requestOptions);
  }

  
  private isFileList(value: any): boolean { 
    if (Array.isArray(value)) {
      return value.some((item) => item.file instanceof File);
    }
    return false;
  }

  private hasFileUpload(data: any): boolean { 
    const checkForFiles = (value: any): boolean => {
      if (value && value.file instanceof File || this.isFileList(value)) {
        return true;
      }
      // 检查普通对象中是否包含文件
      if (value && typeof value === "object") {
        return Object.values(value).some(checkForFiles);
      }

      return false;
    };

    return checkForFiles(data);
  }
  
  /**
   * 合并全局参数：支持 headers / params
   * 优先级：接口配置 > 全局配置
   */
  private mergeGlobalParams(requestOptions: RequestOptions): void {
    // 1. 获取全局配置的参数（格式：{ headers: [], params: [], data: [] }）
    const globalConfig = this.preferenceService.get<{
      headers?: Array<{ key: string; value: string }>;
      params?: Array<{ key: string; value: any }>;
    }>(GLOBAL_REQUEST_CONFIG_PREFERENCE_ID, {});

    if (!globalConfig) return;

    // 2. 合并全局请求头（接口头覆盖全局头）
    if (Array.isArray(globalConfig.headers) && requestOptions.headers) {
      globalConfig.headers.forEach(header => {
        if (!header.key || !header.value) return;
        // 只有接口未配置该请求头时，才添加全局请求头
        if (requestOptions.headers && !requestOptions.headers?.hasOwnProperty(header.key)) {
          requestOptions.headers[header.key] = header.value;
        }
      });
    }

    // 3. 合并全局查询参数（接口参数覆盖全局参数）
    if (Array.isArray(globalConfig.params)) {
      requestOptions.params = requestOptions.params || {};
      globalConfig.params.forEach(param => {
        if (!param.key) return;
        // 只有接口未配置该查询参数时，才添加全局参数
        if (requestOptions.params && !requestOptions.params.hasOwnProperty(param.key)) {
          requestOptions.params[param.key] = param.value;
        }
      });
    }
  }
}