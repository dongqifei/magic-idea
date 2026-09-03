// /**
//  * 基于axios实现的请求服务（纯浏览器环境专用，移除代理相关配置，配置baseURL）
//  */
// import axios, {
//   AxiosInstance,
//   AxiosRequestConfig,
//   AxiosResponse,
//   CancelTokenSource,
// } from "axios";
// import { CancellationToken } from "../common";
// import { inject, injectable } from "inversify";
// import { PreferenceService } from "../preferences/preference-service";
// import { HttpHeaders, RequestConfiguration, RequestContext, RequestOptions, RequestService } from "./common-request-service";
// import { DEFAULT_SERVER_URL, SERVER_URL_PREF } from "../magic-api/magic-api-preferences";

// @injectable()
// export class AxiosRequestServiceImpl implements RequestService {
//   // 私有成员：axios实例、全局配置、取消请求源映射
//   private axiosInstance: AxiosInstance;
//   private cancelTokenSources: Map<CancellationToken, CancelTokenSource> =
//     new Map();

//   constructor(
//     @inject(PreferenceService) private preferenceService: PreferenceService,
//   ) {
//   }

//   private createAxiosInstance(): void {
//     const serverUrl = this.preferenceService.get<string>(SERVER_URL_PREF, DEFAULT_SERVER_URL);
//     this.axiosInstance = axios.create({
//       baseURL: serverUrl, // 配置你的baseURL
//       validateStatus: () => true, // 不主动拒绝任何状态码，由上层处理
//       maxRedirects: 5, // 默认最大重定向次数（浏览器环境生效）
//       timeout: 30000, // 默认超时时间（可被请求级覆盖）
//     })
//     // 监听CancellationToken取消事件
//     this.listenTokenCancellation();
//   }

//   async configure(config: RequestConfiguration): Promise<void>{
//     // 配置代理
//   }

//   async resolveProxy(url: string): Promise<string | undefined>{
//     return undefined;
//   }

//   /**
//    * 发送请求核心方法
//    * @param options 请求选项
//    * @param token 取消令牌
//    * @returns RequestContext 请求上下文
//    */
//   async request(
//     options: RequestOptions,
//     token?: CancellationToken
//   ): Promise<RequestContext> {
//     if (!options) {
//       throw new Error("Request options cannot be null or undefined");
//     }
//     if(!this.axiosInstance) {
//       this.createAxiosInstance();
//     }
//     const startTime = Date.now();

//     // 1. 构建axios请求配置
//     const axiosConfig = this.buildAxiosConfig(options);

//     // 2. 处理取消令牌
//     if (token) {
//       const cancelSource = axios.CancelToken.source();
//       axiosConfig.cancelToken = cancelSource.token;
//       this.cancelTokenSources.set(token, cancelSource);
//     }

//     try {
//       // 3. 发送axios请求
//       const response = await this.axiosInstance.request(axiosConfig);

//       // 4. 转换为RequestContext格式（兼容浏览器环境，无Buffer依赖）
//       return this.convertToRequestContext(startTime, options.url, response);
//     } catch (error) {
//       // 处理取消请求错误
//       if (axios.isCancel(error)) {
//         throw new Error(`Request cancelled: ${error.message}`);
//       }
//       throw new Error(`Request failed: ${(error as Error).message}`);
//     } finally {
//       // 移除已完成/失败请求的取消令牌映射
//       if (token) {
//         this.cancelTokenSources.delete(token);
//       }
//     }
//   }

//   /**
//    * 构建axios请求配置（移除代理相关逻辑，适配baseURL）
//    * @param options 请求选项
//    * @returns AxiosRequestConfig axios配置
//    */
//   private buildAxiosConfig(options: RequestOptions): AxiosRequestConfig {
//     // 默认请求方法为GET
//     const method = (options.type || "GET").toUpperCase();

//     // 构建基础配置（适配baseURL，无需代理配置）
//     const config: AxiosRequestConfig = {
//       url: options.url, // 若为相对路径，会自动拼接baseURL；若为完整URL，会忽略baseURL
//       method: method as AxiosRequestConfig["method"],
//       timeout: options.timeout || this.axiosInstance.defaults.timeout, // 优先使用请求级超时
//       maxRedirects: options.followRedirects || 5, // 重定向次数
//       headers: { ...options.headers }, // 请求头
//       params: options.params, // 查询参数
//       data: options.data, // 请求体数据（非GET/HEAD方法）
//       responseType: 'arraybuffer', //options.responseType,
//       withCredentials: options.withCredentials,
//       validateStatus: options.validateStatus,
//     };

//     // 处理请求体数据（仅非GET/HEAD方法）
//     if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && options.data) {
//       config.data = options.data;
//       // 默认设置Content-Type（若未指定）
//       if (!config.headers?.["Content-Type"]) {
//         config.headers = {
//           ...config.headers,
//           "Content-Type": "application/json; charset=utf-8",
//         };
//       }
//     }

//     // 移除所有代理相关配置逻辑（浏览器环境无用）
//     return config;
//   }

//   /**
//    * 将AxiosResponse转换为RequestContext（纯浏览器环境，无Buffer依赖）
//    * @param requestUrl 请求地址
//    * @param response axios响应对象
//    * @returns RequestContext
//    */
//   private convertToRequestContext(
//     startTime: number,
//     requestUrl: string,
//     response: AxiosResponse
//   ): RequestContext {
//     const duration = Date.now() - startTime;
//     // let buffer: BlobBuffer | string;
//     // if(response.data instanceof Blob) {
//     //   const reader: BlobBuffer = {
//     //     size: response.data.size,
//     //     type: response.data.type,
//     //     async read(): Promise<any> {
//     //       return new Promise((resolve) => {
//     //         const reader = new FileReader();
//     //         reader.readAsText(response.data);
//     //         reader.onload = () => {
//     //           try {
//     //             resolve(JSON.parse(reader.result as string));
//     //           } catch (e) {
//     //             resolve(response.data);
//     //           }
//     //         };
//     //       })
//     //     }
//     //   };
//     //   buffer = reader;
//     // } else {
//     //   buffer = response.data;
//     // }
//     return {
//       url: this.axiosInstance.defaults.baseURL
//         ? `${this.axiosInstance.defaults.baseURL}${requestUrl}` // 拼接完整URL
//         : requestUrl,
//       res: {
//         headers: response.headers as HttpHeaders,
//         statusCode: response.status,
//         duration
//       },
//       buffer: new Uint8Array(response.data),
//     };
//   }

//   /**
//    * 监听CancellationToken取消事件，自动取消对应请求
//    */
//   private listenTokenCancellation(): void {
//     // 若CancellationToken有onCancel方法（示例监听逻辑，可根据实际CancellationToken实现调整）
//     const onTokenCancel = (token: CancellationToken) => {
//       const cancelSource = this.cancelTokenSources.get(token);
//       if (cancelSource) {
//         cancelSource.cancel(`Cancelled by token: ${token.toString()}`);
//       }
//     };

//     // 此处需根据你的CancellationToken实际实现调整，例如：
//     // CancellationToken.on('cancel', onTokenCancel);
//     // 若为自定义类，可在构造函数中传入取消回调，此处为通用兼容写法
//   }
// }
