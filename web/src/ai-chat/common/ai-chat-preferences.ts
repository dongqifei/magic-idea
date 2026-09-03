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

import { AI_CORE_PREFERENCES_TITLE } from '@MagicIdea/ai-core/common/ai-core-preferences';
import { nls } from '@MagicIdea/core/common';
import { PreferenceSchema } from '@MagicIdea/core/preferences';

export const DEFAULT_CHAT_AGENT_PREF = 'ai-assistant.chat.defaultChatAgent';
export const PIN_CHAT_AGENT_PREF = 'ai-assistant.chat.pinChatAgent';
export const BYPASS_MODEL_REQUIREMENT_PREF = 'ai-assistant.chat.bypassModelRequirement';
export const PERSISTED_SESSION_LIMIT_PREF = 'ai-assistant.chat.persistedSessionLimit';
export const SESSION_STORAGE_PREF = 'ai-assistant.chat.sessionStorageScope';
export const WELCOME_SCREEN_SESSIONS_PREF = 'ai-assistant.chat.welcomeScreenSessions';
export const CHAT_PET_VISIBILITY = 'ai-assistant.pet.visibility';

export type SessionStorageScope = 'workspace' | 'global';

export const aiChatPreferences: PreferenceSchema = {
    title: AI_CORE_PREFERENCES_TITLE,
    properties: {
        // [CHAT_PET_VISIBILITY]: {
        //     type: 'boolean',
        //     title: '聊天宠物可见性',
        //     default: false,
        //     description: '控制聊天宠物助手在编辑器区域是否可见。'
        // },
        [DEFAULT_CHAT_AGENT_PREF]: {
            type: 'string',
            description: nls.localize('theia/ai/chat/defaultAgent/description',
                '当用户查询中未通过@<代理名称>显式指定代理时,将调用的聊天代理<代理名称>。若未配置默认代理,则应用IDEA的默认设置。'),
            title: "默认聊天代理",
            default: 'Ask'
        },
        [PIN_CHAT_AGENT_PREF]: {
            type: 'boolean',
            description: nls.localize('theia/ai/chat/pinChatAgent/description',
                '启用代理固定功能,可在不同提示中自动保持指定聊天代理处于活动状态,减少重复提及的需要。您可随时手动取消固定或切换代理。'),
            default: true,
            title: "固定聊天代理",
        },
        // [BYPASS_MODEL_REQUIREMENT_PREF]: {
        //     type: 'boolean',
        //     description: nls.localize('theia/ai/chat/bypassModelRequirement/description',
        //         '如果您使用的是不需要 IDEA 语言模型的外部代理（例如Claude Code），请启用此选项。'),
        //     default: false,
        //     title: "跳过语言模型要求检查",
        // },
        [PERSISTED_SESSION_LIMIT_PREF]: {
            type: 'number',
            description: nls.localize('theia/ai/chat/persistedSessionLimit/description',
                '可保留的聊天会话的最大数量。使用-1表示无限制会话，使用0表示禁用会话保留功能。当限制减少时，超出新限制的最旧会话将在下次保存时自动删除。'),
            default: 25,
            minimum: -1,
            title: "持久会话限制",
        },
        // [WELCOME_SCREEN_SESSIONS_PREF]: {
        //     type: 'number',
        //     description: nls.localize('theia/ai/chat/welcomeScreenSessions/description',
        //         '欢迎屏幕上显示的最近聊天会话行数。可见会话的数量取决于可用宽度。设置为0可隐藏最近聊天部分。'),
        //     default: 3,
        //     minimum: 0,
        //     maximum: 6,
        //     title: "欢迎屏幕会话",
        // },
        [SESSION_STORAGE_PREF]: {
            type: 'string',
            enum: ['workspace', 'global'] satisfies SessionStorageScope[],
            default: 'global' as SessionStorageScope,
            description: nls.localize('theia/ai/chat/sessionStorageScope/description',
                '选择是将聊天会话保存在单独的每个工作区存储中，还是保存在一个单一的全局存储中。如果没有打开任何工作区，会话将回退到全局存储。'),
            title: "会话存储范围",
        }
    }
};
