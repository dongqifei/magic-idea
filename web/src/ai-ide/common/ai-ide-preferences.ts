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

import { nls, PreferenceSchema } from '@MagicIdea/core';

// We reuse the context key for the preference name
export const PREFERENCE_NAME_ENABLE_AI = 'ai-assistant.ide.AiEnable.enableAI';
export const PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST = 'ai-assistant.ide.orchestrator.excludedAgents';
export const PREFERENCE_NAME_AGENT_MODE_ENABLED = 'ai-assistant.ide.agentMode.enabled';
export const aiIdePreferenceSchema: PreferenceSchema = {
    title: '智能体',
    properties: {
        [PREFERENCE_NAME_ENABLE_AI]: {
            title: "启用",
            type: 'boolean',
            description: '启用人工智能功能，需特别注意:这些功能可能持续向您授权访问的语言模型(LLMs)发起请求,由此产生的费用需密切监控。启用此选项即表示您已知晓上述风险。启用功能后,您需在下方至少配置一个LLM提供商。',
            default: true,
        },
        // [PREFERENCE_NAME_ORCHESTRATOR_EXCLUSION_LIST]: {
        //     title: '被排除的代理',
        //     description: '编排器禁止委派任务的代理ID列表。在选择代理处理请求时,这些代理将不会显示在编排器的选择界面中。',
        //     type: 'array',
        //     items: {
        //         type: 'string'
        //     },
        //     default: ['ClaudeCode', 'Codex'],
        // },
        [PREFERENCE_NAME_AGENT_MODE_ENABLED]: {
            title: '启用代理模式',
            description: nls.localize('theia/ai/ide/agentMode/enabled/mdDescription',
                '为Coder代理启用代理模式。代理模式允许自动进行文件修改，无需进一步确认。在使用代理模式时，会显示首次使用确认对话框，直到将其设置为“true”。'),
            type: 'boolean',
            default: false,
        }
    }
};
