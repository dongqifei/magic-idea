import { Emitter, CancellationToken } from './index';
export type WaitUntilData<T> = Omit<T, 'waitUntil' | 'token'>;
export interface WaitUntilEvent {
    /**
     * A cancellation token.
     */
    token?: CancellationToken;
    /**
     * Allows to pause the event loop until the provided thenable resolved.
     *
     * *Note:* It can only be called during event dispatch and not in an asynchronous manner
     *
     * @param thenable A thenable that delays execution.
     */
    waitUntil(thenable: Promise<any>): void;
}
export declare namespace WaitUntilEvent {
    /**
     * Fire all listeners in the same tick.
     *
     * Use `AsyncEmitter.fire` to fire listeners async one after another.
     */
    function fire<T extends WaitUntilEvent>(emitter: Emitter<T>, event: WaitUntilData<T>, timeout?: number, token?: any): Promise<void>;
}
