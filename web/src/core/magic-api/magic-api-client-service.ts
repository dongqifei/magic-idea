import { injectable, inject } from "inversify";
import { RequestService, RequestOptions, RequestContext } from "@MagicIdea/core/request/common-request-service";
import { CancellationToken } from "../common";
import { Resource, ResourceData } from "./magic-api-types";
import { MagicApiConstantsService } from "./magic-api-constants-service";
import { MagicApiProjectService, MagicApiProjectData } from "./magic-api-project-service";

@injectable()
export class MagicApiClientService {

  @inject(RequestService)
  private requestService: RequestService;

  constructor(
    @inject(MagicApiConstantsService) private constants: MagicApiConstantsService,
    @inject(MagicApiProjectService) private projectService: MagicApiProjectService
  ) {
  }

  private async getProjectInfo(id?: string): Promise<MagicApiProjectData | undefined> { 
    const projectId = id || this.constants.projectId;
    if(!projectId){
      throw new Error('未指定项目');
    }
    return await this.projectService.getProject(projectId);
  }

  protected async getServerUrl(): Promise<string> {
    const data =  await this.getProjectInfo();
    return data?.url || '';
  }

  protected async getWebPath(): Promise<string> {
    const data =  await this.getProjectInfo();
    return data?.webPath || "/magic/web";
  }

  async getClientSecret(): Promise<string> {
    const data =  await this.getProjectInfo();
    return data?.token || 'unauthorization';
  }

  async getProxyEnable(): Promise<boolean>{
    const data =  await this.getProjectInfo();
    return data?.proxyEnable || false;
  }

  /**
   * 通用请求方法
   * @param option 
   * @param token 
   * @returns 
   */
  async request(option: RequestOptions, token?: CancellationToken): Promise<any> {
    const HEADER_MAGIC_TOKEN = this.constants.HEADER_MAGIC_TOKEN;
    const options: RequestOptions = {
      ...option,
      headers: {
        ...option.headers,
        "Content-Type": option.headers && option.headers['Content-Type'] || "application/json",
        [HEADER_MAGIC_TOKEN]: await this.getClientSecret(),
      },
      url: option.url,
      baseURL: await this.getServerUrl() + await this.getWebPath(),
      proxyEnable: await this.getProxyEnable(),
      timeout: 30000,
    };
    return this.requestService.request(options, token).then((result: RequestContext) => {
      const headers = result.res.headers;
      // 从headers中获取Maginc-token
      const token = headers[HEADER_MAGIC_TOKEN];
      if(token && typeof token === 'string' && option.url === '/login'){
        return {
          ...RequestContext.asJson(result),
          token: token,
        };
      }
      if (option.responseType === 'blob') {
        return RequestContext.asBlob(result);
      } else if (option.responseType === 'text'){
        return RequestContext.asText(result);
      } else {
        return RequestContext.asJson(result);
      }
    });
  }

  async getConfig(): Promise<any> {
    // 获取配置信息
    return this.request({
      type: 'GET',
      url: '/config.json',
    });
  }

  /**
   * 获取接口选项
   */
  async getOptions(): Promise<any> {
    const result = await this.request({
      url: '/options',
      type: 'get'
    })
    if(result && result.code === 1){
      return result.data;
    }
    return [];
  }
  
  /**
   * 获取所有class
   */
  async getClasses(): Promise<any> {
    return this.request({
      url: '/classes',
      type: 'post'
    })
  }

  /**
   * 获取单个class信息
   * @param body
   * @returns
   */
  async getClass(body: any): Promise<any> {
    return this.request({
      url: '/class',
      type: 'post',
      data: body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    })
  }

  /**
   * 获取所有class
   */
  async getClassesText(): Promise<any> {
    return this.request({
      url: '/classes.txt',
      type: 'get',
      responseType: 'text'
    })
  }

  async login(body?: any, token?: CancellationToken): Promise<any> { 
    return this.request({
      type: 'POST',
      url: '/login',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: body
    }, token);
  }

