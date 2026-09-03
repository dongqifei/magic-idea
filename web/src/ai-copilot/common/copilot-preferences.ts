// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
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

import { PreferenceSchema } from '@MagicIdea/core/preferences';

export const AI_CORE_PREFERENCES_TITLE = 'AI 功能';
export const COPILOT_ENABLED_PREF = 'ai-assistant.copilot.enabled';
export const COPILOT_MODEL_OVERRIDES_PREF = 'ai-assistant.copilot.modelOverrides';
export const COPILOT_ENTERPRISE_URL_PREF = 'ai-assistant.copilot.enterpriseUrl';

export const CopilotPreferencesSchema: PreferenceSchema = {
    title: AI_CORE_PREFERENCES_TITLE,
    properties: {
        [COPILOT_ENABLED_PREF]: {
            type: 'boolean',
            title: '启用 Copilot',
            description: '启用 GitHub Copilot 提供程序。启用后,状态栏中将显示一个条目用于身份验证,并从您的 Copilot 订阅中检索可用模型。',
            default: true
        },
        [COPILOT_MODEL_OVERRIDES_PREF]: {
            type: 'array',
            title: 'Copilot模型覆盖',
            description: '覆盖自动发现的 GitHub Copilot 模型。当为空(默认)时,系统将从您的 Copilot 订阅中发现可用模型。设置明确的模型 ID 以覆盖自动发现功能。',
            default: [],
            items: {
                type: 'string'
            }
        },
        [COPILOT_ENTERPRISE_URL_PREF]: {
            type: 'string',
            title: 'Copilot企业版URL',
            description: 'Copilot API 的 GitHub Enterprise 域名(例如 github.mycompany.com)。若使用 GitHub.com 则留空。',
            default: ''
        }
    }
};
