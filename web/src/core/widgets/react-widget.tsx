import { Disposable } from '../common';
import { createRoot, Root } from 'react-dom/client';
import { Widget } from '@lumino/widgets';
import { BaseWidget } from './widget';
import { Message } from '@lumino/messaging';

/**
 * 轻量的 React -> Lumino wrapper
 * 将 root 保持为 protected 以便子类访问而不会重复声明 private 成员。
 */
export abstract class ReactWidget extends BaseWidget {
  protected root: Root;

  constructor(options?: Widget.IOptions) {
    super(options);
    this.scrollOptions = {
      suppressScrollX: true,
      minScrollbarLength: 35,
    };
    this.node.tabIndex = -1;
    this.root = createRoot(this.node);
    this.toDispose.push(Disposable.create(() => this.root.unmount()));
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    if (!this.isDisposed) {
      this.renderNode();
    }
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    if (!this.isDisposed) {
      this.renderNode();
    }
  }

  protected renderNode(): React.ReactNode {
    if (!this.root) return;

    this.root.render(this.render());
  }

  protected abstract render(): React.ReactNode;
}