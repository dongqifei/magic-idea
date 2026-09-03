import { injectable } from 'inversify';
import { IEvent, Emitter } from '../common';
import { StatusBarItem, IStatusBarService, StatusBarItemOptions } from './statusbar-types';

/**
 * 状态栏服务实现
 */
@injectable()
export class StatusBarServiceImpl implements IStatusBarService {
  private items = new Map<string, StatusBarItemOptions>();

  protected readonly onDidChangeStatusBarEmitter = new Emitter<void>();

  get onDidChangeStatusBar(): IEvent<void> {
    return this.onDidChangeStatusBarEmitter.event;
  }

  /**
   * 发送状态栏变化事件
   */
  protected fireOnDidChangeStatusBar(): void {
    this.onDidChangeStatusBarEmitter.fire();
  }

  registerItem(id: string, options: StatusBarItemOptions) {
    if (this.items.has(id)) {
      throw new Error(`StatusBar item already exists: ${id}`);
    }
    this.items.set(id, { ...options });
    this.fireOnDidChangeStatusBar();

    const update = (opts: Partial<StatusBarItemOptions>) => {
      const prev = this.items.get(id);
      if (!prev) return;
      this.items.set(id, { ...prev, ...opts });
      this.fireOnDidChangeStatusBar();
    };

    const dispose = () => {
      this.items.delete(id);
      this.fireOnDidChangeStatusBar();
    };

    return { dispose, update };
  }

  removeItem(id: string) {
    if (this.items.delete(id)) {
      this.fireOnDidChangeStatusBar();
    }
  }

  getItems(): StatusBarItem[] {
    const list: StatusBarItem[] = [];
    for (const [id, options] of this.items) {
      list.push({ id, options });
    }
    return list;
  }
}