import { injectable } from 'inversify';
import { Signal, ISignal } from '@lumino/signaling';
import { Notification, NotificationOptions, NotificationType, NotificationUpdate, Progress, ProgressUpdate } from './notification-types';

@injectable()
export class NotificationService {
  private _notifications: Notification[] = [];
  private _onDidAddNotification = new Signal<this, Notification>(this);
  private _onDidRemoveNotification = new Signal<this, string>(this); // 传递id
  private _onDidUpdateNotification = new Signal<this, NotificationUpdate>(this); // 通知更新信号
  // 存储进度与通知的映射关系
  private _progressNotificationMap = new Map<string, string>(); // progressId -> notificationId

  get onDidUpdateNotification(): ISignal<this, NotificationUpdate> {
    return this._onDidUpdateNotification;
  }

  get onDidAddNotification(): ISignal<this, Notification> {
    return this._onDidAddNotification;
  }

  get onDidRemoveNotification(): ISignal<this, string> {
    return this._onDidRemoveNotification;
  }

  get notifications(): ReadonlyArray<Notification> {
    return [...this._notifications];
  }

  /** 显示通知 */
  notify(
    message: string,
    type: NotificationType = NotificationType.INFO,
    options: NotificationOptions = {}
  ): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      message,
      type,
      options: {
        timeout: options.timeout ?? 5000, // 默认5秒关闭
        actions: options.actions ?? [],
        closable: options.closable ?? true,
        onClick: options.onClick,
        source: options.source ?? '',
        isProgress: options.isProgress ?? false,
      },
      createdAt: Date.now(),
    };

    this._notifications.push(notification);
    this._onDidAddNotification.emit(notification);

    // 设置自动关闭
    if (notification.options.timeout && notification.options.timeout > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.options.timeout);
    }

    return id;
  }

  /**
   * Shows the given message as a progress.
   * 适配原有使用方式：只更新消息文本，支持cancel关闭，兼容progress.report(message)
   */
  showProgress(
    options: NotificationOptions & { message: string },
    onDidCancel?: () => void
  ): Promise<Progress> {
    return new Promise<Progress>((resolve) => {
      // 生成唯一进度ID
      const progressId = this.generateId().replace('notification-', 'progress-');
      const { message } = options;

      // 创建进度通知：不自动关闭、显示取消按钮
      const notificationId = this.notify(message, NotificationType.INFO, {
        ...options,
        timeout: 0, // 进度通知不自动关闭
        // 添加取消按钮（点击触发取消回调）
        actions: [
          ...(options.actions ?? []),
          {
            label: '取消',
            type: 'primary',
            tooltip: '取消当前操作',
            callback: () => {
              this.dismiss(notificationId);
              this._progressNotificationMap.delete(progressId);
              onDidCancel?.();
            }
          }
        ],
        isProgress: true,
      });

      // 存储进度ID与通知ID的映射
      this._progressNotificationMap.set(progressId, notificationId);

      // 实现Progress接口：适配原有使用方式
      const progress: Progress = {
        id: progressId,
        // report方法：只更新消息文本（忽略work参数，保持兼容）
        report: (update: ProgressUpdate) => {
          if (!update.message) return;

          // 找到对应的通知并更新消息
          const index = this._notifications.findIndex(n => n.id === notificationId);
          if (index !== -1) {
            const oldMessage = this._notifications[index].message;
            if (oldMessage === update.message) return; // 消息相同则不更新

            this._notifications[index].message = update.message;
            // 触发【更新信号】而不是【添加信号】！！！核心修复
            this._onDidUpdateNotification.emit({
              id: notificationId,
              message: update.message
            });
          }
          // this.notify(update.message, NotificationType.INFO, {
          //   timeout: 2000,
          // })
        },
        // cancel方法：关闭对应的通知，触发取消回调
        cancel: () => {
          const storedNotificationId = this._progressNotificationMap.get(progressId);
          if (storedNotificationId) {
            this.dismiss(storedNotificationId);
            this._progressNotificationMap.delete(progressId);
          }
        },
        // resultPromise：适配接口定义（原有代码未使用，返回空Promise）
        result: new Promise<string | undefined>(() => {})
      };

      // 立即返回Progress实例
      resolve(progress);
    });
  }

  /** 快捷方法：信息通知 */
  info(message: string, options?: NotificationOptions): string {
    return this.notify(message, NotificationType.INFO, options);
  }

  /** 快捷方法：成功通知 */
  success(message: string, options?: NotificationOptions): string {
    return this.notify(message, NotificationType.SUCCESS, options);
  }

  /** 快捷方法：警告通知 */
  warn(message: string, options?: NotificationOptions): string {
    return this.notify(message, NotificationType.WARN, options);
  }

  /** 快捷方法：错误通知 */
  error(message: string, options?: NotificationOptions): string {
    return this.notify(message, NotificationType.ERROR, options);
  }

  /** 关闭通知 */
  dismiss(id: string): void {
    const index = this._notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this._notifications.splice(index, 1);
      this._onDidRemoveNotification.emit(id);

      // 如果关闭的是进度通知，同步删除映射
      for (const [progressId, notificationId] of this._progressNotificationMap.entries()) {
        if (notificationId === id) {
          this._progressNotificationMap.delete(progressId);
          break;
        }
      }
    }
  }

  /** 关闭所有通知 */
  dismissAll(): void {
    const ids = this._notifications.map(n => n.id);
    this._notifications = [];
    ids.forEach(id => this._onDidRemoveNotification.emit(id));
    this._progressNotificationMap.clear();
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}