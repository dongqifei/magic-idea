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

import { codicon } from '@MagicIdea/core';

export namespace ChatCommands {
    export const CHAT_CATEGORY = 'Chat';
    export const CHAT_CATEGORY_KEY = CHAT_CATEGORY;

    export const SCROLL_LOCK_WIDGET = {
        id: 'chat:widget:lock',
        category: CHAT_CATEGORY,
        iconClass: codicon('unlock'),
        label: 'Lock Scroll'
    };

    export const SCROLL_UNLOCK_WIDGET = {
        id: 'chat:widget:unlock',
        category: CHAT_CATEGORY,
        iconClass: codicon('lock'),
        label: 'Unlock Scroll'
    }

    export const EDIT_SESSION_SETTINGS = {
        id: 'chat:widget:session-settings',
        category: CHAT_CATEGORY,
        iconClass: codicon('bracket'),
        label: 'Set Session Settings'
    }

    export const AI_CHAT_NEW_WITH_TASK_CONTEXT = {
        id: 'ai-chat.new-with-task-context',
    };

    export const AI_CHAT_INITIATE_SESSION_WITH_TASK_CONTEXT = {
        id: 'ai-chat.initiate-session-with-task-context',
        label: 'Task Context: Initiate Session',
        category: CHAT_CATEGORY
    }

    export const AI_CHAT_SUMMARIZE_CURRENT_SESSION = {
        id: 'ai-chat-summary-current-session',
        iconClass: codicon('go-to-editing-session'),
        label: 'Summarize Current Session',
        category: CHAT_CATEGORY
    }

    export const AI_CHAT_OPEN_SUMMARY_FOR_CURRENT_SESSION = {
        id: 'ai-chat-open-current-session-summary',
        iconClass: codicon('note'),
        label: 'Open Current Session Summary',
        category: CHAT_CATEGORY
    }

    export const AI_CHAT_NAVIGATE_BACK = {
        id: 'ai-chat-ui.navigate-back',
        iconClass: codicon('arrow-left'),
        category: ChatCommands.CHAT_CATEGORY,
        label: 'Navigate Back'
    }

    export const AI_CHAT_NAVIGATE_FORWARD = {
        id: 'ai-chat-ui.navigate-forward',
        iconClass: codicon('arrow-right'),
        category: ChatCommands.CHAT_CATEGORY,
        label: 'Navigate Forward'
    }

    export const AI_CHAT_RENAME_SESSION = {
        id: 'ai-chat-ui.rename-session',
        iconClass: codicon('edit'),
        label: 'Rename Chat',
        category: CHAT_CATEGORY
    }

    export const AI_CHAT_DELETE_SESSION = {
        id: 'ai-chat-ui.delete-session',
        iconClass: codicon('remove-close'),
        label: 'Delete Chat',
        category: CHAT_CATEGORY
    }
}

export const AI_CHAT_NEW_CHAT_WINDOW_COMMAND = {
    id: 'ai-chat-ui.new-chat',
    iconClass: codicon('add'),
    category: ChatCommands.CHAT_CATEGORY,
    label: '新建会话'
}

export const AI_CHAT_SHOW_CHATS_COMMAND = {
    id: 'ai-chat-ui.show-chats',
    iconClass: codicon('history'),
    category: ChatCommands.CHAT_CATEGORY,
    label: '历史会话'
}
