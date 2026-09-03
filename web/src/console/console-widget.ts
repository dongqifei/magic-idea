import { ReactWidget } from '@MagicIdea/core/widgets/react-widget';
import { injectable, inject, postConstruct, interfaces } from 'inversify';
import { CommandRegistry } from '@lumino/commands'
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { isTauri, generateUuid, Disposable } from "@MagicIdea/core/common"
import { KeybindingRegistry } from "@MagicIdea/core/keybinding";
import { ApplicationShellLayout } from '@MagicIdea/core/shell/application-shell';
import { createElement } from "react";
import { MagicApiSocketService } from '@MagicIdea/core/magic-api/magic-api-socket-service';
import { MagicConsoleComponent } from './console-view';
import { Widget } from '@lumino/widgets';

export type ConsoleLogSourceType = 'magic-api' | 'node' | 'unknown';

export interface MagicLogItem {
  id: string;
  html: string;
  multiple: boolean;
  lines: number;
  showMore: boolean;
  rawText: string;
  sourceType: ConsoleLogSourceType;
}

const MAX_LOG_ITEMS_PER_SOURCE = 500;

@injectable()
export class ConsoleWidget extends ReactWidget {
  private readonly MAX_LOG_ITEMS_PER_SOURCE = MAX_LOG_ITEMS_PER_SOURCE;
  // 按日志源分组存储渲染日志
  private logGroup: Record<ConsoleLogSourceType, MagicLogItem[]> = {
    "magic-api": [],
    "node": [],
    "unknown": [],
  };
  private consolePanel: any;
  private currentSourceType: ConsoleLogSourceType = 'magic-api';

  // 防抖队列：等待批量写入的日志
  private pendingLogQueue: Array<{ text: string; sourceType: ConsoleLogSourceType }> = [];
  private isFlushScheduled = false;

  constructor(
    @inject(CommandRegistry) protected commands: CommandRegistry,
    @inject(KeybindingRegistry) private keybindingRegistry: KeybindingRegistry,
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(MagicApiSocketService) protected socketService: MagicApiSocketService,
  ) {
    super();

    this.socketService.onSocketMessage((msg) => {
      if (msg.type === 'log' || msg.type === 'logs') {
        const logMessages = Array.isArray(msg.data)
          ? msg.data.filter((item): item is string => typeof item === 'string')
          : typeof msg.data === 'string'
            ? [msg.data]
            : [];
        logMessages.forEach((text: string) => {
          this.queueAppendLog(text, 'magic-api');
        });
      }
    });

    this.initTauriListener();

    this.commands.addCommand("output.action.collapseAll", {
      label: "折叠所有输出",
      iconClass: "codicon codicon-collapse-all",
      execute: () => {
        this.filterLogsBySourceType().forEach((item) => {
          item.showMore = false;
        });
        this.update();
      }
    });

    this.commands.addCommand("output.action.expandAll", {
      label: "展开所有输出",
      iconClass: "codicon codicon-expand-all",
      execute: () => {
        this.filterLogsBySourceType().forEach((item) => {
          item.showMore = true;
        });
        this.update();
      }
    });

    this.commands.addCommand("output.action.clear", {
      label: "清空",
      iconClass: "codicon codicon-clear-all",
      isEnabled: () => this.filterLogsBySourceType().length > 0,
      execute: () => {
        this.removeCurrentSourceLogs();
      }
    });

    this.commands.addCommand("view:logs-output", {
      label: "运行日志",
      execute: () => this.consolePanel.open(),
    });

    this.keybindingRegistry.registerKeybinding({
      command: "view:logs-output",
      keybinding: "ctrl+shift+u",
    });
  }

  /** 获取当前选中源的日志列表 */
  private filterLogsBySourceType(): MagicLogItem[] {
    return this.logGroup[this.currentSourceType];
  }

  public setSourceType(sourceType: ConsoleLogSourceType | undefined): void {
    this.currentSourceType = sourceType ?? 'magic-api';
    this.update();
  }

