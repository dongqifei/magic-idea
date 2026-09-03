/**
 * Simple implementation of the deferred pattern.
 * An object that exposes a promise and functions to resolve and reject it.
 */
export declare class Deferred<T = void> {
    state: 'resolved' | 'rejected' | 'unresolved';
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (err?: unknown) => void;
    promise: Promise<T>;
    protected setState(state: 'resolved' | 'rejected'): void;
}
