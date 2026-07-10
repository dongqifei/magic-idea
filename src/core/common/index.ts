/**
 * 将vscode的工具类做为系统的基础工具包
 */
export { Emitter, CancellationToken, CancellationTokenSource, Event as IEvent, Disposable as IDisposable, Event, Disposable } from 'vscode-languageserver-protocol';
export * from "./disposable";
export * from  "./types";
export * from './contribution-provider';
export * from './event';
export * from './promise-util';
export * from './messaging';
export * from './message-rpc';
export * from './key-store';
export * from './os';
export * from './cancellation';
export * from './uri';
export * from './path';
export * from './uuid';
export const UNTITLED_SCHEME = 'untitled';
