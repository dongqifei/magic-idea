import { inject, injectable } from 'inversify';
import { PreferenceService } from '@MagicIdea/core/preferences';
import { PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS } from './ai-code-completion-preference';

export interface CodeCompletionPostProcessor {
    postProcess(text: string): string;
}
export const CodeCompletionPostProcessor = Symbol('CodeCompletionPostProcessor');

@injectable()
export class DefaultCodeCompletionPostProcessor {

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    public postProcess(text: string): string {
        if (this.preferenceService.get<boolean>(PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS, true)) {
            return this.stripBackticks(text);
        }
        return text;
    }

    public stripBackticks(text: string): string {
        if (!text) {
            return '';
        }
        const trimmedStart = text.trimStart();
        if (trimmedStart.startsWith('```')) {
            // Remove the first backticks and any language identifier
            const startRemoved = trimmedStart.slice(3).replace(/^\w*\n/, '');
            const lastBacktickIndex = startRemoved.lastIndexOf('```');
            return lastBacktickIndex !== -1 ? startRemoved.slice(0, lastBacktickIndex).trim() : startRemoved.trim();
        }
        return text;
    }
}
