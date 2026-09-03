export declare enum NotificationType {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    SUCCESS = "success"
}
export interface NotificationOptions {
    /** 自动关闭时间(ms)，0表示不自动关闭 */
    timeout?: number;
    /** 可交互按钮 */
    actions?: NotificationAction[];
    /** 是否显示关闭按钮 */
    closable?: boolean;
    /** 点击通知回调 */
    onClick?: () => void;
    source?: string;
    isProgress?: boolean;
}
export interface NotificationAction {
    label: string;
    callback: () => void;
    /** 按钮样式类型 */
    type?: 'primary' | 'secondary';
    tooltip?: string;
}
export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    options: NotificationOptions;
    createdAt: number;
}
export interface NotificationUpdate {
    id: string;
    message: string;
}
export interface ProgressUpdate {
    /**
     * Updated message for the progress.
     */
    readonly message?: string;
    /**
     * Updated ratio between steps done so far and total number of steps.
     */
    readonly work?: {
        done: number;
        total: number;
    };
}
export interface Progress {
    /**
     * Unique progress id.
     */
    readonly id: string;
    /**
     * Update the current progress.
     *
     * @param update the data to update.
     */
    readonly report: (update: ProgressUpdate) => void;
    /**
     * Cancel or complete the current progress.
     */
    readonly cancel: () => void;
    /**
     * Result of the progress.
     *
     * @returns a promise which resolves to either 'Cancel', an alternative action or `undefined`.
     */
    readonly result: Promise<string | undefined>;
}
