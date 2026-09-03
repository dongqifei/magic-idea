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

import { interfaces } from 'inversify';
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_OFF,
    NOTIFICATION_TYPE_LABELS,
    NOTIFICATION_TYPE_DESCRIPTIONS,
    NotificationType
} from './notification-types';
import { ReasoningSettings } from './language-model';
import { PreferenceContribution, PreferenceSchema } from '@MagicIdea/core/preferences';
import { AgentSettingsPreferenceSchema } from './agent-preferences';

export const AI_CORE_PREFERENCES_TITLE = 'AI Features';
export const PREFERENCE_NAME_PROMPT_TEMPLATES = 'ai-assistant.promptTemplates.promptTemplatesFolder';
export const PREFERENCE_NAME_REQUEST_SETTINGS = 'ai-assistant.modelSettings.requestSettings';
export const PREFERENCE_NAME_REASONING = 'ai-assistant.reasoning.defaults';
export const PREFERENCE_NAME_MAX_RETRIES = 'ai-assistant.modelSettings.maxRetries';
export const PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE = 'ai-assistant.notifications.default';
export const PREFERENCE_NAME_SKILL_DIRECTORIES = 'ai-assistant.skills.skillDirectories';

export const LANGUAGE_MODEL_ALIASES_PREFERENCE = 'ai-assistant.languageModelAliases';

export const aiCorePreferenceSchema: PreferenceSchema = {
    title: AI_CORE_PREFERENCES_TITLE,
    properties: {
        // [PREFERENCE_NAME_PROMPT_TEMPLATES]: {
        //     title: '提示模板文件夹',
        //     description: '用于存储自定义提示符模板的文件夹。如果未进行自定义，则使用用户配置目录。请考虑使用版本控制的文件夹来管理您的提示符模板变体。',
        //     type: 'string',
        //     default: '',
        //     // typeDetails: {
        //     //     isFilepath: true,
        //     //     selectionProps: {
        //     //         openLabel: nls.localizeByDefault('Select Folder'),
        //     //         canSelectFiles: false,
        //     //         canSelectFolders: true,
        //     //         canSelectMany: false
        //     //     }
        //     // },
        // },
        [PREFERENCE_NAME_REQUEST_SETTINGS]: {
            title: '自定义请求设置',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    scope: {
                        type: 'object',
                        properties: {
                            modelId: {
                                type: 'string',
                                description: 'The (optional) model id'
                            },
                            providerId: {
                                type: 'string',
                                description: 'The (optional) provider id to apply the settings to.',
                            },
                            agentId: {
                                type: 'string',
                                description: 'The (optional) agent id to apply the settings to.'
                            },
                        }
                    },
                    requestSettings: {
                        type: 'object',
                        additionalProperties: true,
                        title: '请求设置',
                        description: 'Settings for the specific model ID.',
                    },
                    clientSettings: {
                        type: 'object',
                        additionalProperties: false,
                        title: '客户端设置',
                        description:  '客户端设置如何处理发送回 llm 的消息。',
                        properties: {
                            keepToolCalls: {
                                title: '保持工具调用',
                                type: 'boolean',
                                default: true,
                                description: '如果设置为 false，则在多轮对话中发送下一个用户请求之前，所有工具请求和工具响应都将被过滤。'
                            },
                            keepThinking: {
                                title: '继续思考',
                                type: 'boolean',
                                default: true,
                                description: '如果设置为 false，则在多轮对话中发送下一个用户请求之前，所有思考输出都将被过滤。'
                            }
                        }
                    },
                },
                additionalProperties: false
            },
            default: [],
        },
        [PREFERENCE_NAME_MAX_RETRIES]: {
            title: '最大重试次数',
            type: 'number',
            minimum: 0,
            default: 3
        },
        // [PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE]: {
        //     title: '默认通知类型',
        //     type: 'string',
        //     enum: [...NOTIFICATION_TYPES],
        //     // enumItemLabels: NOTIFICATION_TYPES.map(type => NOTIFICATION_TYPE_LABELS[type]),
        //     // enumDescriptions: NOTIFICATION_TYPES.map(type => NOTIFICATION_TYPE_DESCRIPTIONS[type]),
        //     default: NOTIFICATION_TYPE_OFF
        // },
        // [PREFERENCE_NAME_SKILL_DIRECTORIES]: {
        //     title: '技能目录',
        //     description: '包含技能定义(SKILL.md文件)的附加目录。技能提供可复用的指令集,供AI代理调用。工作区中的.prompts/skills目录及产品配置文件夹内的skills目录始终包含在内。',
        //     type: 'array',
        //     items: {
        //         type: 'string'
        //     },
        //     default: []
        // },
        [PREFERENCE_NAME_REASONING]: {
            title: '推理默认值',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    scope: {
                        type: 'object',
                        properties: {
                            modelId: { type: 'string' },
                            providerId: { type: 'string' },
                            agentId: { type: 'string' }
                        }
                    },
                    reasoning: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            level: {
                                type: 'string',
                                enum: ['off', 'minimal', 'low', 'medium', 'high', 'auto'],
                                default: 'auto'
                            }
                        },
                        required: ['level']
                    }
                },
                additionalProperties: false
            },
            default: []
        },
        [LANGUAGE_MODEL_ALIASES_PREFERENCE]: {
            title: '语言模型别名',
            type: 'object',
            description: '语言模型别名映射表。键为别名，值为对应的语言模型ID。模型别名说明：[default/code]专为代码理解与生成任务优化、[default/code-completion]适用于代码自动完成场景、[default/summarize]优先用于内容摘要与浓缩的模型、[default/universal]在代码场景与通用语言使用中均能保持平衡。示例：{"default/code": "chat-gpt-4"}',
            additionalProperties: {
                type: 'object',
                title: '语言模型别名映射表',
                properties: {
                    selectedModel: {
                        type: 'string',
                        title: '模型名称',
                        description: '此别名的用户选择模型.'
                    }
                },
                required: ['selectedModel'],
                additionalProperties: false
            },
            default: {},
        }
    }
};

