import URI from "../common/uri";
import { IEvent } from "../common";
import { ContributionProvider } from "../common/contribution-provider";
import { BreakpointManager } from "../breakpoint-manager";
import { RequestContext } from "../request/common-request-service";
import { NotificationService } from "../notification";
export interface RunTestData<T> {
    uri: URI;
    item: T;
    breakpoints?: string;
    isDebug?: boolean;
}
export interface TestRequestContext extends RequestContext {
    uri: URI;
}
/**
 * @file 文件运行服务提供者
 */
export interface FileRunServiceProvider<T> {
    resourceType: string;
    doTest(data: RunTestData<T>): Promise<RequestContext>;
}
export declare const FileRunServiceProvider: unique symbol;
export interface FileRunService<T> {
    onDidFileRunSuccess: IEvent<TestRequestContext>;
    onDidFileRunError: IEvent<{
        uri: URI;
        error: Error;
    }>;
    doTest(uri: URI, data?: T, isDebug?: boolean): void;
}
export declare const FileRunService: unique symbol;
/**
 * 文件运行服务实现
 */
export declare class FileRunServiceImpl<T> implements FileRunService<T> {
    private fileRunServiceProviders;
    private breakpointManager;
    private notificationService;
    private readonly providers;
    private isRunning;
    private readonly onDidFileRunSuccessEmitter;
    private readonly onDidFileRunErrorEmitter;
    get onDidFileRunError(): IEvent<{
        uri: URI;
        error: Error;
    }>;
    get onDidFileRunSuccess(): IEvent<TestRequestContext>;
    constructor(fileRunServiceProviders: ContributionProvider<FileRunServiceProvider<T>>, breakpointManager: BreakpointManager, notificationService: NotificationService);
    private registerProvider;
    private getProvider;
    doTest(uri: URI, data: T, isDebug?: boolean): Promise<void>;
}