  private createSourceTypeToolbarWidget(): Widget {
    const widget = new Widget();
    const select = document.createElement('select');
    select.className = 'form-control';
    select.style.padding = '2px 6px';
    select.style.minWidth = '110px';
    select.innerHTML = `
      <option value="magic-api">MagicApi 服务器</option>
      <option value="node">终端</option>
    `;
    select.value = this.currentSourceType;

    select.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      const value = target.value as ConsoleLogSourceType;
      this.setSourceType(value);
    });

    widget.node.appendChild(select);
    return widget;
  }

  private async initTauriListener(): Promise<void> {
    if (!isTauri()) {
      return;
    }
    const tauriUnlisten: UnlistenFn = await listen<string>('server:output', (e) => {
      const payload = e.payload;
      if (typeof payload === 'string' && payload.trim()) {
        this.queueAppendLog(payload, 'node');
      }
    });
    this.toDispose.push(Disposable.create(() => {
      if (tauriUnlisten) {
        tauriUnlisten();
      }
      // 销毁时清空队列，防止待执行任务持有实例
      this.pendingLogQueue = [];
      this.isFlushScheduled = false;
    }))
  }

  /** 入队日志（外部统一调用入口，替代原appendLog） */
  private queueAppendLog(text: string, sourceType: ConsoleLogSourceType): void {
    this.pendingLogQueue.push({ text, sourceType });
    this.scheduleFlushLogs();
  }

  /** 调度批量刷新，保证同一帧只执行一次flush */
  private scheduleFlushLogs(): void {
    if (this.isFlushScheduled) {
      return;
    }
    this.isFlushScheduled = true;
    queueMicrotask(() => {
      this.flushPendingLogs();
    });
  }

  /** 批量处理队列内所有日志，一次性更新UI */
  private flushPendingLogs(): void {
    const queue = [...this.pendingLogQueue];
    this.pendingLogQueue = [];
    this.isFlushScheduled = false;

    if (queue.length === 0) {
      return;
    }

    for (const entry of queue) {
      const logItem = this.handleReceivedLogs(entry.text, entry.sourceType);
      const list = this.logGroup[entry.sourceType];
      list.push(logItem);
      if (list.length > this.MAX_LOG_ITEMS_PER_SOURCE) {
        this.logGroup[entry.sourceType] = list.slice(-this.MAX_LOG_ITEMS_PER_SOURCE);
      }
    }

    // 批量处理完成后仅调用一次update
    this.update();
  }

  /** 仅清空当前选中日志源的日志 */
  private removeCurrentSourceLogs() {
    this.logGroup[this.currentSourceType] = [];
    this.update();
  }

  /** 切换单行日志展开/折叠状态 */
  private toggleShowMore(id: string) {
    const targetItem = this.filterLogsBySourceType().find(item => item.id === id);
    if (targetItem) {
      targetItem.showMore = !targetItem.showMore;
      this.update();
    }
  }

  private handleReceivedLogs(text: string, sourceType: ConsoleLogSourceType = 'unknown'): MagicLogItem {
    const parts = text.split(/\n(?=\s+at\s)/);
    const header = parts[0];
    const stackTrace = parts.slice(1).join("\n");

    // HTML转义
    let html = header
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    if (sourceType === 'node') {
      html = html.replace(
        /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+([^\s]+)( --- \[)(.*?)(] )(.*?)(?=\s+:|$)/gm,
        '$1 <span class="log-$2">$2</span><span class="log-cyan">$3$4$5</span>$6'
      );
    } else {
      html = html.replace(
        /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+([^\s]+)( --- \[)(.*?)(] )(.{40})/gm,
        '$1 <span class="log-$2">$2</span>$3$4$5<span class="log-cyan">$6</span>'
      );
    }

    // 链接渲染
    html = html.replace(
      /(https?:\/\/[^\s]+)/gm,
      '<a class="log-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 堆栈信息着色
    if (stackTrace) {
      const stackHtml = stackTrace.replace(
        /^(\s+at\s.*?\()(.*?:\d+)(\).*?)$/gm,
        '$1<span style="color:#808080;text-decoration: underline;">$2</span>$3'
      );
      html += "\n" + stackHtml;
    }

    const lines = text.split("\n").length;
    return {
      id: generateUuid(),
      html,
      multiple: lines > 3,
      lines: lines - 3,
      showMore: false,
      rawText: text,
      sourceType,
    };
  }

  @postConstruct()
  init() {
    this.registerActivePanel();
  }

  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.consolePanel = activityManager.registerActivity({
      id: 'logs-output',
      title: '运行日志',
      iconClass: 'codicon codicon-output',
      priority: 30,
      location: 'left-bottom',
      toolbarConfig: {
        items: [
          {
            id: 'output-clear',
            type: 'button',
            commandId: 'output.action.clear',
            tooltip: '清空输出',
            iconClass: 'codicon codicon-trash'
          },
          {
            id: 'output-collapse',
            type: 'button',
            commandId: 'output.action.collapseAll',
            tooltip: '全部折叠',
            iconClass: 'codicon codicon-chevron-up'
          },
          {
            id: 'output-expand',
            type: 'button',
            commandId: 'output.action.expandAll',
            tooltip: '全部展开',
            iconClass: 'codicon codicon-chevron-down'
          },
          {
            id: 'output-sourceType-select',
            type: 'custom',
            customWidget: () => this.createSourceTypeToolbarWidget()
          },
        ]
      },
      factory: () => {
        return this;
      }
    });
  }

  protected render() {
    return createElement(MagicConsoleComponent, {
      logs: this.filterLogsBySourceType(),
      sourceType: this.currentSourceType,
      onToggleShowMore: (logId: string) => {
        this.toggleShowMore(logId);
      }
    });
  }
}

export function bindConsoleModule(bind: interfaces.Bind): void {
  bind(ConsoleWidget).to(ConsoleWidget).inSingletonScope();
}