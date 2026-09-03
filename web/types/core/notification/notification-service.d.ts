import { ISignal } from '@lumino/signaling';
import { Notification, NotificationOptions, NotificationType, NotificationUpdate, Progress } from './notification-types';
export declare class NotificationService {
    private _notifications;
    private _onDidAddNotification;
    private _onDidRemoveNotification;
    private _onDidUpdateNotification;
    private _progressNotificationMap;
    get onDidUpdateNotification(): ISignal<this, NotificationUpdate>;
    get onDidAddNotification(): ISignal<this, Notification>;
    get onDidRemoveNotification(): ISignal<this, string>;
    get notifications(): ReadonlyArray<Notification>;
    /** 显示通知 */
    notify(message: string, type?: NotificationType, options?: NotificationOptions): string;
    /**
     * Shows the given message as a progress.
     * 适配原有使用方式：只更新消息文本，支持cancel关闭，兼容progress.report(message)
     */
    showProgress(options: NotificationOptions & {
        message: string;
    }, onDidCancel?: () => void): Promise<Progress>;
    /** 快捷方法：信息通知 */
    info(message: string, options?: NotificationOptions): string;
    /** 快捷方法：成功通知 */
    success(message: string, options?: NotificationOptions): string;
    /** 快捷方法：警告通知 */
    warn(message: string, options?: NotificationOptions): string;
    /** 快捷方法：错误通知 */
    error(message: string, options?: NotificationOptions): string;
    /** 关闭通知 */
    dismiss(id: string): void;
    /** 关闭所有通知 */
    dismissAll(): void;
    private generateId;
}
