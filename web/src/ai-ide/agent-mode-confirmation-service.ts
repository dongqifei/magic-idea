// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
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
    MarkdownChatResponseContentImpl,
    MutableChatRequestModel,
    QuestionResponseContentImpl
} from '@MagicIdea/ai-chat/common';
import { inject, injectable } from 'inversify';
import { nls, PreferenceService } from '@MagicIdea/core';
import { Deferred } from '@MagicIdea/core/common/promise-util';
import { PREFERENCE_NAME_AGENT_MODE_ENABLED } from './common/ai-ide-preferences';

export const AgentModeConfirmationService = Symbol('AgentModeConfirmationService');
export interface AgentModeConfirmationService {
    isAcknowledged(): boolean;
    requestConfirmation(request: MutableChatRequestModel): Promise<boolean>;
}

@injectable()
export class AgentModeConfirmationServiceImpl implements AgentModeConfirmationService {

    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

    isAcknowledged(): boolean {
        return !!this.preferenceService.get<boolean>(PREFERENCE_NAME_AGENT_MODE_ENABLED, false);
    }

    async requestConfirmation(request: MutableChatRequestModel): Promise<boolean> {
        const deferred = new Deferred<boolean>();

        const agentModeLabel = nls.localize('theia/ai/ide/agentModeConfirmation/continueAgentMode', '继续使用代理模式');
        const editModeLabel = nls.localize('theia/ai/ide/agentModeConfirmation/continueEditMode', '继续进入编辑模式');

        request.response.response.addContent(new MarkdownChatResponseContentImpl(
            nls.localize('theia/ai/ide/agentModeConfirmation/msg',
                '该代理采用**代理模式**。为实现自主流程,它能够直接写入您的工作区文件,无需进一步确认。\n\n建议使用版本控制(例如 Git),以便您审查和回滚更改。\n\n您可以通过下方聊天输入区域中的模式选择器切换至**编辑模式**,或使用**Architect**代理进行只读规划。\n\n此确认设置将保存至当前工作区,且不会再次显示。')
        ));

        request.response.response.addContent(new QuestionResponseContentImpl(
            nls.localize('theia/ai/ide/agentModeConfirmation/info',
                '继续使用代理模式将保存您的确认。您稍后可通过 `ai-assistant.ide.agentMode.enabled` 设置撤销此设置。\n\n继续使用编辑模式将把默认模式更改为编辑模式。\n\n您可以随时通过模式选择器或在 AI 配置中切换模式。'),
            [{ text: agentModeLabel }, { text: editModeLabel }],
            request,
            async selectedOption => {
                if (selectedOption.text === agentModeLabel) {
                    await this.preferenceService.set(PREFERENCE_NAME_AGENT_MODE_ENABLED, true);
                    request.response.stopWaitingForInput();
                    deferred.resolve(true);
                } else {
                    request.response.stopWaitingForInput();
                    deferred.resolve(false);
                }
            }
        ));

        const progressMessage = request.response.addProgressMessage({
            content: nls.localize('theia/ai/ide/agentModeConfirmation/waiting', '正在等待确认...'),
            show: 'whileIncomplete'
        });
        request.response.waitForInput();

        return deferred.promise.then(result => {
            request.response.updateProgressMessage({ ...progressMessage, show: 'untilFirstContent', status: 'completed' });
            request.response.response.clearContent();
            return result;
        });
    }
}
