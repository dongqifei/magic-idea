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

export const API_KEY_PREF = 'ai-assistant.anthropic.AnthropicApiKey';
export const MODELS_PREF = 'ai-assistant.anthropic.AnthropicModels';
export const CUSTOM_ENDPOINTS_PREF = 'ai-assistant.anthropicCustom.customAnthropicModels';

export const AnthropicPreferencesSchema: PreferenceSchema = {
    title: 'Anthropic',
    properties: {
        [API_KEY_PREF]: {
            type: 'string',
            title: 'API密钥',
            description: '请输入您官方Anthropic账户的API密钥。'
        },
        [MODELS_PREF]: {
            type: 'array',
            description: '设置Anthropic官方提供的AI模型',
            title: "模型",
            default: [
                'claude-opus-4-7',
                'claude-sonnet-4-6',
            ],
            items: {
                type: 'string'
            }
        },
        [CUSTOM_ENDPOINTS_PREF]: {
            type: 'array',
            title: '自定义端点',
            default: [],
            items: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        title: '模型ID'
                    },
                    url: {
                        type: 'string',
                        title: '托管该模型的Anthropic API兼容端点'
                    },
                    id: {
                        type: 'string',
                        title: '用于在用户界面中标识自定义模型的唯一标识符'
                    },
                    apiKey: {
                        type: ['string', 'boolean'],
                        title: '要么是访问指定网址所托管API的密钥,要么是使用全局Anthropic API密钥的`true`值',
                    },
                    enableStreaming: {
                        type: 'boolean',
                        default: true,
                        title: '指示是否使用流式API。默认值为`true`。'
                    },
                    useCaching: {
                        type: 'boolean',
                        default: true,
                        title: '指示模型是否支持提示缓存。默认值为`true`'
                    },
                    maxRetries: {
                        type: 'number',
                        default: 3,
                        title: '请求失败时的最大重试次数。默认值为3。'
                    },
                    reasoningApi: {
                        type: ['string', 'null'],
                        enum: ['effort', 'budget', null], // eslint-disable-line no-null/no-null
                        title: '应使用哪种 Anthropic 推理 API 模式:`effort` 用于自适应推理(Claude 4.6+),`budget` 用于传统扩展推理(Claude 4.0–4.5),或 `null` 用于禁用。默认根据模型名称推断。'
                    },
                    supportsXHighEffort: {
                        type: 'boolean',
                        title: '指示模型是否接受 Anthropic 的 `xhigh` 工作量值。默认情况下由模型名称推断得出。'
                    }
                }
            }
        }
    }
};
