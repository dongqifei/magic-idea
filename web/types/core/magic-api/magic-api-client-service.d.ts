import { RequestOptions } from '..\request\common-request-service';
import { CancellationToken } from "../common";
import { Resource, ResourceData } from "./magic-api-types";
import { MagicApiConstantsService } from "./magic-api-constants-service";
import { MagicApiProjectService } from "./magic-api-project-service";
export declare class MagicApiClientService {
    private constants;
    private projectService;
    private requestService;
    constructor(constants: MagicApiConstantsService, projectService: MagicApiProjectService);
    private getProjectInfo;
    protected getServerUrl(): Promise<string>;
    protected getWebPath(): Promise<string>;
    getClientSecret(): Promise<string>;
    getProxyEnable(): Promise<boolean>;
    /**
     * 通用请求方法
     * @param option
     * @param token
     * @returns
     */
    request(option: RequestOptions, token?: CancellationToken): Promise<any>;
    getConfig(): Promise<any>;
    /**
     * 获取接口选项
     */
    getOptions(): Promise<any>;
    /**
     * 获取所有class
     */
    getClasses(): Promise<any>;
    /**
     * 获取单个class信息
     * @param body
     * @returns
     */
    getClass(body: any): Promise<any>;
    /**
     * 获取所有class
     */
    getClassesText(): Promise<any>;
    login(body?: any, token?: CancellationToken): Promise<any>;
    logout(): Promise<boolean>;
    search(body: any): Promise<any>;
    reload(): Promise<boolean>;
    getResources(): Promise<ResourceData>;
    getResourceFile(resourceId: string): Promise<Resource>;
    saveGroup(resource: Resource): Promise<string>;
    exportGroup(groupId: string): Promise<Blob>;
    import(file: File): Promise<string>;
    download(data: any): Promise<void>;
    deleteResource(resourceId: string): Promise<void>;
    saveResource(type: string, nodeData: Resource, auto: string): Promise<string>;
    moveResource(sourceId: string, targetId: string): Promise<void>;
    testDatasourceConnection(data: any): Promise<void>;
    backupDetail(id: string, timestamp: string): Promise<any>;
    backupList(id: string): Promise<any>;
}
