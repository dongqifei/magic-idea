/**
 * @license
 */
import { injectable, inject } from "inversify";

import * as monaco from "monaco-editor";

import { DisposableCollection, generateUuid } from '@MagicIdea/core/common';
import { NotificationService } from "@MagicIdea/core/notification/notification-service";
import { PreferenceService } from "@MagicIdea/core/preferences/preference-service";
import { getLogger } from '@MagicIdea/core/logger';

import { Agent, AgentSpecificVariables, LanguageModelService, getTextOfResponse, LanguageModelRegistry, LanguageModelRequirement, PromptService, PromptVariantSet, UserRequest } from "@MagicIdea/ai-core/common";

import { codeCompletionPrompts } from './code-completion-prompt-template';
import { CodeCompletionPostProcessor } from "./code-completion-postprocessor";
import { CodeCompletionVariableContext } from './code-completion-variable-context';
import { FILE, LANGUAGE, PREFIX, SUFFIX } from './code-completion-variables';

export const CodeCompletionAgent = Symbol("CodeCompletionAgent");
export interface CodeCompletionAgent extends Agent {
  provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.InlineCompletions | undefined>;
}

@injectable()
export class CodeCompletionAgentImpl implements CodeCompletionAgent {

  id = 'code-completion';
  name: string = "代码补全代理";
  description = '此代理在MagicIDEA的代码编辑器中提供内联代码补全功能。';
  prompts: PromptVariantSet[] = codeCompletionPrompts;
  languageModelRequirements: LanguageModelRequirement[] = [
    {
      purpose: 'code-completion',
      identifier: 'default/code-completion',
    },
  ];
  readonly variables: string[] = [];
  readonly functions: string[] = [];
  readonly agentSpecificVariables: AgentSpecificVariables[] = [
      { name: FILE.id, description: '正在编辑的文件的URI', usedInPrompt: true },
      { name: PREFIX.id, description: '当前光标位置之前的代码', usedInPrompt: true },
      { name: SUFFIX.id, description: '当前光标位置后的代码', usedInPrompt: true },
      { name: LANGUAGE.id, description: '正在编辑的文件的语言标识符', usedInPrompt: true }
  ];

  private readonly disposables = new DisposableCollection();

  private logger = getLogger('CodeCompletionAgentImpl');

  @inject(LanguageModelRegistry)
  protected languageModelRegistry: LanguageModelRegistry;

  @inject(NotificationService)
  protected notificationService: NotificationService;

  @inject(PreferenceService)
  protected preferences: PreferenceService;

  @inject(CodeCompletionPostProcessor)
  protected postProcessor: CodeCompletionPostProcessor;

  @inject(LanguageModelService)
  protected languageModelService: LanguageModelService;

  @inject(PromptService)
  protected promptService: PromptService;

  async provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.InlineCompletions | undefined> {
    const abortController = new AbortController();
    const progress = await this.notificationService.showProgress(
      { 
        message: '正在生成代码建议...',
        source: 'AI Assistant'
      },
      ()=>{
        abortController.abort();
      }
    );

    // 监听编辑器取消请求
    this.disposables.push(
      token.onCancellationRequested(()=>{
        abortController.abort();
      })
    )

    try { 
      const languageModel =
        await this.languageModelRegistry.selectLanguageModel({
            agent: this.id,
            ...this.languageModelRequirements[0],
        });
      if (!languageModel) {
        this.logger.error(
            'No language model found for code-completion-agent'
        );
        return undefined;
      }

      const variableContext: CodeCompletionVariableContext = {
        model,
        position,
        context
      };

      if (token.isCancellationRequested) {
          return undefined;
      }

      const prompt = await this.promptService
          .getResolvedPromptFragment('code-completion-system-next', undefined, variableContext)
          .then(p => p?.text);
      if (!prompt) {
          this.logger.error('No prompt found for code-completion-agent');
          return undefined;
      }

      const variantInfo = this.promptService.getPromptVariantInfo('code-completion-system-next');

      // since we do not actually hold complete conversions, the request/response pair is considered a session
      const sessionId = generateUuid();
      const requestId = generateUuid();
      const request: UserRequest = {
          messages: [{ type: 'text', actor: 'user', text: prompt }],
          settings: {
              stream: false
          },
          agentId: this.id,
          sessionId,
          requestId,
          cancellationToken: token,
          promptVariantId: variantInfo?.variantId,
          isPromptVariantCustomized: variantInfo?.isCustomized
      };
      if (token.isCancellationRequested) {
          return undefined;
      }
      const response = await this.languageModelService.sendRequest(languageModel, request);
      if (token.isCancellationRequested) {
          return undefined;
      }
      const completionText = await getTextOfResponse(response);
      if (token.isCancellationRequested) {
          return undefined;
      }

      const postProcessedCompletionText = this.postProcessor.postProcess(completionText);

      return {
          items: [{
              insertText: postProcessedCompletionText,
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
          }],
          enableForwardStability: true
      };
    } catch (e: any) {
        if (!token.isCancellationRequested) {
            console.error(e.message, e);
        }
    } finally {
        progress.cancel();
        this.disposables.dispose();
    } 
    return undefined;
  }
}