  async logout(): Promise<boolean> {
    const result = await this.request({
      type: "POST",
      url: "/logout"
    })
    if(result && result.code === 1){
      return true;
    }
    return false;
  }

  async search(body: any): Promise<any> {
    // 搜索接口，用于在文件中搜索资源等。例如，在文件中搜索特定的关键字或模式。
    return this.request({
      url: '/search',
      type: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: body
    })
  }

  async reload(): Promise<boolean> { 
    const result = await this.request({
      url: '/reload',
      type: 'get'
    });
    return result.data;
  }

  async getResources(): Promise<ResourceData> {
    // 获取资源列表
    const result = await this.request({
      type: 'POST',
      url: '/resource',
    });
    if(!result.data){
      throw new Error('获取资源列表失败');
    }
    return result.data as ResourceData;
  }

  async getResourceFile(resourceId: string): Promise<Resource> {
    // 获取资源文件
    const result = await this.request({
      type: 'GET',
      url: `/resource/file/${resourceId}`,
    });
    if(!result.data){
      throw new Error('获取资源文件失败');
    }
    return result.data as Resource;
  }

  async saveGroup(resource: Resource): Promise<string> {
    // 保存分组
    const result = await this.request({
      type: 'POST',
      url: '/resource/folder/save',
      data: resource,
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if(!result.data || result.code !== 1){
      throw new Error(result.message || '未知错误');
    }
    return result.data as string;
  }

  // 导出分组
  async exportGroup(groupId: string): Promise<Blob> {
    return await this.request({
      type: 'POST',
      url: '/download',
      params: {
        groupId: groupId,
      },
      responseType: 'blob'
    });
  }

  // 导入资源
  async import(file: File): Promise<string> {
    const result = await this.request({
      type: 'POST',
      url: '/resource/import',
      data: file,
    });
    if(!result.data || result.code !== 1){
      throw new Error(result.message || '未知错误');
    }
    return result.data as string;
  }

  // 下载资源
  async download(data: any): Promise<void> {
    const result = await this.request({
      type: 'POST',
      url: '/download',
      data: data,
    });
    if(!result.data || result.code !== 1){
      throw new Error(result.message || '未知错误');
    }
  }

  async deleteResource(resourceId: string): Promise<void> {
    // 删除资源
    const result = await this.request({
      type: 'post',
      url: `/resource/delete`,
      headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {id: resourceId}
    });
    if(!result.data || result.code !== 1){
      throw new Error(result.message || '未知错误');
    }
  }

  async saveResource(type: string, nodeData: Resource, auto: string): Promise<string> {
    // 创建资源
    const result = await this.request({
      type: 'POST',
      url: '/resource/file/'+type+'/save?auto='+auto,
      data: nodeData,
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if(!result.data){
      throw new Error(result.message || '未知错误');
    }
    return result.data as string;
  }

  async moveResource(sourceId: string, targetId: string): Promise<void> {
    // 移动资源
    const result = await this.request({
      type: 'POST',
      url: `/resource/move`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        src: sourceId,
        groupId: targetId
      }
    });
    if(!result.data){
      throw new Error(result.message || '未知错误');
    }
  }

  async testDatasourceConnection(data: any): Promise<void> {
    // 测试数据源连接
    const result = await this.request({
      type: 'POST',
      url: '/datasource/jdbc/test',
      data,
      headers: {
        'Content-Type': 'application/json'
      },
    })
    if(result.data != 'ok'){
      throw new Error(result.data || '未知错误');
    }
  }

  async backupDetail(id: string, timestamp: string): Promise<any> {
    return this.request({
      url: '/backup',
      params: {
        id,
        timestamp
      },
      type: 'get',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    })
  }

  // 获取单个资源历史记录
  async backupList(id: string): Promise<any> {
    return this.request({
      url: '/backup/' + id,
      type: 'get',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    })
  }
}