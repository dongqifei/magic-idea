import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget } from '../widgets/react-widget';
import { IStatusBarService, StatusBarItem } from './statusbar-types';
import { StatusBarComponent } from './statusbar-views';
import { createElement } from 'react';
import { debounce } from "lodash";
import { DisposableCollection } from '../common/disposable';
import { HoverService } from '../hover-service';

/**
 * 状态栏业务处理类
 */
@injectable()
export class StatusBarWidget extends ReactWidget {
  private items: StatusBarItem[] = [];
  // 用于管理当前组件的所有可销毁资源（事件监听等）
  private disposables = new DisposableCollection();

  // 新增：进度条相关变量
  private testProgressUpdater?: (opts: Partial<any>) => void; // 进度条更新器
  private progressTimer?: number; // 定时器 ID
  private currentProgress = 0; // 当前进度

  constructor(
    @inject(IStatusBarService) private readonly service: IStatusBarService,
    @inject(HoverService) private readonly hoverService: HoverService
  ) {
    super();
    this.id = 'app-status-bar';
    this.addClass('app-status-bar');
    this.node.style.width = '100%';
  }

  @postConstruct()
  protected init(): void {
    this.disposables.push(
      this.service.onDidChangeStatusBar(()=>{
        this.items = this.service.getItems();
        this.debouncedUpdate();
      })
    )
    // 初始加载数据
    this.items = this.service.getItems();

    // 注册测试数据（如果是临时测试用，建议移到外部，避免生产环境冗余）
    this.registerTestItems();

    // 监听组件自身的销毁事件（Lumino Widget 提供）
    this.disposed.connect(() => this.dispose());
  }

  protected debouncedUpdate = debounce(() => this.update(), 50);

  private registerTestItems(): void {
    // 注册测试项时，保存其 dispose 方法，以便销毁时清理
    // const testItem = this.service.registerItem('fullscreen', {
    //   type: 'button',
    //   icon: 'codicon codicon-remote',
    //   tooltip: '打开远程窗口',
    //   priority: 200,
    //   visible: true,
    //   onClick: (e: MouseEvent) => alert('打开远程窗口正在开发中...')
    // });
    // const testProgress = this.service.registerItem('test-progress', {
    //   text: 'Test Progress',
    //   type: 'progress',
    //   priority: 90,
    //   progress: 0,
    //   visible: true,
    //   onClick: (e: MouseEvent) => alert('Test Progress Clicked!')
    // });
    // // 保存进度条的更新器和定时器（用于后续动态更新）
    // this.testProgressUpdater = testProgress.update;

    // // 批量添加测试项的销毁逻辑
    // this.disposables.pushAll([
    //   () => {
    //     testProgress.dispose();
    //     // 销毁时停止定时器
    //     this.stopProgress();
    //   }
    // ]);

    // 启动进度模拟
    // this.startProgress();
  }

  private handleItemClick(e: MouseEvent, id: any): void {
    const item = this.items.find(i => i.id === id);
    item?.options.onClick?.(e);
  }

  protected render(): React.ReactNode {
    return createElement(StatusBarComponent, {
      items: this.items,
      hoverService: this.hoverService,
      onItemClick: (e: MouseEvent, id: string) => this.handleItemClick(e, id)
    });
  }

  /** 启动进度模拟 */
  private startProgress(): void {
    // 重置进度
    this.currentProgress = 0;
    this.testProgressUpdater?.({ progress: 0, tooltip: 'Loading...' });

    // 每隔 300ms 更新一次进度
    this.progressTimer = window.setInterval(() => {
      // 随机增加 1-5 的进度（模拟真实加载的不确定性）
      this.currentProgress += Math.floor(Math.random() * 5) + 1;

      if (this.currentProgress >= 100) {
        // 进度达到 100% 时停止
        this.currentProgress = 100;
        this.testProgressUpdater?.({ 
          progress: 100, 
          text: 'Loaded!',
          visible: false,
        });
        this.stopProgress();
      } else {
        // 更新进度
        this.testProgressUpdater?.({ 
          progress: this.currentProgress, 
          text: `Loading... ${this.currentProgress}%` 
        });
      }
    }, 300);
  }

  /** 停止进度模拟 */
  private stopProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
  }

  /**
   * 重写销毁方法，清理所有资源
   * 会在组件被销毁时（如从 DockPanel 中移除）自动调用
   */
  override dispose(): void {
    // 销毁所有注册的事件监听和测试项
    this.disposables.dispose();
    // 调用父类销毁方法（Lumino Widget 自带）
    super.dispose();
  }
}