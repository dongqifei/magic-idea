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

import { PreferenceSchema } from '@MagicIdea/core/preferences';
import {
    NOTIFICATION_TYPES
} from './notification-types';

export const AGENT_SETTINGS_PREF = 'ai-assistant.agentSettings';

export const AgentSettingsPreferenceSchema: PreferenceSchema = {
    title: '智能体配置',
    properties: {
        [AGENT_SETTINGS_PREF]: {
            type: 'object',
            title: '代理设置',
            description: '配置代理设置（可在[智能助手 > 智能体配置]视图中配置AI代理设置）,例如启用或禁用特定代理、配置提示信息以及选择大型语言模型(LLMs)。',
            additionalProperties: {
                type: 'object',
                properties: {
                    enable: {
                        type: 'boolean',
                        title: '启用代理',
                        default: true
                    },
                    showInChat: {
                        type: 'boolean',
                        title: '在聊天中显示',
                        default: true
                    },
                    languageModelRequirements: {
                        type: 'array',
                        title: '语言模型要求',
                        description: '指定此代理使用的语言模型。',
                        items: {
                            type: 'object',
                            properties: {
                                purpose: {
                                    type: 'string',
                                    title: '目的',
                                    description: '此语言模型的使用目的。'
                                },
                                identifier: {
                                    type: 'string',
                                    title: '标识符',
                                    description: '待使用的语言模型标识符。'
                                }
                            },
                            required: ['purpose', 'identifier']
                        }
                    },
                    selectedVariants: {
                        type: 'object',
                        title: '选定变量',
                        description: '指定当前为该代理选中的提示符变量。',
                        additionalProperties: {
                            type: 'string'
                        }
                    },
                    // completionNotification: {
                    //     type: 'string',
                    //     enum: [...NOTIFICATION_TYPES],
                    //     title: 'Completion Notification',
                    //     description: 'Notification behavior when this agent completes a task. If not set, the global default notification setting will be used.',
                    // },
                    capabilityOverrides: {
                        type: 'object',
                        title: '功能覆盖',
                        description: '针对基于模板的功能的用户自定义设置。键为功能片段 ID,值为启用(true)或禁用(false)。',
                        additionalProperties: {
                            type: 'boolean'
                        }
                    },
                    genericCapabilitySelections: {
                        type: 'object',
                        title: '通用功能选项',
                        description: '用户对通用功能(如技能、功能和 MCP 工具)的选择。',
                        properties: {
                            // skills: {
                            //     type: 'array',
                            //     items: { type: 'string' },
                            //     description: '选定的技能 ID'
                            // },
                            mcpFunctions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '选定的 MCP 功能 ID'
                            },
                            // functions: {
                            //     type: 'array',
                            //     items: { type: 'string' },
                            //     description: '选定的函数 ID'
                            // },
                            // promptFragments: {
                            //     type: 'array',
                            //     items: { type: 'string' },
                            //     description: '选定的提示片段 ID'
                            // },
                            // agentDelegation: {
                            //     type: 'array',
                            //     items: { type: 'string' },
                            //     description: '用于委托的选定代理 ID'
                            // },
                            // variables: {
                            //     type: 'array',
                            //     items: { type: 'string' },
                            //     description: '选定的变量名称'
                            // }
                        }
                    }
                },
                required: ['languageModelRequirements']
            }
        }
    }
};
