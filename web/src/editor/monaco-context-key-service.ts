import { injectable, postConstruct } from 'inversify';
import {
    ContextKeyService as TheiaContextKeyService, ContextKey, ContextKeyChangeEvent,
    ScopedValueStore, ContextMatcher, ContextKeyValue, Context
} from '@MagicIdea/core/context-key-service';
import { Emitter, IEvent as Event } from '@MagicIdea/core/common';
import { AbstractContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/browser/contextKeyService';
import { ContextKeyExpr, ContextKeyExpression, IContext, IContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey';
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';

@injectable()
export class MonacoContextKeyService implements TheiaContextKeyService {
    protected readonly onDidChangeEmitter = new Emitter<ContextKeyChangeEvent>();
    get onDidChange(): Event<ContextKeyChangeEvent> {
        if (this.activeContext && 'onDidChange' in this.activeContext && this.activeContext.onDidChange) {
            return this.activeContext.onDidChange;
        }
        return this.onDidChangeEmitter.event;
    }

    get contextKeyService(): AbstractContextKeyService {
        return StandaloneServices.get(IContextKeyService) as AbstractContextKeyService;
    }

    @postConstruct()
    protected init(): void {
        this.contextKeyService.onDidChangeContext(e =>
            this.onDidChangeEmitter.fire({
                affects: keys => e.affectsSome(keys)
            })
        );
    }

    createKey<T extends ContextKeyValue>(key: string, defaultValue: T | undefined): ContextKey<T> {
        return this.contextKeyService.createKey(key, defaultValue);
    }

    activeContext?: HTMLElement | IContext | Context;

    match(expression: string, context?: HTMLElement): boolean {
        const parsed = this.parse(expression);
        if (parsed) {
            const ctx = this.identifyContext(context);
            if (!ctx) {
                return this.contextKeyService.contextMatchesRules(parsed);
            }
            return parsed.evaluate(ctx);
        }
        return true;
    }

    protected identifyContext(callersContext?: HTMLElement | IContext, service: IContextKeyService = this.contextKeyService): IContext | undefined {
        if (callersContext && 'getValue' in callersContext) {
            return callersContext;
        } else if (this.activeContext && 'getValue' in this.activeContext) {
            return this.activeContext;
        }
        const browserContext = callersContext ?? this.activeContext ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
        if (browserContext) {
            return service.getContext(browserContext);
        }
        return undefined;
    }

    protected readonly expressions = new Map<string, ContextKeyExpression>();
    parse(when: string): ContextKeyExpression | undefined {
        let expression = this.expressions.get(when);
        if (!expression) {
            expression = ContextKeyExpr.deserialize(when);
            if (expression) {
                this.expressions.set(when, expression);
            }
        }
        return expression;
    }

    parseKeys(expression: string): Set<string> | undefined {
        const expr = ContextKeyExpr.deserialize(expression);
        return expr ? new Set<string>(expr.keys()) : expr;
    }

    with<T>(values: Record<string, unknown>, callback: () => T): T {
        const id = this.contextKeyService.createChildContext();
        const child = this.contextKeyService.getContextValuesContainer(id);
        for (const [key, value] of Object.entries(values)) {
            child.setValue(key, value);
        }
        try {
            return this.withContext(child, callback);
        } finally {
            this.contextKeyService.disposeContext(id);
        }
    }

    withContext<T>(context: Context, callback: () => T): T {
        const oldActive = this.activeContext;
        this.activeContext = context;
        try {
            return callback();
        } finally {
            this.activeContext = oldActive;
        }
    }

    createScoped(target: HTMLElement): ScopedValueStore {
        const scoped = this.contextKeyService.createScoped(target);
        if (scoped instanceof AbstractContextKeyService) {
            return scoped as unknown as ScopedValueStore;
        }
        throw new Error('Could not created scoped value store');
    }

    createOverlay(overlay: Iterable<[string, unknown]>): ContextMatcher {
        const delegate = this.contextKeyService.createOverlay(overlay);
        return {
            match: (expression: string, context?: HTMLElement) => {
                const parsed = this.parse(expression);
                if (parsed) {
                    const ctx = this.identifyContext(context, delegate);
                    if (!ctx) {
                        return delegate.contextMatchesRules(parsed);
                    }
                    return parsed.evaluate(ctx);
                }
                return true;
            }
        };
    }

    setContext(key: string, value: unknown): void {
        this.contextKeyService.setContext(key, value);
    }

    dispose(): void {
        this.activeContext = undefined;
        this.onDidChangeEmitter.dispose();
        this.contextKeyService.dispose();
    }
}

