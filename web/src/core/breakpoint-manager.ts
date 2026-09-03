import { injectable, inject } from "inversify";
import { Signal, ISignal } from '@lumino/signaling';
import URI from "./common/uri";
import { CommandRegistry } from "@lumino/commands";

export interface Breakpoint {
  readonly resourceUri: URI;
  readonly lineNumber: number;
  enabled: boolean;
  condition?: string;
}

@injectable()
export class BreakpointManager {
  private _breakpoints = new Map<string, Map<number, Breakpoint>>(); // resourceUri -> lineNumber -> Breakpoint
  private _onDidChangeBreakpoints = new Signal<this, { resourceUri: URI; breakpoints: Breakpoint[] }>(this);

  constructor(
    @inject(CommandRegistry) private readonly commands: CommandRegistry
  ){
    // 启用所有断点
    this.commands.addCommand("editor:breakpoint-enable-all", {
      label: "启用所有断点",
      execute: () => {
        this.updateAllBreakpointStatus(true);
      },
    });
    // 禁用所有断点
    this.commands.addCommand("editor:breakpoint-disable-all", {
      label: "禁用所有断点",
      execute: () => {
        this.updateAllBreakpointStatus(false);
      },
    });
    // 删除所有断点
    this.commands.addCommand("editor:breakpoint-remove-all", {
      label: "删除所有断点",
      execute: () => {
        this.clearAllBreakpoints();
      },
    });
  }

  get onDidChangeBreakpoints(): ISignal<this, { resourceUri: URI; breakpoints: Breakpoint[] }> {
    return this._onDidChangeBreakpoints;
  }

  getBreakpoints(resourceUri: URI): Breakpoint[] {
    return Array.from(this._breakpoints.get(resourceUri.toString())?.values() || []);
  }

  toggleBreakpoint(resourceUri: URI, lineNumber: number): Breakpoint | undefined {
    const resourceBreakpoints = this._breakpoints.get(resourceUri.toString()) || new Map<number, Breakpoint>();
    const existing = resourceBreakpoints.get(lineNumber);

    let breakpoint: Breakpoint | undefined;
    if (existing) {
      // 移除断点（关键：从Map中删除）
      resourceBreakpoints.delete(lineNumber);
      breakpoint = undefined; // 移除后返回undefined
    } else {
      // 添加新断点
      breakpoint = { resourceUri, lineNumber, enabled: true };
      resourceBreakpoints.set(lineNumber, breakpoint);
    }

    // 更新Map（如果为空则删除资源键）
    if (resourceBreakpoints.size === 0) {
      this._breakpoints.delete(resourceUri.toString());
    } else {
      this._breakpoints.set(resourceUri.toString(), resourceBreakpoints);
    }

    // 触发事件，通知断点变化（关键：传递最新的断点列表）
    this.fireBreakpointChangeEvent(resourceUri, Array.from(resourceBreakpoints.values()));

    return breakpoint;
  }

  // 删除所有断点
  clearAllBreakpoints(): void {
    // 收集所有资源对应的URI（从Breakpoint中获取，避免重新创建）
    const resourceUriMap = new Map<string, URI>();
    this._breakpoints.forEach((resourceBreakpoints) => {
      // 取任意一个断点的resourceUri即可（同一资源下的断点URI相同）
      const firstBreakpoint = resourceBreakpoints.values().next().value;
      if (firstBreakpoint) {
        resourceUriMap.set(firstBreakpoint.resourceUri.toString(), firstBreakpoint.resourceUri);
      }
    });

    // 清空所有断点数据
    this._breakpoints.clear();

    // 为每个资源触发断点变化事件（传递空数组）
    resourceUriMap.forEach((uri) => {
      this.fireBreakpointChangeEvent(uri, []);
    });
  }

  // 启用或禁用所有断点
  updateAllBreakpointStatus(enabled: boolean): void {
    // 遍历所有资源的断点
    this._breakpoints.forEach((resourceBreakpoints) => {
      // 若当前资源无断点，直接跳过
      if (!resourceBreakpoints || resourceBreakpoints.size === 0) return;

      // 取第一个断点的resourceUri（同一资源下URI相同）
      const resourceUri = resourceBreakpoints.values().next().value?.resourceUri;
      if(!resourceUri){
        return;
      }
      // 遍历该资源下的所有断点，设置为启用
      resourceBreakpoints.forEach((breakpoint, lineNumber) => {
        breakpoint.enabled = enabled;
        resourceBreakpoints.set(lineNumber, breakpoint);
      });
      // 触发该资源的断点变化事件
      this.fireBreakpointChangeEvent(resourceUri, Array.from(resourceBreakpoints.values()));
    });
  }

  // 发送断点变化事件
  private fireBreakpointChangeEvent(resourceUri: URI, breakpoints: Breakpoint[]): void {
    this._onDidChangeBreakpoints.emit({ resourceUri, breakpoints });
  }
}