export interface AICoreConfiguration {
    [PREFERENCE_NAME_PROMPT_TEMPLATES]: string | undefined;
    [PREFERENCE_NAME_REQUEST_SETTINGS]: Array<RequestSetting> | undefined;
    [PREFERENCE_NAME_REASONING]: Array<ReasoningPreferenceEntry> | undefined;
    [PREFERENCE_NAME_MAX_RETRIES]: number | undefined;
    [PREFERENCE_NAME_DEFAULT_NOTIFICATION_TYPE]: NotificationType | undefined;
    [PREFERENCE_NAME_SKILL_DIRECTORIES]: string[] | undefined;
}

export interface RequestSetting {
    scope?: Scope;
    clientSettings?: { keepToolCalls: boolean; keepThinking: boolean };
    requestSettings?: { [key: string]: unknown };
}

export interface Scope {
    modelId?: string;
    providerId?: string;
    agentId?: string;
}

export interface ReasoningPreferenceEntry {
    scope?: Scope;
    reasoning?: ReasoningSettings;
}

export const AICorePreferences = Symbol('AICorePreferences');

export function bindAICorePreferences(bind: interfaces.Bind): void {
    // bind(AICorePreferences).toDynamicValue(ctx => {
    //     const factory = ctx.container.get<PreferenceProxyFactory>(PreferenceProxyFactory);
    //     return factory(aiCorePreferenceSchema);
    // }).inSingletonScope();
    bind(PreferenceContribution).toConstantValue({ schema: AgentSettingsPreferenceSchema });
    bind(PreferenceContribution).toConstantValue({ schema: aiCorePreferenceSchema });
}

/**
 * Calculates the specificity score of a RequestSetting for a given scope.
 * The score is calculated based on matching criteria:
 * - Agent match: 100 points
 * - Model match: 10 points
 * - Provider match: 1 point
 *
 * @param setting RequestSetting object to check against
 * @param scope Optional scope object containing modelId, providerId, and agentId
 * @returns Specificity score (-1 for non-match, or sum of matching criteria points)
 */
export const getRequestSettingSpecificity = (setting: RequestSetting, scope?: Scope): number => {
    // If no scope is defined in the setting, return default specificity
    if (!setting.scope) {
        return 0;
    }

    // If no matching criteria are defined in the scope, return default specificity
    if (!setting.scope.modelId && !setting.scope.providerId && !setting.scope.agentId) {
        return 0;
    }

    // Check for explicit non-matches (return -1)
    if (scope?.modelId && setting.scope.modelId && setting.scope.modelId !== scope.modelId) {
        return -1;
    }

    if (scope?.providerId && setting.scope.providerId && setting.scope.providerId !== scope.providerId) {
        return -1;
    }

    if (scope?.agentId && setting.scope.agentId && setting.scope.agentId !== scope.agentId) {
        return -1;
    }

    let specificity = 0;

    // Check provider match (1 point)
    if (scope?.providerId && setting.scope.providerId === scope.providerId) {
        specificity += 1;
    }

    // Check model match (10 points)
    if (scope?.modelId && setting.scope.modelId === scope.modelId) {
        specificity += 10;
    }

    // Check agent match (100 points)
    if (scope?.agentId && setting.scope.agentId === scope.agentId) {
        specificity += 100;
    }

    return specificity;
};
