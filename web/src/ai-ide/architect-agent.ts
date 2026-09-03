// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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
import { TaskContextStorageService } from '@MagicIdea/ai-chat/task-context-service';
import { LanguageModelRequirement } from '@MagicIdea/ai-core';
import { inject, injectable } from 'inversify';
import { architectSystemVariants, ARCHITECT_PLANNING_PROMPT_ID, ARCHITECT_SIMPLE_PROMPT_ID, ARCHITECT_PLANNING_NEXT_PROMPT_ID } from './architect-prompt-template';
import { nls } from '@MagicIdea/core';
import { MarkdownStringImpl } from '@MagicIdea/core/common/markdown-rendering';
import { AI_EXECUTE_PLAN_WITH_CODER } from './common/summarize-session-commands';
import { AbstractModeAwareChatAgent } from './mode-aware-chat-agent';

export const ArchitectAgentId = 'Architect';

@injectable()
export class ArchitectAgent extends AbstractModeAwareChatAgent {
    @inject(ChatService) protected readonly chatService: ChatService;
    @inject(TaskContextStorageService) protected readonly taskContextStorageService: TaskContextStorageService;

    name = "系统架构师";
    id = ArchitectAgentId;
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';
    override iconClass: string = 'codicon codicon-map';

    override description = nls.localize('theia/ai/workspace/workspaceAgent/description',
        '该助手可以访问用户的工作区，获取所有可用文件和文件夹的列表，并检索其内容。它不能修改文件。因此，它可以回答有关当前项目、项目文件和工作区中的源代码的问题，如如何构建项目、将源代码放在何处、在哪里找到特定代码或配置等。');

    protected readonly modeDefinitions: Omit<ChatMode, 'isDefault'>[] = [
        {
            id: ARCHITECT_PLANNING_PROMPT_ID,
            name: nls.localize('theia/ai/ide/architectAgent/mode/plan', '计划模式')
        },
        {
            id: ARCHITECT_SIMPLE_PROMPT_ID,
            name: nls.localize('theia/ai/ide/architectAgent/mode/simple', '简单模式')
        },
        {
            id: ARCHITECT_PLANNING_NEXT_PROMPT_ID,
            name: nls.localize('theia/ai/ide/architectAgent/mode/planNext', '计划模式 (Next)')
        },
    ];

    override prompts = [architectSystemVariants];
    protected override systemPromptId: string | undefined = architectSystemVariants.id;

    override async invoke(request: MutableChatRequestModel): Promise<void> {
        await super.invoke(request);
        this.suggest(request);
    }

    async suggest(context: ChatSession | ChatRequestModel): Promise<void> {
        const model = ChatRequestModel.is(context) ? context.session : context.model;
        const session = this.chatService.getSessions().find(candidate => candidate.model.id === model.id);
        if (!(model instanceof MutableChatModel) || !session) { return; }
        if (!model.isEmpty()) {
            const taskContexts = this.taskContextStorageService.getAll().filter(s => s.sessionId === session.id);
            if (taskContexts.length > 0) {
                const suggestions = taskContexts.map(tc =>
                    new MarkdownStringImpl(`[${nls.localize('theia/ai/ide/architectAgent/suggestion/executePlanWithCoder',
                        'Execute "{0}" with Coder', tc.label)}](command:${AI_EXECUTE_PLAN_WITH_CODER.id}?${encodeURIComponent(JSON.stringify(tc.id))}).`)
                );
                model.setSuggestions(suggestions);
            }
        }
    }
}
