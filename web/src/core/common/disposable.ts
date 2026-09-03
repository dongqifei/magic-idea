import { IDisposable, Emitter, IEvent as Event } from './index';
import { isFunction, isObject } from './types';

/**
 * 可销毁对象的接口定义
 */
export type Disposable = IDisposable;

export namespace Disposable {
  export function is(arg: unknown): arg is Disposable {
      return isObject<Disposable>(arg) && isFunction(arg.dispose);
  }
  export function create(func: () => void): Disposable {
      return { dispose: func };
  }
  /** Always provides a reference to a new disposable. */
  export declare const NULL: Disposable;
}


/**
 * 增强版可销毁对象集合
 * 支持：
 * - 直接添加函数（自动包装为 Disposable）
 * - 批量添加多个 Disposable
 * - 解绑事件的快捷方法（on/off 模式）
 * - 清空集合（不销毁资源）
 */
export class DisposableCollection implements Disposable {
  private disposables: Disposable[] = [];
  protected readonly onDisposeEmitter = new Emitter<void>();
  private disposingElements = false;

  constructor(...toDispose: Disposable[]) {
    toDispose.forEach(d => this.push(d));
  }

  /**
   * This event is fired only once
   * on first dispose of not empty collection.
   */
  get onDispose(): Event<void> {
      return this.onDisposeEmitter.event;
  }

  protected checkDisposed(): void {
    if (this.disposed && !this.disposingElements) {
        this.onDisposeEmitter.fire(undefined);
        this.onDisposeEmitter.dispose();
    }
  }


  get disposed(): boolean {
    return this.disposables.length === 0;
  }

  /**
   * 添加可销毁对象（支持函数自动包装）
   */
  push(disposable: Disposable | (() => void)): void {
    // 如果是函数，自动包装为 Disposable 对象
    const item = typeof disposable === 'function' 
      ? { dispose: disposable } 
      : disposable;
    this.disposables.push(item);
    this.checkDisposed();
  }

  /**
   * 批量添加多个可销毁对象
   */
  pushAll(disposables: (Disposable | (() => void))[]): void {
    disposables.forEach(d => this.push(d));
  }

  /**
   * 快捷方法：添加事件监听的解绑逻辑
   * 适用于 (on: (cb) => void, off: (cb) => void, cb: () => void) 模式的事件
   */
  trackEvent<T extends (...args: any[]) => void>(
    on: (callback: T) => void,
    off: (callback: T) => void,
    callback: T
  ): void {
    on(callback); // 立即注册事件
    this.push(() => off(callback)); // 销毁时解绑
  }

  /**
   * 销毁所有资源并清空集合
   */
  dispose(): void {
    if (this.disposed || this.disposingElements) {
      return;
    }
    // 倒序销毁，避免依赖顺序问题
    this.disposingElements = true;
    for (let i = this.disposables.length - 1; i >= 0; i--) {
      try {
        this.disposables[i].dispose();
      } catch (error) {
        console.error('Failed to dispose:', error);
      }
    }
    this.disposables = [];
    this.disposingElements = false;
    this.checkDisposed();
  }

  /**
   * 清空集合但不销毁资源（慎用）
   */
  clear(): void {
    this.disposables = [];
  }
}

export type DisposableGroup = { push(disposable: Disposable): void } | { add(disposable: Disposable): void };
export namespace DisposableGroup {
    export function canPush(candidate?: DisposableGroup): candidate is { push(disposable: Disposable): void } {
        return Boolean(candidate && (candidate as { push(): void }).push);
    }
    export function canAdd(candidate?: DisposableGroup): candidate is { add(disposable: Disposable): void } {
        return Boolean(candidate && (candidate as { add(): void }).add);
    }
}

export function disposableTimeout(...args: Parameters<typeof setTimeout>): Disposable {
    const handle = setTimeout(...args);
    return { dispose: () => clearTimeout(handle) };
}

/**
 * Wrapper for a {@link Disposable} that is not available immediately.
 */
export class DisposableWrapper implements Disposable {

    private disposed = false;
    private disposable: Disposable | undefined = undefined;

    set(disposable: Disposable): void {
        if (this.disposed) {
            disposable.dispose();
        } else {
            this.disposable = disposable;
        }
    }

    dispose(): void {
        this.disposed = true;
        if (this.disposable) {
            this.disposable.dispose();
            this.disposable = undefined;
        }
    }
}
