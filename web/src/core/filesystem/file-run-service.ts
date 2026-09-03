import { injectable, inject, named } from "inversify";
import URI from "../common/uri";
import { Emitter, IEvent } from "../common";
import { ContributionProvider } from "../common/contribution-provider";
import {
  Breakpoint,
  BreakpointManager,
} from "../breakpoint-manager";
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

export const FileRunServiceProvider = Symbol("FileRunServiceProvider");

export interface FileRunService<T> {
  onDidFileRunSuccess: IEvent<TestRequestContext>;
  onDidFileRunError: IEvent<{uri: URI; error: Error;}>;
  doTest(uri: URI, data?: T, isDebug?: boolean): void;
}

export const FileRunService = Symbol("FileRunService");

/**
 * 文件运行服务实现
 */
@injectable()
export class FileRunServiceImpl<T> implements FileRunService<T> {
  private readonly providers = new Map<string, FileRunServiceProvider<T>>();

  private isRunning = false;

  private readonly onDidFileRunSuccessEmitter =
    new Emitter<TestRequestContext>();

  private readonly onDidFileRunErrorEmitter =
    new Emitter<{uri: URI; error: Error;}>();  

  get onDidFileRunError(): IEvent<{uri: URI; error: Error;}> {
    return this.onDidFileRunErrorEmitter.event;
  }

  get onDidFileRunSuccess(): IEvent<TestRequestContext> {
    return this.onDidFileRunSuccessEmitter.event;
  }

  constructor(
    @inject(ContributionProvider)
    @named(FileRunServiceProvider)
    private fileRunServiceProviders: ContributionProvider<
      FileRunServiceProvider<T>
    >,
    @inject(BreakpointManager) private breakpointManager: BreakpointManager,
    @inject(NotificationService)
    private notificationService: NotificationService
  ) {
    this.fileRunServiceProviders
      .getContributions()
      .forEach((provider) =>
        this.registerProvider(provider.resourceType, provider)
      );
  }

  private registerProvider(
    resourceType: string,
    provider: FileRunServiceProvider<T>
  ): void {
    this.providers.set(resourceType, provider);
  }

  private getProvider(
    resourceType: string
  ): FileRunServiceProvider<T> | undefined {
    return this.providers.get(resourceType);
  }

  async doTest(uri: URI, data: T, isDebug?: boolean): Promise<void> {
    if (this.isRunning) {
      this.notificationService.warn("请等待当前任务运行结束");
      return;
    }
    const provider = this.getProvider(uri.resourceType);
    if (provider) {
      const breakpointArray: Breakpoint[] =
        this.breakpointManager.getBreakpoints(uri);
      const breakpoints = breakpointArray
        .filter((bp) => bp.enabled)
        .map((bp) => bp.lineNumber)
        .join(",");
      try {
        this.isRunning = true;
        const result = await provider.doTest({
          uri,
          item: data,
          breakpoints,
          isDebug,
        });
        this.onDidFileRunSuccessEmitter.fire({
          ...result,
          uri,
        });
      } catch (error: any) {
        console.error(error);
        this.notificationService.error("运行失败:" + error.message);
        this.onDidFileRunErrorEmitter.fire({
          uri,
          error,
        });
      } finally {
        this.isRunning = false;
      }
    } else {
      this.notificationService.warn("该资源暂不支持运行/调试。");
    }
  }
}
