import { ReactWidget } from "@MagicIdea/core/widgets/react-widget";
import { injectable, inject, postConstruct } from "inversify";
import { CommandRegistry } from "@lumino/commands";
import { ApplicationShellLayout } from "@MagicIdea/core/shell/application-shell";
import { DiffUris } from "@MagicIdea/core/common/diff-uris";
import { toArray } from '@lumino/algorithm';
import { createElement } from "react";
import { TimelineListView } from "./timeline-view";
import { OpenerService, open, NavigatableWidget } from "@MagicIdea/core";
import URI from "@MagicIdea/core/common/uri";
import { EditorManager } from "../editor/editor-manager";
import { TimelineService } from './timeline-service';
import { TimelineItem } from './timeline-model';

/**
 * 将时间戳格式化为"YYYY-MM-DD HH:mm:ss"格式
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化后的日期时间字符串
 */
const formatTimestamp = (timestamp: number | string): string => {
  // 转为数字（兼容字符串时间戳）
  const ts = Number(timestamp);
  // 校验是否为有效数字
  if (isNaN(ts)) {
    return '未知时间'; // 或返回默认值，如 '未知时间'
  }
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};


@injectable()
export class TimelineWidget extends ReactWidget {

  protected timelinePanel: any;

  private _uri: URI | undefined;

  private _loading: boolean = false;

  private items: TimelineItem[];
  
  constructor(
    @inject(CommandRegistry) protected commands: CommandRegistry,
    @inject(ApplicationShellLayout)
    protected applicationShell: ApplicationShellLayout,
    @inject(EditorManager) private editorManager: EditorManager,
    @inject(OpenerService) private openerService: OpenerService,
    @inject(TimelineService) protected readonly timelineService: TimelineService
  ) {
    super();

    this.addClass("magicidea-timeline");
    // 注册命令
    this.commands.addCommand("view:timeline", {
      label: "时间线",
      execute: () => this.timelinePanel.open(),
    });
    this.commands.addCommand("timeline.refresh", {
      label: "刷新",
      iconClass: "codicon codicon-refresh",
      execute: () => this.refresh(),
    });
  }

  @postConstruct()
  init() {
    this.registerActivePanel();

    this.refresh();
    
    this.toDispose.push(
      this.editorManager.onCurrentEditorChanged(editor=>{
        const uri = editor?.editor.getResourceUri();
        if(uri && this._uri?.isEqual(uri)){
          return;
        }
        this._uri = uri;
        this.refresh();
      })
    )
  }

  private registerActivePanel(): void {
    const activityManager = this.applicationShell.activityManager;
    this.timelinePanel = activityManager.registerActivity({
      id: "timeline",
      title: "时间线",
      iconClass: "codicon codicon-history",
      priority: 30,
      location: "left-top",
      toolbarConfig: {
        id: "timeline-toolbar",
        items: [
          {
            id: "timeline-refresh",
            type: "button",
            iconClass: "codicon codicon-refresh",
            tooltip: "刷新",
            commandId: "timeline.refresh",
          },
        ],
      },
      factory: () => {
        return this;
      },
    });
  }

  set loading(loading: boolean) {
    this._loading = loading;
    this.update();
  }

  get loading(): boolean {
    return this._loading;
  }

  refresh(uri?: URI): void {
    if (!uri) {
      uri = this.getCurrentWidgetUri();
    }
    if (uri) {
      this.loadTimeline(uri, true);
    } else {
      this.items = [];
      this.update();
    }
  }

  async loadTimeline(uri: URI, reset: boolean): Promise<void> {
    for (const source of this.timelineService.getSources().map(s => s.id)) {
      this.loadTimelineForSource(source, URI.parse(uri.toString()), reset);
    }
  }

  protected openDiffEditor(item: TimelineItem): void{
    const uri = URI.parse(item.uri);
    // 构造 history 地址
    const leftUri = this.createHistoryUri(uri, item.timestamp);
    const lable = this.buildDiffLabel(item);
    const diffUri = DiffUris.encode(leftUri, uri, lable);
    open(this.openerService, diffUri);
  }

  private buildDiffLabel(item: TimelineItem): string{
    return `${item.label} (${formatTimestamp(item.timestamp)}) ⟷ ${item.label}`;
  }

  private createHistoryUri(
    uri: URI,
    timestamp?: number,
  ): URI {
    const resourceId = uri.resourceId + "_" + timestamp;
    const resourceType = uri.resourceType;
    const fullPath = uri.path.toString();
    return URI
      .fromFilePath(fullPath)
      .withScheme('history')
      .withQuery(`resourceType=${resourceType}&resourceId=${resourceId}&ref=${timestamp}`);
  }

  protected async loadTimelineForSource(source: string, uri: URI, reset: boolean): Promise<void> {
    if (reset) {
      this.items = [];
    }
    this.loading = true;
    try{
      await new Promise(resolve => setTimeout(resolve, 300));
      const timelineResult = await this.timelineService.getTimeline(source, uri, { cursor: undefined, limit: 100 });
      if (timelineResult) {
        const items = timelineResult.items;
        if (items) {
          this.items.push(...items);
          this.items.sort((a, b) => b.timestamp - a.timestamp);
        }
      }
    } finally {
      this.loading = false;
    }
  }

  protected render() {
    return createElement(TimelineListView, {
      loading: this.loading,
      items: this.items || [],
      open: (item)=> this.openDiffEditor(item),
    });
  }
  
  private getCurrentWidgetUri(): URI | undefined {
    let current = this.applicationShell.currentWidget;
    if (!NavigatableWidget.is(current)) {
      current = toArray(this.applicationShell.mainPanel.widgets()).find(widget => {
        if (widget.isVisible && !widget.isHidden) {
          return widget;
        }
      });
    }
    return NavigatableWidget.is(current) ? current.getResourceUri() : undefined;
  }
}