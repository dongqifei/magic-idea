import { ContextKeyService as TheiaContextKeyService, ContextKey, ContextKeyChangeEvent, ScopedValueStore, ContextMatcher, ContextKeyValue, Context } from '..\core\context-key-service';
import { Emitter, IEvent as Event } from '..\core\common';
import { AbstractContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/browser/contextKeyService';
import { ContextKeyExpression, IContext, IContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey';
export declare class MonacoContextKeyService implements TheiaContextKeyService {
    protected readonly onDidChangeEmitter: Emitter<ContextKeyChangeEvent>;
    get onDidChange(): Event<ContextKeyChangeEvent>;
    get contextKeyService(): AbstractContextKeyService;
    protected init(): void;
    createKey<T extends ContextKeyValue>(key: string, defaultValue: T | undefined): ContextKey<T>;
    activeContext?: HTMLElement | IContext | Context;
    match(expression: string, context?: HTMLElement): boolean;
    protected identifyContext(callersContext?: HTMLElement | IContext, service?: IContextKeyService): IContext | undefined;
    protected readonly expressions: Map<string, ContextKeyExpression>;
    parse(when: string): ContextKeyExpression | undefined;
    parseKeys(expression: string): Set<string> | undefined;
    with<T>(values: Record<string, unknown>, callback: () => T): T;
    withContext<T>(context: Context, callback: () => T): T;
    createScoped(target: HTMLElement): ScopedValueStore;
    createOverlay(overlay: Iterable<[string, unknown]>): ContextMatcher;
    setContext(key: string, value: unknown): void;
    dispose(): void;
}
