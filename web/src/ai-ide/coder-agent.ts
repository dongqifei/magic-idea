// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************
import {
    ChatMode, ChatRequestModel, ChatService, ChatSession,
    MutableChatModel, MutableChatRequestModel
} from '@MagicIdea/ai-chat/common';
import { inject, injectable } from 'inversify';
import {
    CODER_SYSTEM_PROMPT_ID,
    CODER_EDIT_TEMPLATE_ID,
    CODER_AGENT_MODE_TEMPLATE_ID,
    CODER_AGENT_MODE_NEXT_TEMPLATE_ID,
    getCoderAgentModePromptTemplate,
    getCoderAgentModeNextPromptTemplate,
    getCoderPromptTemplateEdit,
    getCoderPromptTemplateEditNext
} from './common/coder-replace-prompt-template';
import { LanguageModelRequirement, PromptVariantSet } from '@MagicIdea/ai-core';
import { nls } from '@MagicIdea/core';
import { MarkdownStringImpl } from '@MagicIdea/core/common/markdown-rendering';
import { AI_CHAT_NEW_CHAT_WINDOW_COMMAND, ChatCommands } from '@MagicIdea/ai-assistant/chat-view-commands';
import { AbstractModeAwareChatAgent } from './mode-aware-chat-agent';
import { AgentModeConfirmationService } from './agent-mode-confirmation-service';

export const CoderAgentId = 'Coder';

@injectable()
export class CoderAgent extends AbstractModeAwareChatAgent {
    @inject(ChatService) protected readonly chatService: ChatService;
    @inject(AgentModeConfirmationService) protected readonly agentModeConfirmation: AgentModeConfirmationService;
    id: string = CoderAgentId;
    name = "编码助手";
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
        // identifier: '@cf/qwen/qwen3-30b-a3b-fp8',
        // identifier: 'copilot/gpt-4o-mini'
    }];
    protected defaultLanguageModelPurpose: string = 'chat';
    override iconClass: string = 'codicon codicon-code';

    override description = nls.localize('theia/ai/workspace/coderAgent/description',
        '该助手可以访问用户的工作区，获取所有可用文件和文件夹的列表，并检索其内容。此外，它还可以向用户建议文件修改。因此，它可以帮助用户完成编码任务或其他涉及文件更改的任务。');

    protected readonly modeDefinitions: Omit<ChatMode, 'isDefault'>[] = [
        {
            id: CODER_EDIT_TEMPLATE_ID,
            name: nls.localize('theia/ai/ide/coderAgent/mode/edit', '编辑模式')
        },
        {
            id: CODER_AGENT_MODE_TEMPLATE_ID,
            name: nls.localizeByDefault('代理模式')
        },
        {
            id: CODER_AGENT_MODE_NEXT_TEMPLATE_ID,
            name: nls.localize('theia/ai/ide/coderAgent/mode/agentNext', '代理模式 (Next)')
        },
    ];

    override prompts: PromptVariantSet[] = [{
        id: CODER_SYSTEM_PROMPT_ID,
        defaultVariant: getCoderAgentModePromptTemplate(),
        variants: [getCoderPromptTemplateEdit(), getCoderAgentModeNextPromptTemplate(), getCoderPromptTemplateEditNext()]
    }];
    protected override systemPromptId: string | undefined = CODER_SYSTEM_PROMPT_ID;

    private useSettingsDefaultMode = false;

    override async invoke(request: MutableChatRequestModel): Promise<void> {
        if (this.isAgentModeRequest(request) && !this.agentModeConfirmation.isAcknowledged()) {
            const confirmed = await this.agentModeConfirmation.requestConfirmation(request);
            if (!confirmed) {
                await this.switchToEditMode();
                // Continue the same request using Edit Mode's prompt by ignoring
                // the request's original agent mode modeId for variant resolution.
                this.useSettingsDefaultMode = true;
                try {
                    await super.invoke(request);
                    this.suggest(request);
                } finally {
                    this.useSettingsDefaultMode = false;
                }
                return;
            }
        }
        await super.invoke(request);
        this.suggest(request);
    }

    protected override getEffectiveVariantIdWithMode(modeId?: string): string | undefined {
        if (this.useSettingsDefaultMode) {
            return super.getEffectiveVariantIdWithMode(undefined);
        }
        return super.getEffectiveVariantIdWithMode(modeId);
    }

    protected async switchToEditMode(): Promise<void> {
        if (this.systemPromptId) {
            await this.promptService.updateSelectedVariantId(this.id, this.systemPromptId, CODER_EDIT_TEMPLATE_ID);
        }
    }

    protected isAgentModeRequest(request: MutableChatRequestModel): boolean {
        const modeId = request.request.modeId;
        if (modeId) {
            return modeId === CODER_AGENT_MODE_TEMPLATE_ID || modeId === CODER_AGENT_MODE_NEXT_TEMPLATE_ID;
        }
        const effectiveVariantId = this.getEffectiveVariantIdWithMode(undefined);
        return effectiveVariantId === CODER_AGENT_MODE_TEMPLATE_ID || effectiveVariantId === CODER_AGENT_MODE_NEXT_TEMPLATE_ID;
    }

    async suggest(context: ChatSession | ChatRequestModel): Promise<void> {
        const contextIsRequest = ChatRequestModel.is(context);
        const model = contextIsRequest ? context.session : context.model;
        const session = contextIsRequest ? this.chatService.getSessions().find(candidate => candidate.model.id === model.id) : context;
        if (!(model instanceof MutableChatModel) || !session) { return; }
        if (model.isEmpty()) {
            model.setSuggestions([
                {
                    kind: 'callback',
                    callback: () => this.chatService.sendRequest(session.id, {
                        text: `@Coder ${nls.localize('theia/ai/ide/coderAgent/suggestion/fixProblems/prompt', 'please look at {1} and fix any problems.', '#_f')}`
                    }),
                    content: nls.localize('theia/ai/ide/coderAgent/suggestion/fixProblems/content', '[Fix problems]({0}) in the current file.', '_callback')
                },
            ]);
        } else {
            model.setSuggestions([new MarkdownStringImpl(nls.localize('theia/ai/ide/coderAgent/suggestion/startNewChat',
                'Keep chats short and focused. [Start a new chat]({0}) for a new task or [start a new chat with a summary of this one]({1}).',
                `command:${AI_CHAT_NEW_CHAT_WINDOW_COMMAND.id}`, `command:${ChatCommands.AI_CHAT_NEW_WITH_TASK_CONTEXT.id}`))]);
        }
    }

}
