
import * as monaco from 'monaco-editor';

import { inject, injectable } from 'inversify';
import { CodeCompletionAgent } from './code-completion-agent';

@injectable()
export class AICodeInlineCompletionsProvider
    implements monaco.languages.InlineCompletionsProvider {
    @inject(CodeCompletionAgent)
    protected readonly agent: CodeCompletionAgent;

    async provideInlineCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.InlineCompletionContext,
        token: monaco.CancellationToken
    ): Promise<monaco.languages.InlineCompletions | undefined> {
        return this.agent.provideInlineCompletions(
            model,
            position,
            context,
            token
        );
    }

    disposeInlineCompletions(
        completions: monaco.languages.InlineCompletions<monaco.languages.InlineCompletion>
    ): void {
        // nothing to do
    }
}
