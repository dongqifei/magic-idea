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

import { PreferenceSchema } from '@MagicIdea/core/preferences';

export const AI_CORE_PREFERENCES_TITLE = 'AI功能';

export const API_KEY_PREF = 'ai-assistant.openAiOfficial.openAiApiKey';
export const MODELS_PREF = 'ai-assistant.openAiOfficial.officialOpenAiModels';
export const USE_RESPONSE_API_PREF = 'ai-assistant.openAiOfficial.useResponseApi';
export const CUSTOM_ENDPOINTS_PREF = 'ai-assistant.openAiCustom.customOpenAiModels';

export const OpenAiPreferencesSchema: PreferenceSchema = {
    title: AI_CORE_PREFERENCES_TITLE,
    properties: {
        [API_KEY_PREF]: {
            title: 'API密钥',
            type: 'string',
            description: '请输入您官方OpenAI账户的API密钥。',
        },
        [MODELS_PREF]: {
            type: 'array',
            description: '设置OpenAI官方提供的AI模型',
            title: "AI模型",
            default: [
                'gpt-5.5',
                'gpt-5.5-pro'
            ],
            items: {
                type: 'string'
            }
        },
        [USE_RESPONSE_API_PREF]: {
            type: 'boolean',
            default: false,
            title: "使用响应API",
            description: '请使用新版 OpenAI Response API 替代 Chat Completion API。注意：使用工具时，将自动回退到Chat Completions API。'
        },
        [CUSTOM_ENDPOINTS_PREF]: {
            type: 'array',
            title: "自定义OpenAI模型",
            default: [],
            items: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        title: '模型 ID'
                    },
                    url: {
                        type: 'string',
                        title: '托管模型的Open AI API兼容端点'
                    },
                    id: {
                        type: 'string',
                        title: '一个在用户界面（UI）中用于标识自定义模型的唯一标识符',
                    },
                    apiKey: {
                        type: ['string', 'boolean'],
                        title: '要么是用于访问给定URL上提供的API的密钥，要么是`true`以使用全局OpenAI API密钥'
                    },
                    apiVersion: {
                        type: ['string', 'boolean'],
                        title: '要么指定版本以访问Azure中给定URL提供的API，要么指定`true`以使用全局OpenAI API版本'
                    },
                    deployment: {
                        type: 'string',
                        title: '用于访问Azure中给定URL所提供API的部署名称'
                    },
                    developerMessageSettings: {
                        type: 'string',
                        enum: ['user', 'system', 'developer', 'mergeWithFollowingUserMessage', 'skip'],
                        default: 'system',
                        title: '系统消息处理模式',
                        description: '控制系统消息的处理方式：`user`、`system` 和 `developer` 将被用作角色，`mergeWithFollowingUserMessage` 会在以下用户消息前加上系统消息作为前缀，或者如果下一条消息不是用户消息，则将系统消息转换为用户消息。`skip` 将仅删除系统消息），默认为 `system`。'
                    },
                    supportsStructuredOutput: {
                        type: 'boolean',
                        title: '指示模型是否支持结构化输出。默认为`true`。',
                        default: true
                    },
                    enableStreaming: {
                        type: 'boolean',
                        title: '指示是否应使用流式API。默认为`true`。',
                        default: true
                    },
                    useResponseApi: {
                        type: 'boolean',
                        title: '使用响应API',
                        description: '请使用新版 OpenAI Response API 替代 Chat Completion API。自定义提供程序默认值为 `false`。注意:当使用工具时,系统将自动回退至 Chat Completions API。'
                    },
                    reasoningSupport: {
                        type: ['object', 'null'],
                        title: '声明模型的推理能力',
                        description: '设置后，聊天界面会显示此模型的推理选择器。设置为`null`则禁用。默认情况下，根据模型名称进行推断。',
                        properties: {
                            supportedLevels: {
                                title: '支持的级别',
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: ['off', 'minimal', 'low', 'medium', 'high', 'auto']
                                }
                            },
                            defaultLevel: {
                                title: '默认等级',
                                type: 'string',
                                enum: ['off', 'minimal', 'low', 'medium', 'high', 'auto']
                            }
                        }
                    }
                }
            }
        }
    }
};
