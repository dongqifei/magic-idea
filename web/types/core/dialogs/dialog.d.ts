import { Widget } from '@lumino/widgets';
import { ISignal } from '@lumino/signaling';
import { Root } from 'react-dom/client';
export declare enum DialogMode {
    PRIMARY = "primary",
    SECONDARY = "secondary"
}
export interface DialogButton<T> {
    label: string;
    className?: string;
    callback?: () => T;
    primary?: boolean;
}
export interface DialogIcon {
    type: 'class' | 'svg' | 'img';
    content: string;
    className?: string;
}
export interface DialogOptions<T> {
    title?: string;
    titleIcon?: DialogIcon;
    showCloseButton?: boolean;
    mode?: DialogMode;
    buttons?: DialogButton<T>[];
    width?: number | string;
    height?: number | string;
    modal?: boolean;
    onCloseButtonClick?: () => void;
}
export type DialogResult = 'ok' | 'cancel';
export declare class Dialog<T = void> extends Widget {
    private static readonly DIALOG_ZINDEX;
    private static readonly BACKDROP_ZINDEX;
    private _onClose;
    get onClose(): ISignal<this, T | undefined>;
    private panel;
    private titleBarWidget;
    private titleIconWidget;
    private titleWidget;
    private closeButtonWidget;
    private contentWidget;
    private buttonsPanel;
    private backdrop;
    private result?;
    protected reactRoot?: Root;
    protected options: DialogOptions<T>;
    constructor(options?: DialogOptions<T>);
    get contentNode(): HTMLElement;
    get titleNode(): HTMLElement;
    static cancelButton(): DialogButton<DialogResult>;
    static okButton(options?: Partial<DialogButton<DialogResult>>): DialogButton<DialogResult>;
    private initLayout;
    private initStyle;
    /**
     * 初始化标题图标
     */
    private initTitleIcon;
    /**
     * 初始化关闭按钮
     */
    private initCloseButton;
    private initButtons;
    private initBackdrop;
    /**
     * 更新对话框标题
     * @param title 新标题
     */
    setTitle(title: string): void;
    /**
     * 更新标题图标
     * @param icon 新图标配置
     */
    setTitleIcon(icon?: DialogIcon): void;
    open(): void;
    close(result?: T): void;
    renderContent(content: string | React.ReactNode | HTMLElement): void;
    static open<T>(dialog: Dialog<T>): Promise<T | undefined>;
    dispose(): void;
}
