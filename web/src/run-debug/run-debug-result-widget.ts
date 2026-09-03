import { ReactWidget } from '@MagicIdea/core/widgets/react-widget';
import { injectable, inject, postConstruct } from 'inversify';
import { ApplicationShellLayout } from '@MagicIdea/core/shell/application-shell';
import { createElement } from "react";
import { Emitter } from "@MagicIdea/core/common"
import URI from "@MagicIdea/core/common/uri";
import { FileData, FileRunService, FileSystemService, TestRequestContext } from '@MagicIdea/core/filesystem';
import { RequestContext } from "@MagicIdea/core/request/common-request-service";
import { ResponseResultView } from './components/response-result-view';
import { Widget } from '@lumino/widgets';
import { MagicApiTreeService } from '@MagicIdea/magic-api/magic-api-tree-types';
import { formatFileSize } from './utils';
import { RunResult, ResponseStats, RequestInfo } from './run-debug-typs';

class RunStatusBarWidget extends Widget { 
  private runResultWidget: RunDebugResultWidget;
  constructor(runResultWidget: RunDebugResultWidget) {
    super();
    this.runResultWidget = runResultWidget;
    this.id = 'run-result-status-bar-widget';
    this.addClass('run-result-status-bar');
    this.node.style.minWidth = '330px';

    this.runResultWidget.onDidChangeActiveResult((data) => {
      this.updateStatusBar(data);
    });
  }

  // 格式化耗时
  private formatDuration(ms: number | undefined): string {
    if (ms == null || isNaN(ms)) return '--';
    if (ms < 1000) {
      return `${ms} ms`;
    }
    if (ms < 60 * 1000) {
      return `${(ms / 1000).toFixed(2)} s`;
    }
    const min = (ms / (60 * 1000)).toFixed(2);
    return `${min} min`;
  }

  private updateStatusBar(result: RunResult | undefined) {
    if(!result){
      this.node.innerHTML = '';
    }else{ 
      const timeText = this.formatDuration(result.stats.duration);
      this.node.innerHTML = `
        <span>状态：<em class="${result.requestInfo.status === 200 ? 'success' : 'error'}">${result.requestInfo.status}</em>， 
        耗时：<em>${timeText}</em>， 
        大小：<em>${result.stats.size}</em></span>
      `;
    }
  }
}

@injectable()
export class RunDebugResultWidget extends ReactWidget {
  private runResultPanel: any;
  private runResultMap: Map<string, RunResult> = new Map();
  // 当前激活的结果
  private activeResult: RunResult | undefined;

  private readonly onDidChangeActiveResultEmitter = new Emitter<RunResult | undefined>();

  readonly onDidChangeActiveResult = this.onDidChangeActiveResultEmitter.event;

  constructor(
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(FileSystemService) protected fileSystemService: FileSystemService,
    @inject(MagicApiTreeService) protected magicApiTreeService: MagicApiTreeService,
    @inject(FileRunService) protected fileRunService: FileRunService<FileData>,
  ) {
    super();

    this.magicApiTreeService.onDidChangeSelection((selection) => { 
      if(selection && selection.uri)
        this.updateActiveResult(selection.uri);
    })

    // 适配测试请求上下文result数据结构
    this.fileRunService.onDidFileRunSuccess(async (result: TestRequestContext) => {
      // 自动打开运行结果面板
      this.runResultPanel.open();
      // 解析响应体
      let responseBody = null;
      try {
        const contentType = RequestContext.getContentType(result) || "application/json";
        if (contentType.startsWith('application/json') || contentType.startsWith('text/plain')) {
          responseBody = RequestContext.asText(result); 
        } else {
          responseBody = RequestContext.asBlob(result);
        }
      } catch (e) {
        console.error('解析响应体失败', e);
        responseBody = { error: '解析响应体失败', raw: result.buffer };
      }

      // 构建请求信息
      const requestInfo: RequestInfo = {
        url: result.url,
        status: result.res.statusCode,
      };

      // 构建响应统计信息
      const stats: ResponseStats = {
        size: typeof result.buffer !== "string" ? formatFileSize((result.buffer as Uint8Array).byteLength): '0 B', // 格式化文件大小
        duration: result.res.duration || 0,
      };

      // 构建完整的RunResult对象
      const runResult: RunResult = {
        id: result.uri.toString(), // 生成唯一ID
        uri: result.uri,
        timestamp: new Date().toLocaleString(),
        responseBody,
        responseHeaders: result.res.headers,
        requestInfo,
        stats
      };

      // 添加到运行记录并更新视图
      this.addRunResult(runResult);
    });
  }

  @postConstruct()
  init() {
    this.registerActivePanel();
  }

  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.runResultPanel = activityManager.registerActivity({
      id: 'run-result',
      title: '运行结果',
      iconClass: 'codicon codicon-debug-start',
      priority: 30,
      location: 'left-bottom',
      toolbarConfig: {
        items: [
          {
            id: 'run-result-status',
            type: 'custom',
            customWidget: () => {
              return new RunStatusBarWidget(this);
            }
          }
        ]
      },
      factory: () => {
        return this;
      }
    });
  }

  private updateActiveResult(uri: URI){
    this.activeResult = this.runResultMap.get(uri.toString());
    this.onDidChangeActiveResultEmitter.fire(this.activeResult);
    this.update();
  }

  private addRunResult(result: RunResult): void {
    this.activeResult = result;
    this.runResultMap.set(result.id, result);
    this.onDidChangeActiveResultEmitter.fire(this.activeResult);
    this.update();
  }

  viewLastResponseData(uri?: URI): void { 
    if(uri){
      const data = this.fileSystemService.getFileData(uri);
      console.log(data);
    }
  }

  protected render() {
    return createElement(ResponseResultView, {
      activeResult: this.activeResult,
    });
  }
}