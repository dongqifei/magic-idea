import { createElement } from "react";
import { CommandRegistry } from "@lumino/commands";
import { ReactWidget } from "../../widgets/react-widget";
import { ToolbarService } from "./toolbar-types";
import { ToolbarViewPure } from "./toolbar-views";
import { ActivityManager } from "../../nav-activity/nav-activity-manager";
import { DisposableCollection } from '../../common/disposable';

export class ToolbarWidget extends ReactWidget {
// 用于管理当前组件的所有可销毁资源（事件监听等）
  private disposables = new DisposableCollection();
  constructor(
    private commands: CommandRegistry,
    private toolbarService: ToolbarService,
    private activityManager: ActivityManager,
  ) {
    super();
    this.id = "app-toolbar";
    this.addClass("lm-Toolbar");
    // 设置工具栏样式（可通过 CSS 进一步自定义）
    this.node.style.display = "flex";
    this.node.style.justifyContent = "space-between";
    this.node.style.alignItems = "center";

    // 监听活动区域激活事件，更新工具栏显示状态，用 trackEvent 快捷管理事件（自动注册+解绑）
    this.disposables.trackEvent(
      (cb) => this.activityManager.regionActivated.connect(cb), // 注册事件的方法
      (cb) => this.activityManager.regionActivated.disconnect(cb), // 解绑事件的方法
      () => { // 事件回调
        this.update();
      }
    );

    this.toolbarService.onDidChangeToolbar(()=>{
      this.update();
    });
  }

  /** 重写渲染方法 */
  protected render(): React.ReactNode {
    return createElement(ToolbarViewPure, {
      toolbarService: this.toolbarService,
      commandRegistry: this.commands,
    });
  }

  /** 销毁时清理资源 */
  dispose(): void {
    super.dispose();
    // 可添加额外的清理逻辑
    this.disposables.dispose();
  }
}