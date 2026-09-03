import { IDisposable, Emitter, IEvent as Event } from './index';
/**
 * 可销毁对象的接口定义
 */
export type Disposable = IDisposable;
export declare namespace Disposable {
    function is(arg: unknown): arg is Disposable;
    function create(func: () => void): Disposable;
    /** Always provides a reference to a new disposable. */
    const NULL: Disposable;
}
/**
 * 增强版可销毁对象集合
 * 支持：
 * - 直接添加函数（自动包装为 Disposable）
 * - 批量添加多个 Disposable
 * - 解绑事件的快捷方法（on/off 模式）
 * - 清空集合（不销毁资源）
 */
export declare class DisposableCollection implements Disposable {
    private disposables;
    protected readonly onDisposeEmitter: Emitter<void>;
    private disposingElements;
    constructor(...toDispose: Disposable[]);
    /**
     * This event is fired only once
     * on first dispose of not empty collection.
     */
    get onDispose(): Event<void>;
    protected checkDisposed(): void;
    get disposed(): boolean;
    /**
     * 添加可销毁对象（支持函数自动包装）
     */
    push(disposable: Disposable | (() => void)): void;
    /**
     * 批量添加多个可销毁对象
     */
    pushAll(disposables: (Disposable | (() => void))[]): void;
    /**
     * 快捷方法：添加事件监听的解绑逻辑
     * 适用于 (on: (cb) => void, off: (cb) => void, cb: () => void) 模式的事件
     */
    trackEvent<T extends (...args: any[]) => void>(on: (callback: T) => void, off: (callback: T) => void, callback: T): void;
    /**
     * 销毁所有资源并清空集合
     */
    dispose(): void;
    /**
     * 清空集合但不销毁资源（慎用）
     */
    clear(): void;
}
export type DisposableGroup = {
    push(disposable: Disposable): void;
} | {
    add(disposable: Disposable): void;
};
export declare namespace DisposableGroup {
    function canPush(candidate?: DisposableGroup): candidate is {
        push(disposable: Disposable): void;
    };
    function canAdd(candidate?: DisposableGroup): candidate is {
        add(disposable: Disposable): void;
    };
}
export declare function disposableTimeout(...args: Parameters<typeof setTimeout>): Disposable;
/**
 * Wrapper for a {@link Disposable} that is not available immediately.
 */
export declare class DisposableWrapper implements Disposable {
    private disposed;
    private disposable;
    set(disposable: Disposable): void;
    dispose(): void;
}
