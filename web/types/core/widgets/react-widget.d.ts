import { Root } from 'react-dom/client';
import { Widget } from '@lumino/widgets';
import { BaseWidget } from './widget';
import { Message } from '@lumino/messaging';
/**
 * 轻量的 React -> Lumino wrapper
 * 将 root 保持为 protected 以便子类访问而不会重复声明 private 成员。
 */
export declare abstract class ReactWidget extends BaseWidget {
    protected root: Root;
    constructor(options?: Widget.IOptions);
    protected onAfterAttach(msg: Message): void;
    protected onUpdateRequest(msg: Message): void;
    protected renderNode(): React.ReactNode;
    protected abstract render(): React.ReactNode;
}
