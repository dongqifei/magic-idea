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

import { ChatResponsePartRenderer } from '../chat-response-part-renderer';
import { inject, injectable } from 'inversify';
import { ChatResponseContent, ToolCallChatResponseContent } from '@MagicIdea/ai-chat/common';
import { ReactNode } from 'react';
import { ContextMenuRenderer, HoverService, OpenerService } from '@MagicIdea/core';
import { createElement } from 'react';
import { ToolConfirmationMode } from '@MagicIdea/ai-chat/common/chat-tool-preferences';
import { ResponseNode } from '../chat-view/chat-view-widget';
import { isToolCallContent, ToolCallResult, ToolInvocationRegistry, ToolRequest } from '@MagicIdea/ai-core';
import { ToolConfirmationManager } from '@MagicIdea/ai-chat/chat-tool-preference-bindings';
import { condenseArguments, formatArgsForTooltip } from './toolcall-utils';
// 导入拆分后的 TSX 组件与类型
import { MarkdownRender, ToolCallContent, ToolCallContentProps } from './components/tool-call-part-renderer-view';

@injectable()
export class ToolCallPartRenderer implements ChatResponsePartRenderer<ToolCallChatResponseContent> {

    @inject(ToolConfirmationManager)
    protected toolConfirmationManager: ToolConfirmationManager;

    @inject(OpenerService)
    protected openerService: OpenerService;

    @inject(ToolInvocationRegistry)
    protected toolInvocationRegistry: ToolInvocationRegistry;

    @inject(HoverService)
    protected hoverService: HoverService;

    @inject(ContextMenuRenderer)
    protected contextMenuRenderer: ContextMenuRenderer;

    canHandle(response: ChatResponseContent): number {
        if (ToolCallChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    renderConfirmation(response: ToolCallChatResponseContent, parentNode: ResponseNode): ReactNode {
        // 该方法逻辑已移入 TSX 组件，此处保留接口兼容
        return undefined;
    }

    render(response: ToolCallChatResponseContent, parentNode: ResponseNode): ReactNode {
        const chatId = parentNode.sessionId;
        const toolRequest = response.name ? this.toolInvocationRegistry.getFunction(response.name) : undefined;
        const confirmationMode = response.name ? this.getToolConfirmationSettings(response.name, chatId, toolRequest) : ToolConfirmationMode.DISABLED;

        // 使用 createElement 渲染 TSX 组件（核心要求）
        return createElement(ToolCallContent, {
            response,
            confirmationMode,
            toolConfirmationManager: this.toolConfirmationManager,
            toolRequest,
            chatId,
            getArgumentsLabel: this.getArgumentsLabel.bind(this),
            showArgsTooltip: this.showArgsTooltip.bind(this),
            responseRenderer: this.renderResult.bind(this),
            requestCanceled: parentNode.response.isCanceled,
            contextMenuRenderer: this.contextMenuRenderer
        } as ToolCallContentProps);
    }

    protected renderResult(response: ToolCallChatResponseContent): ReactNode | undefined {
        const result = this.tryParse(response.result);
        if (!result) {
            return undefined;
        }
        // eslint-disable-next-line no-null/no-null
        if (typeof result !== 'object' || result === null) {
            return createElement('pre', null, String(result));
        }
        if (isToolCallContent(result)) {
            const contentElements = (result.content as any[]).map((content, idx) => {
                switch (content.type) {
                    case 'image': {
                        return createElement('div', {
                            key: `content-${idx}-${content.type}`,
                            className: 'theia-toolCall-image-result'
                        },
                            createElement('img', {
                                src: `data:${content.mimeType};base64,${content.base64data}`
                            })
                        );
                    }
                    case 'text': {
                        return createElement('div', {
                            key: `content-${idx}-${content.type}`,
                            className: 'theia-toolCall-text-result'
                        },
                            createElement(MarkdownRender, {
                                text: content.text,
                                openerService: this.openerService
                            })
                        );
                    }
                    case 'audio':
                    case 'error':
                    default: {
                        return createElement('div', {
                            key: `content-${idx}-${content.type}`,
                            className: 'theia-toolCall-default-result'
                        },
                            createElement('pre', null, JSON.stringify(response, undefined, 2))
                        );
                    }
                }
            });

            return createElement('div', {
                className: 'theia-toolCall-response-content'
            }, contentElements);
        }
        return createElement('pre', null, JSON.stringify(result, undefined, 2));
    }

    private tryParse(result: ToolCallResult): ToolCallResult {
        if (!result) {
            return undefined;
        }
        try {
            return typeof result === 'string' ? JSON.parse(result) : result;
        } catch (error) {
            return result;
        }
    }

    protected getToolConfirmationSettings(responseId: string, chatId: string, toolRequest?: ToolRequest): ToolConfirmationMode {
        return this.toolConfirmationManager.getConfirmationMode(responseId, chatId, toolRequest);
    }

    protected getArgumentsLabel(toolName: string | undefined, args: string | undefined): string {
        if (!args || !args.trim() || args.trim() === '{}') {
            return '';
        }
        try {
            const toolRequest = toolName ? this.toolInvocationRegistry.getFunction(toolName) : undefined;
            if (toolRequest?.getArgumentsShortLabel) {
                const result = toolRequest.getArgumentsShortLabel(args);
                if (result) {
                    // ==========打印查看真实label内容==========
                    return result.hasMore ? `${result.label} …` : result.label;
                }
            }
        } catch {
            // tool not found in registry, fall through to generic condensed rendering
        }
        const condensed = condenseArguments(args);
        return condensed?.replace(/^undefined\s*/, '') ?? '…';
    }

    protected showArgsTooltip(response: ToolCallChatResponseContent, target: HTMLElement | undefined): void {
        const _arguments = response.arguments?.replace(/^undefined\s*/, '');
        if (!target || !_arguments || !_arguments.trim() || _arguments.trim() === '{}') {
            return;
        }
        const markdownString = formatArgsForTooltip(_arguments);
        this.hoverService.requestHover({
            content: markdownString,
            target,
            position: 'right',
            interactive: true,
            cssClasses: ['toolcall-args-hover']
        });
    }
}