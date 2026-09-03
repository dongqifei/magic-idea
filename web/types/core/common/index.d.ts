/**
 * 将monaco-editor的工具类做为系统的基础工具包
 */
export { Emitter, CancellationToken, CancellationTokenSource, Event as IEvent, Disposable as IDisposable, Event, Disposable } from 'vscode-languageserver-protocol';
export * from "./disposable";
export * from "./types";
export * from './contribution-provider';
export * from './event';
export * from './array-utils';
export * from './promise-util';
export * from './diff-uris';
export * from './prioritizeable';
export * from './menu';
export * from './uri';
export * from './path';
export * from './cron-parser';
export * from './paths';
export * from './glob';
export * from './strings';
export * from './char-code';
export * from './json-schema';
export * from './tauri-util';
export * from './uuid';
export * from './nls';
export * from './reference';
export * from './resource';
export * from './objects';
export * from './os';
export * from './env-variables';
export declare const UNTITLED_SCHEME = "untitled";
