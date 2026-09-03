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
import { ChatResponseContent, QuestionResponseContent } from '@MagicIdea/ai-chat/common';
import { OpenerService } from '@MagicIdea/core';
import { inject, injectable } from 'inversify';
import { createElement } from 'react';
import { ChatResponsePartRenderer } from '../chat-response-part-renderer';
import { ResponseNode } from '../chat-view/chat-view-widget';
// 导入UI组件
import { MultiSelectQuestion, SingleSelectQuestion } from './components/question-part-renderer-view';

@injectable()
export class QuestionPartRenderer implements ChatResponsePartRenderer<QuestionResponseContent> {

    @inject(OpenerService) protected readonly openerService: OpenerService;

    canHandle(response: ChatResponseContent): number {
        if (QuestionResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(question: QuestionResponseContent, node: ResponseNode) {
        const props = { question, node, openerService: this.openerService };
        // 使用 createElement 替代 JSX
        return question.multiSelect
            ? createElement(MultiSelectQuestion, props)
            : createElement(SingleSelectQuestion, props);
    }

    renderConfirmation(question: QuestionResponseContent, node: ResponseNode) {
        const props = { question, node, openerService: this.openerService };
        // 使用 createElement 替代 JSX
        return question.multiSelect
            ? createElement(MultiSelectQuestion, props)
            : createElement(SingleSelectQuestion, props);
    }
}