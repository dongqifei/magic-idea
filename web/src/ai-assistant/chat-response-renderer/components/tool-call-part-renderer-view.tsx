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

import * as React from 'react';
import { ToolCallChatResponseContent } from '@MagicIdea/ai-chat/common';
import { ToolConfirmationMode } from '@MagicIdea/ai-chat/common/chat-tool-preferences';
import { ToolConfirmationManager } from '@MagicIdea/ai-chat/chat-tool-preference-bindings';
import { ToolRequest } from '@MagicIdea/ai-core';
import { ContextMenuRenderer, OpenerService } from '@MagicIdea/core';
import { nls } from '@MagicIdea/core/common/nls';
import { codicon } from '@MagicIdea/core';
import { createConfirmationHandlers, ToolConfirmation, useToolConfirmationState } from './tool-confirmation';
import { useMarkdownRendering } from './markdown-part-renderer-view';

// 导出给 TS 文件使用的 Props 类型
export interface ToolCallContentProps {
    response: ToolCallChatResponseContent;
    confirmationMode: ToolConfirmationMode;
    toolConfirmationManager: ToolConfirmationManager;
    toolRequest?: ToolRequest;
    chatId: string;
    getArgumentsLabel: (toolName: string | undefined, args: string | undefined) => string;
    showArgsTooltip: (response: ToolCallChatResponseContent, target: HTMLElement | undefined) => void;
    responseRenderer: (response: ToolCallChatResponseContent) => React.ReactNode | undefined;
    requestCanceled: boolean;
    contextMenuRenderer: ContextMenuRenderer;
}

// 加载动画组件
const Spinner = () => (
    <span className={`${codicon('loading')} theia-animation-spin`}></span>
);

// Markdown 渲染组件
export const MarkdownRender = ({ text, openerService }: { text: string; openerService: OpenerService }) => {
    const ref = useMarkdownRendering(text, openerService);
    return <div ref={ref}></div>;
};

// 工具调用主 UI 组件
export const ToolCallContent: React.FC<ToolCallContentProps> = ({
    response,
    confirmationMode,
    toolConfirmationManager,
    toolRequest,
    chatId,
    responseRenderer,
    getArgumentsLabel,
    requestCanceled,
    showArgsTooltip,
    contextMenuRenderer
}) => {
    const { confirmationState, rejectionReason } = useToolConfirmationState(response, confirmationMode);
    const summaryRef = React.useRef<HTMLElement | undefined>(undefined);
    const pendingRef = React.useRef<HTMLElement | undefined>(undefined);
    const allowedRef = React.useRef<HTMLElement | undefined>(undefined);

    const argsLabel = getArgumentsLabel(response.name, response.arguments);

    const formatReason = (reason: unknown): string => {
        if (!reason) {
            return '';
        }
        if (reason instanceof Error) {
            return reason.message;
        }
        if (typeof reason === 'string') {
            return reason;
        }
        try {
            return JSON.stringify(reason);
        } catch (e) {
            return String(reason);
        }
    };

    const { handleAllow, handleDeny } = React.useMemo(
        () => createConfirmationHandlers(response.name, response, toolConfirmationManager, chatId, toolRequest),
        [response, toolConfirmationManager, chatId, toolRequest]
    );

    const reasonText = formatReason(rejectionReason);

    return (
        <div className='theia-toolCall'>
            {confirmationState === 'rejected' ? (
                <span className='theia-toolCall-rejected'>
                    <span className={codicon('error')}></span> {nls.localize('theia/ai/chat-ui/toolcall-part-renderer/rejected', '执行已取消')}: {response.name}
                    {reasonText ? <span> — {reasonText}</span> : undefined}
                </span>
            ) : requestCanceled && !response.finished ? (
                <span className='theia-toolCall-rejected'>
                    <span className={codicon('error')}></span> {nls.localize('theia/ai/chat-ui/toolcall-part-renderer/rejected', '执行已取消')}: {response.name}
                </span>
            ) : confirmationState === 'denied' ? (
                <span className='theia-toolCall-denied'>
                    <span className={codicon('error')}></span> {nls.localize('theia/ai/chat-ui/toolcall-part-renderer/denied', '执行被拒绝')}: {response.name}
                    {ToolCallChatResponseContent.isDenialResult(response.result) && response.result.reason ? <span> — {response.result.reason}</span> : undefined}
                </span>
            ) : response.finished ? (
                <details className='theia-toolCall-finished'>
                    <summary
                        ref={(el: HTMLElement | null) => { summaryRef.current = el ?? undefined; }}
                        onMouseEnter={() => showArgsTooltip(response, summaryRef.current)}
                    >
                        {nls.localize('theia/ai/chat-ui/toolcall-part-renderer/finished', '运行')} {response.name} 
                        (<span className='theia-toolCall-args-label'>{argsLabel}</span>)
                    </summary>
                    <div className='theia-toolCall-response-result'>
                        {responseRenderer(response)}
                    </div>
                </details>
            ) : confirmationState === 'pending' ? (
                <span className='theia-toolCall-pending'
                    ref={(el: HTMLElement | null) => { pendingRef.current = el ?? undefined; }}
                    onMouseEnter={() => showArgsTooltip(response, pendingRef.current)}
                >
                    <Spinner /> {response.name}
                    (<span className='theia-toolCall-args-label'>{argsLabel}</span>)
                </span>
            ) : (
                confirmationState === 'allowed' && !requestCanceled && (
                    <span className='theia-toolCall-allowed'
                        ref={(el: HTMLElement | null) => { allowedRef.current = el ?? undefined; }}
                        onMouseEnter={() => showArgsTooltip(response, allowedRef.current)}
                    >
                        <Spinner /> {nls.localizeByDefault('Running')} {response.name}
                        (<span className='theia-toolCall-args-label'>{argsLabel}</span>)
                    </span>
                )
            )}

            {confirmationState === 'waiting' && !requestCanceled && !response.finished && (
                <span className='theia-toolCall-waiting'>
                    <ToolConfirmation
                        response={response}
                        toolRequest={toolRequest}
                        onAllow={handleAllow}
                        onDeny={handleDeny}
                        contextMenuRenderer={contextMenuRenderer}
                    />
                </span>
            )}
        </div>
    );
};