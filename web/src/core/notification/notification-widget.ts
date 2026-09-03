import { Widget, Panel, PanelLayout } from '@lumino/widgets';
import { NotificationService } from './notification-service';
import { NotificationType, NotificationAction, Notification } from './notification-types';
import { IStatusBarService } from '../statusbar';
import { DisposableCollection } from '../common/disposable';
import { inject, injectable } from 'inversify';
import { Signal } from '@lumino/signaling';
import "./notification-styles.css"

@injectable()
export class NotificationCenterWidget extends Widget {
  private completeNotifications = new Map<string, SingleNotificationWidget>();
  private standaloneNotifications = new Map<string, SingleNotificationWidget>();

  private completeLayout: Panel;
  private standaloneLayout: Panel;
  private header: Widget;
  private completePanel: Panel;
  private standalonePanel: Panel; 
  
  private countElement: HTMLElement;
  private readonly disposables = new DisposableCollection();
  private cursorItemUpdate?: (opts: any) => void;
  private isPanelVisible = false;

  private readonly MAX_STANDALONE_COUNT = 3; // 最大独立显示数量

  constructor(
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(IStatusBarService) private statusBarService: IStatusBarService,
  ) {
    super({ node: document.createElement('div') });
    

    // 创建头部控制栏
    this.header = this.createHeader();
    this.countElement = this.header.node.querySelector('.notification-count')!;

    // 创建消息内容面板
    this.completePanel = new Panel();
    this.completePanel.addClass('notification-complete-panel');
    // 创建独立通知容器
    this.standalonePanel = new Panel();
    // 主布局
    this.layout = new PanelLayout();
    
    this.completeLayout = new Panel();
    this.completeLayout.addClass('magic-idea-notification-list');
    if(!this.isPanelVisible) this.completeLayout.addClass('hidden');
    this.completeLayout.addWidget(this.header);
    this.completeLayout.addWidget(this.completePanel);

    this.standaloneLayout = new Panel();
    this.standaloneLayout.addClass('magic-idea-notification-single');
    this.standaloneLayout.addWidget(this.standalonePanel);
    (this.layout as PanelLayout).addWidget(this.completeLayout);
    (this.layout as PanelLayout).addWidget(this.standaloneLayout);

    // 监听通知事件
    this.notificationService.onDidAddNotification.connect((_, notification) => {
      this.addNotification(notification);
      this.updateNotificationCount();
    });

     // 监听通知更新信号，只更新现有通知的消息
    this.notificationService.onDidUpdateNotification.connect((_, update) => {
      this.updateNotificationMessage(update.id, update.message);
    });
    
    this.notificationService.onDidRemoveNotification.connect((_, id) => {
      this.removeNotification(id);
      this.updateNotificationCount();
    });

    // 初始计数
    this.updateNotificationCount();

    // 状态栏项
    const cursorItem = this.statusBarService.registerItem('notification', {
      icon: "codicon codicon-bell",
      alignment: 'right',
      dot: false,
      priority: 30,
      tooltip: '消息通知',
      type: 'button',
      visible: true,
      onClick: () => { 
        this.togglePanelVisibility();
      },
    });
    this.cursorItemUpdate = cursorItem.update;

    this.disposables.pushAll([
      () => cursorItem.dispose(),
    ]);
  }

  // 更新现有通知的消息文本
  private updateNotificationMessage(id: string, message: string): void {
    // 先从面板通知中查找
    let widget = this.completeNotifications.get(id);
    if (widget) {
      widget.updateMessage(message);
      return;
    }
    // 再从独立通知中查找
    widget = this.standaloneNotifications.get(id);
    if (widget) {
      widget.updateMessage(message);
    }
  }

  private togglePanelVisibility(): void {
    this.isPanelVisible = !this.isPanelVisible;
    
    if (this.isPanelVisible) {
      this.completeLayout.node.classList.remove('hidden');
      this.moveStandaloneNotificationsToPanel();
    } else {
      this.completeLayout.node.classList.add('hidden');
    }
  }

  private moveStandaloneNotificationsToPanel(): void {
    for (const [id, widget] of this.standaloneNotifications) {
      widget.removeClass('standalone-notification');
      widget.removeClass('visible');
      
      setTimeout(() => {
        this.completePanel.addWidget(widget);
        this.completeNotifications.set(id, widget);
        widget.addClass('visible')
      }, 10);
    }
    this.standaloneNotifications.clear();
  }

