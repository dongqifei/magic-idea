
import { inject, named, injectable, postConstruct } from 'inversify';
import express from 'express';
import http from 'http';
import cors from 'cors';
import https from 'https';
import { ContributionProvider, MaybePromise } from './common';
import { Stopwatch } from './performance';
import { LogLevel } from './logger/logger-types';

const TIMER_WARNING_THRESHOLD = 50;

export const BackendApplicationServer = Symbol('BackendApplicationServer');
/**
 * This service is responsible for serving the frontend files.
 *
 * When not bound, `@theia/cli` generators will bind it on the fly to serve files according to its own layout.
 */
export interface BackendApplicationServer extends BackendApplicationContribution { }

export const BackendApplicationContribution = Symbol('BackendApplicationContribution');
/**
 * Contribution for hooking into the backend lifecycle:
 *
 * - `initialize()`
 * - `configure(expressApp)`
 * - `onStart(httpServer)`
 * - `onStop()`
 */
export interface BackendApplicationContribution {
  /**
   * Called during the initialization of the backend application.
   * Use this for functionality which has to run as early as possible.
   *
   * The implementation may be async, however it will still block the
   * initialization step until it's resolved.
   *
   * @returns either `undefined` or a Promise resolving to `undefined`.
   */
  initialize?(): MaybePromise<void>;

  /**
   * Called after the initialization of the backend application is complete.
   * Use this to configure the Express app before it is started, for example
   * to offer additional endpoints.
   *
   * The implementation may be async, however it will still block the
   * configuration step until it's resolved.
   *
   * @param app the express application to configure.
   *
   * @returns either `undefined` or a Promise resolving to `undefined`.
   */
  configure?(app: express.Application): MaybePromise<void>;

  /**
   * Called right after the server for the Express app is started.
   * Use this to additionally configure the server or as ready-signal for your service.
   *
   * The implementation may be async, however it will still block the
   * startup step until it's resolved.
   *
   * @param server the backend server running the express app.
   *
   * @returns either `undefined` or a Promise resolving to `undefined`.
   */
  onStart?(server: http.Server | https.Server): MaybePromise<void>;

  /**
   * Called when the backend application shuts down. Contributions must perform only synchronous operations.
   * Any kind of additional asynchronous work queued in the event loop will be ignored and abandoned.
   *
   * @param app the express application.
   */
  onStop?(app?: express.Application): void;
}

@injectable()
export class BackendApplication {

  protected readonly app: express.Application = express();

  @inject(Stopwatch)
  protected readonly stopwatch: Stopwatch;

  private _configured: Promise<void>;

  constructor(
    @inject(ContributionProvider) @named(BackendApplicationContribution)
    protected readonly contributionsProvider: ContributionProvider<BackendApplicationContribution>
  ) { }

  protected async initialize(): Promise<void> {
    await Promise.all(this.contributionsProvider.getContributions().map(async contribution => {
      if (contribution.initialize) {
        try {
          await this.measureContribution(contribution, 'initialize',
            () => contribution.initialize!());
        } catch (error) {
          console.error('Could not initialize contribution', error);
        }
      }
    }));
  }

  
  get configured(): Promise<void> {
      return this._configured;
  }
  
  @postConstruct()
  protected init(): void {
    this._configured = this.configure();
  }

  protected async configure(): Promise<void> {
        await this.initialize();

        await Promise.all(this.contributionsProvider.getContributions().map(async contribution => {
            if (contribution.configure) {
                try {
                    await this.measureContribution(contribution, 'configure',
                        () => contribution.configure!(this.app));
                } catch (error) {
                    console.error('Could not configure contribution', error);
                }
            }
        }));
        console.info('configured all backend app contributions');
    }

  async start(port?: number, hostname?: string): Promise<http.Server | https.Server> {
    // 创建 HTTP 服务（用于挂载 WebSocket）
    const server: http.Server = http.createServer(this.app);

    // 中间件配置
    this.app.use(express.json()); // 解析 JSON 请求体
    this.app.use(express.urlencoded({ extended: true }));

    // 启动 HTTP 服务
    server.listen(port, () => {
      console.log(`Theia Message Proxy backend running on http://${hostname}:${port}`);
    });

    /* Allow any number of websocket servers. */
    server.setMaxListeners(0);

    for (const contribution of this.contributionsProvider.getContributions()) {
      if (contribution.onStart) {
        try {
          await this.measureContribution(contribution, 'onStart',
            () => contribution.onStart!(server));
        } catch (error) {
          console.error('Could not start contribution', error);
        }
      }
    }

    // 服务错误监听
    server.on('error', (error: Error) => {
      console.error('Server error:', error);
      setTimeout(() => process.exit(1), 0);
    });

    // 捕获全局未捕获异常
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
    });

    // 捕获未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
    });
    return server;
  }

  protected async measureContribution<T>(contribution: BackendApplicationContribution, hook: string, fn: () => MaybePromise<T>): Promise<T> {
    let innerResult: MaybePromise<T>;
    const result = await this.measure(contribution.constructor.name + '.' + hook,
      () => (innerResult = fn())
    );
    return result;
  }

  protected async measure<T>(name: string, fn: () => MaybePromise<T>): Promise<T> {
    return this.stopwatch.startAsync(name, `Backend ${name}`, fn, { thresholdMillis: TIMER_WARNING_THRESHOLD, defaultLogLevel: LogLevel.DEBUG });
  }
}