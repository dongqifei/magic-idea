import { inject, injectable } from "inversify";
import * as monaco from "monaco-editor";
import { InlineCompletionTriggerKind } from 'monaco-editor/esm/vs/editor/common/languages';

import { FrontendApplication, FrontendApplicationContribution } from "@MagicIdea/core";
import { Disposable, MaybePromise } from "@MagicIdea/core/common";
import { PreferenceService } from '@MagicIdea/core/preferences';

import { AICodeInlineCompletionsProvider } from './code-inline-completion-provider';
import { InlineCompletionDebouncer } from './code-completion-debouncer';
import { CodeCompletionCache } from './code-completion-cache';

import {
    PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE,
    PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY,
    PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS,
    PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY
} from './ai-code-completion-preference';

@injectable()
export class AIFrontendApplicationContribution implements FrontendApplicationContribution {

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(AICodeInlineCompletionsProvider)
  private inlineCodeCompletionProvider: AICodeInlineCompletionsProvider;

  private completionCache = new CodeCompletionCache();
  private debouncer = new InlineCompletionDebouncer();
  private debounceDelay: number;
  private toDispose = new Map<string, Disposable>();

  onDidInitializeLayout(app: FrontendApplication): MaybePromise<void> {
    this.preferenceService.ready.then(() => {
        this.handlePreferences();
    });
  }

  protected handlePreferences(): void {
    const handler = () => this.handleInlineCompletions();

    this.toDispose.set('inlineCompletions', handler());

    this.debounceDelay = this.preferenceService.get<number>(PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY, 500);

    const cacheCapacity = this.preferenceService.get<number>(PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY, 100);
    this.completionCache.setMaxSize(cacheCapacity);

    this.preferenceService.onDidPreferenceChanged((event) => {
        if (event.key === PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE
            || event.key === PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS) {
            this.toDispose.get('inlineCompletions')?.dispose();
            this.toDispose.set('inlineCompletions', handler());
        }
        if (event.key === PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY) {
            this.debounceDelay = event.newValue as number;
        }
        if (event.key === PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY) {
            this.completionCache.setMaxSize(event.newValue as number);
        }
    });
  }

  protected handleInlineCompletions(): Disposable {
    const automatic = this.preferenceService.get<boolean>(PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE, false);
    if(!automatic){
      return Disposable.NULL;
    }

    return monaco.languages.registerInlineCompletionsProvider(
      { pattern: '**/*.{json,md,ms,sql,ts,txt,yaml,yml,xml,html,css,js,ts,jsx,tsx,java,go,py,php,sh,bat,vbs}'},
      {
        provideInlineCompletions: (model, position, context, token) => {
          if (!automatic && context.triggerKind === InlineCompletionTriggerKind.Automatic) {
            return { items: [] };
          }
          const fileName = model.uri.toString();
          const completionHandler = async () => {
            try {
              const cacheKey = this.completionCache.generateKey(fileName, model, position);
              const cachedCompletion = this.completionCache.get(cacheKey);
              if (cachedCompletion) {
                return cachedCompletion;
              }

              const completion = await this.inlineCodeCompletionProvider.provideInlineCompletions(
                model,
                position,
                context,
                token
              );

              if (completion && completion.items.length > 0) {
                this.completionCache.put(cacheKey, completion);
              }
              return completion;
            } catch (error) {
                console.error('Error providing inline completions:', error);
                return { items: [] };
            }
          };
          if (context.triggerKind === InlineCompletionTriggerKind.Automatic) {
              return this.debouncer.debounce(async () => completionHandler(), this.debounceDelay);
          } else if (context.triggerKind === InlineCompletionTriggerKind.Explicit) {
              return completionHandler();
          }
        },
        disposeInlineCompletions: () => {
          // 释放资源
        }
      }
    );
  }
}