  private createHeader(): Widget {
    const header = new Widget({ node: document.createElement('div') });
    header.addClass('notification-header');

    // 左侧标题和计数
    const titleContainer = document.createElement('div');
    titleContainer.className = 'notification-header-title';
    titleContainer.textContent = '消息通知';
    
    const countBadge = document.createElement('span');
    countBadge.className = 'notification-count';
    titleContainer.appendChild(countBadge);

    // 右侧操作按钮
    const actionsContainer = document.createElement('ul');
    actionsContainer.className = 'notification-header-actions';

    // 清除所有按钮
    const clearButton = document.createElement('li');
    clearButton.className = 'codicon codicon-clear-all magic-idea-button secondary';
    clearButton.title = "清除所有通知";
    clearButton.addEventListener('click', () => this.notificationService.dismissAll());

    // 免打扰按钮
    const doNotDisturbButton = document.createElement('li');
    doNotDisturbButton.className = 'codicon codicon-bell-slash magic-idea-button secondary';
    doNotDisturbButton.title = "配置免打扰";
    doNotDisturbButton.addEventListener('click', () => {
      doNotDisturbButton.classList.toggle('active');
      const isActive = doNotDisturbButton.classList.contains('active');
      this.node.classList.toggle('do-not-disturb', isActive);
    });

    // 隐藏按钮
    const hideButton = document.createElement('li');
    hideButton.className = 'codicon codicon-chevron-down magic-idea-button secondary';
    hideButton.title = "隐藏通知";
    hideButton.addEventListener('click', () => {
      this.togglePanelVisibility();
    });

    actionsContainer.append(clearButton, doNotDisturbButton, hideButton);
    header.node.append(titleContainer, actionsContainer);

    return header;
  }

  private updateNotificationCount(): void {
    const totalCount = this.completeNotifications.size + this.standaloneNotifications.size;
    this.countElement.textContent = totalCount > 0 ? `(${totalCount})` : '';
    this.cursorItemUpdate?.({
      icon: totalCount > 0 ? "codicon codicon-bell-dot" : "codicon codicon-bell",
    });
  }

  private addNotification(notification: any): void {
    const widget = new SingleNotificationWidget(
      notification,
      () => this.notificationService.dismiss(notification.id)
    );
    
    // 绑定按钮事件
    widget.onActionTriggered.connect((_, { action, id }) => {
      const targetAction = notification.options.actions.find((a: any) => a.label === action);
      if (targetAction) {
        targetAction.callback();
      }
      this.notificationService.dismiss(id);
    });

    // 绑定点击事件
    if (notification.options.onClick) {
      widget.node.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (target && 
            !target.closest('.magic-idea-notification-actions') && 
            !target.closest('.magic-idea-notification-buttons')) {
          notification.options.onClick!();
        }
      });
    }

    // 根据面板状态决定显示方式
    if (this.isPanelVisible) {
      this.showNotificationAsComplete(widget, notification.id);
    } else {
      this.showNotificationAsStandalone(widget, notification.id);
    }
  }

  private showNotificationAsComplete(widget: SingleNotificationWidget, id: string): void { 
    this.completeNotifications.set(id, widget);
    this.completePanel.addWidget(widget);
    setTimeout(() => widget.addClass('visible'), 10);
  }

  private showNotificationAsStandalone(widget: SingleNotificationWidget, id: string): void {
    // 独立通知超过设置的数量时，自动将最早的一条移动到completeNotifications中
    if (this.standaloneNotifications.size >= this.MAX_STANDALONE_COUNT) {
      // 找到最早的通知（在Map中第一个）
      const firstEntry = this.standaloneNotifications.entries().next();
      this.standaloneNotifications.delete(id);
      if (!firstEntry.done) {
        const [id, widget] = firstEntry.value;
        this.showNotificationAsComplete(widget, id);
        this.standaloneNotifications.delete(id);
      }
    }
    this.standaloneNotifications.set(id, widget);
    this.standalonePanel.addWidget(widget);
    // 短暂延迟后显示，确保DOM已插入
    setTimeout(() => {
      widget.addClass('visible');
    }, 10);
  }

  private removeNotification(id: string): void {
    // 先从面板中查找
    let widget = this.completeNotifications.get(id);
    if (widget) {
      this.removeWidgetWithAnimation(widget, id, this.completeNotifications);
      return;
    }
    
    // 再从独立通知中查找
    widget = this.standaloneNotifications.get(id);
    if (widget) {
      this.removeWidgetWithAnimation(widget, id, this.standaloneNotifications);
    }
  }

  private removeWidgetWithAnimation(
    widget: SingleNotificationWidget, 
    id: string, 
    collection: Map<string, SingleNotificationWidget>
  ): void {
    widget.removeClass('visible');
    collection.delete(id);
    
    setTimeout(() => {
      if (!widget.isDisposed) {
        widget.dispose();
      }
    }, 300);
  }

  dispose(): void {
    for (const widget of this.standaloneNotifications.values()) {
      if (!widget.isDisposed) {
        widget.dispose();
      }
    }
    this.standaloneNotifications.clear();
    
    for (const widget of this.completeNotifications.values()) {
      if (!widget.isDisposed) {
        widget.dispose();
      }
    }
    this.completeNotifications.clear();
    
    this.disposables.dispose();
    super.dispose();
  }
}

