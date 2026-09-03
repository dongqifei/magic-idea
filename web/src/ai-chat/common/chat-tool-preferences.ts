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

import { AI_CORE_PREFERENCES_TITLE } from '@MagicIdea/ai-core/common/ai-core-preferences';
import { nls } from '@MagicIdea/core';
import {
    PreferenceContribution,
    PreferenceSchema,
    PreferenceService,
} from '@MagicIdea/core/preferences';
import { interfaces } from 'inversify';

// export type ChatToolPreferences = PreferenceProxy<ChatToolConfiguration>;

export const ChatToolPreferenceContribution = Symbol('ChatToolPreferenceContribution');
export const ChatToolPreferences = Symbol('ChatToolPreferences');

// export function createChatToolPreferences(preferences: PreferenceService, schema: PreferenceSchema = chatToolPreferences): ChatToolPreferences {
//     return createPreferenceProxy(preferences, schema);
// }

export function bindChatToolPreferences(bind: interfaces.Bind): void {
    // bind(ChatToolPreferences).toDynamicValue((ctx: interfaces.Context) => {
    //     const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    //     const contribution = ctx.container.get<PreferenceContribution>(ChatToolPreferenceContribution);
    //     return createChatToolPreferences(preferences, contribution.schema);
    // }).inSingletonScope();
    bind(ChatToolPreferenceContribution).toConstantValue({ schema: chatToolPreferences });
    bind(PreferenceContribution).toService(ChatToolPreferenceContribution);
}

/**
 * Enum for tool confirmation modes
 */
export enum ToolConfirmationMode {
    ALWAYS_ALLOW = 'always_allow',
    CONFIRM = 'confirm',
    DISABLED = 'disabled'
}

export const TOOL_CONFIRMATION_PREFERENCE = 'ai-assistant.chat.toolConfirmation';
export const TOOL_CONFIRMATION_TIMEOUT_PREFERENCE = 'ai-assistant.chat.toolConfirmationTimeout';

export const chatToolPreferences: PreferenceSchema = {
    title: 'Chat Tools',
    properties: {
        [TOOL_CONFIRMATION_PREFERENCE]: {
            type: 'object',
            additionalProperties: {
                type: 'string',
                enum: [ToolConfirmationMode.ALWAYS_ALLOW, ToolConfirmationMode.CONFIRM, ToolConfirmationMode.DISABLED],
            },
            default: {},
            description: nls.localize('theia/ai/chat/toolConfirmation/description',
                '为不同的工具配置确认行为。键是工具ID，值是确认模式。使用“*”作为键可为所有工具设置全局默认值。'),
            title: "工具确认",
        },
        [TOOL_CONFIRMATION_TIMEOUT_PREFERENCE]: {
            type: 'number',
            default: 0,
            minimum: 0,
            description: nls.localize('theia/ai/chat/toolConfirmationTimeout/description',
                '工具确认对话框的超时秒数。当设置为正值时，工具确认将在指定时长后自动被拒绝。设置为0则禁用（默认设置）。'),
            title: '工具确认超时',
        }
    }
};

export interface ChatToolConfiguration {
    [TOOL_CONFIRMATION_PREFERENCE]: { [toolId: string]: ToolConfirmationMode };
    [TOOL_CONFIRMATION_TIMEOUT_PREFERENCE]: number;
}
