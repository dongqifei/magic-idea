import URI from "./common/uri";
import { Disposable, MaybePromise, ContributionProvider, IEvent as Event, Emitter } from "./common";
import { PreferenceService } from './preferences/preference-service';
export interface OpenerOptions {
}
export declare const OpenHandler: unique symbol;
export interface OpenHandler {
    /**
     * A unique id of this handler.
     */
    readonly id: string;
    /**
     * A human-readable name of this handler.
     */
    readonly label?: string;
    /**
     * A css icon class of this handler.
     */
    readonly iconClass?: string;
    /**
     * 判断是否能打开指定 URI
     */
    canHandle(uri: URI, options?: OpenerOptions): MaybePromise<number>;
    /**
     * 打开 URI
     */
    open(uri: URI, options?: OpenerOptions): Promise<object | undefined>;
}
export interface OpenerService {
    getOpeners(uri: URI, options?: OpenerOptions): Promise<OpenHandler[]>;
    getOpener(uri: URI, options?: OpenerOptions): Promise<OpenHandler>;
    addHandler(openHandler: OpenHandler): Disposable;
    removeHandler(openHandler: OpenHandler): void;
    /**
     * Event that fires when a new opener is added or removed.
     */
    onDidChangeOpeners?: Event<void>;
}
export declare const OpenerService: unique symbol;
export declare class DefaultOpenerService implements OpenerService {
    protected readonly handlersProvider: ContributionProvider<OpenHandler>;
    protected readonly customEditorOpenHandlers: OpenHandler[];
    protected readonly onDidChangeOpenersEmitter: Emitter<void>;
    readonly onDidChangeOpeners: Event<void>;
    constructor(handlersProvider: ContributionProvider<OpenHandler>);
    getOpeners(uri: URI, options?: OpenerOptions): Promise<OpenHandler[]>;
    getOpener(uri: URI, options?: OpenerOptions): Promise<OpenHandler>;
    addHandler(openHandler: OpenHandler): Disposable;
    removeHandler(openHandler: OpenHandler): void;
    protected prioritize(uri: URI, options?: OpenerOptions): Promise<OpenHandler[]>;
    protected getHandlers(): OpenHandler[];
}
/**
 * 打开文件
 * @param openerService
 * @param uri
 * @param options
 * @returns
 */
export declare function open(openerService: OpenerService, uri: URI, options?: OpenerOptions): Promise<object | undefined>;
export declare const defaultHandlerPriority = 100000;
export declare function getDefaultHandler(uri: URI, preferenceService: PreferenceService): string | undefined;