class SingleNotificationWidget extends Widget {
  private _onActionTriggered = new Signal<this, { action: string; id: string }>(this);
  private messageElement?: HTMLDivElement; // 存储消息元素引用
  private progressBar?: HTMLDivElement; // 加载条元素
  private isProgress: boolean; // 是否为进度通知

  get onActionTriggered(): Signal<this, { action: string; id: string }> {
    return this._onActionTriggered;
  }

  constructor(
    private notification: Notification,
    private onClose: () => void
  ) {
    super({ node: document.createElement('div') });
    this.isProgress = notification.options.isProgress || false;
    this.addClass('magic-idea-notification-list-item-container');
    // 进度通知添加专属类名
    if (this.isProgress) {
      this.addClass('magic-idea-progress-notification');
    }
    this.buildContent();
  }

  // 新增：更新消息文本的方法
  updateMessage(message: string): void {
    if (this.messageElement) {
      this.messageElement.innerHTML = message;
    }
  }

  private buildContent(): void {
    // 主容器
    const mainContainer = document.createElement('div');
    mainContainer.className = 'magic-idea-notification-list-item';
    mainContainer.tabIndex = 0;

    // 内容区域
    const content = document.createElement('div');
    content.className = 'magic-idea-notification-list-item-content';

    // 主要内容（图标+消息+关闭按钮）
    const contentMain = document.createElement('div');
    contentMain.className = 'magic-idea-notification-list-item-content-main';

    // 图标
    const icon = this.createIcon();
    contentMain.appendChild(icon);

    // 消息文本（支持HTML）- 存储引用以便后续更新
    this.messageElement = document.createElement('div');
    this.messageElement.className = 'magic-idea-notification-message';
    this.messageElement.innerHTML = this.notification.message;
    contentMain.appendChild(this.messageElement);

    // 操作按钮（关闭）
    const actionsList = document.createElement('ul');
    actionsList.className = 'magic-idea-notification-actions';
    const closeItem = document.createElement('li');
    closeItem.className = 'codicon codicon-close action-label';
    closeItem.title = '清除';
    closeItem.dataset.messageId = this.notification.id;
    closeItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onClose();
    });
    actionsList.appendChild(closeItem);
    contentMain.appendChild(actionsList);
    // 组装结构
    content.appendChild(contentMain);

    if (this.notification.options.actions && this.notification.options.actions?.length > 0 || this.notification.options.source) {
      // 底部区域（按钮组）
      const contentBottom = document.createElement('div');
      contentBottom.className = 'magic-idea-notification-list-item-content-bottom';

      // 来源区域（预留）
      const source = document.createElement('div');
      source.className = 'magic-idea-notification-source';
      source.textContent = this.notification.options.source ? '来源：' + this.notification.options.source : '';
      contentBottom.appendChild(source);

      // 按钮组
      if (this.notification.options.actions && this.notification.options.actions?.length > 0) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'magic-idea-notification-buttons';
        
        this.notification.options.actions.forEach((action: NotificationAction) => {
          const button = document.createElement('button');
          button.className = 'magic-idea-button ' + (action.type || 'secondary');
          button.dataset.messageId = this.notification.id;
          button.dataset.action = action.label;
          button.textContent = action.label;
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            this._onActionTriggered.emit({
              action: action.label,
              id: this.notification.id
            });
          });
          buttonsContainer.appendChild(button);
        });
        
        contentBottom.appendChild(buttonsContainer);
      }
      content.appendChild(contentBottom);
    }
    
    mainContainer.appendChild(content);
    // 新增：进度通知添加「滚动增长蓝条」（核心简化点）
    if (this.isProgress) {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'magic-idea-notification-loading-bar';
      mainContainer.appendChild(this.progressBar); // 加载条放在消息下方
    }
    this.node.appendChild(mainContainer);
  }

  private createIcon(): HTMLDivElement {
    const icon = document.createElement('div');
    icon.className = 'magic-idea-notification-icon codicon';
    
    switch (this.notification.type) {
      case NotificationType.INFO:
        icon.classList.add('codicon-info', 'info');
        break;
      case NotificationType.SUCCESS:
        icon.classList.add('codicon-pass', 'success');
        break;
      case NotificationType.WARN:
        icon.classList.add('codicon-warning', 'warn');
        break;
      case NotificationType.ERROR:
        icon.classList.add('codicon-error', 'error');
        break;
      default:
        icon.classList.add('codicon-info', 'info');
    }
    return icon;
  }
}