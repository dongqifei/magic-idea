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
import { inject, injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { codicon, QuickInputService } from '@MagicIdea/core';
import { nls } from '@MagicIdea/core';
import {
    Agent,
    AgentService,
    AISettingsService,
    AIVariableService,
    FrontendLanguageModelRegistry,
    LanguageModel,
    LanguageModelRegistry,
    matchVariablesRegEx,
    PROMPT_FUNCTION_REGEX,
    ParsedCapability,
    parseCapabilitiesFromTemplate,
    PromptFragmentCustomizationService,
    PromptService,
    GenericCapabilitySelections,
    CAPABILITY_TYPE_PROMPT_MAP,
} from '@MagicIdea/ai-core/common';
import { isChatAgent } from '@MagicIdea/ai-chat/common';
import { LanguageModelAliasRegistry, LanguageModelAlias } from '@MagicIdea/ai-core/common/language-model-alias';
import { AIConfigurationSelectionService } from './ai-configuration-service';
import { LanguageModelRenderer } from './components/language-model-renderer';
import { PromptVariantRenderer } from './components/template-settings-renderer';
import { AIListDetailConfigurationWidget } from './base/ai-list-detail-configuration-widget';
import { AgentGlobalVariables, AgentSpecificVariables, AgentFunctions, AgentGenericCapabilitiesSettings, AgentCapabilitiesSettings } from './agent-configuration-views';

interface ParsedPrompt {
    functions: string[];
    globalVariables: string[];
    agentSpecificVariables: string[];
    capabilities: ParsedCapability[];
};

@injectable()
export class AIAgentConfigurationWidget extends AIListDetailConfigurationWidget<Agent> {

    static readonly ID = 'ai-agent-configuration-container-widget';
    static readonly LABEL = nls.localizeByDefault('智能体');

    @inject(AgentService)
    protected readonly agentService: AgentService;

    @inject(LanguageModelRegistry)
    protected readonly languageModelRegistry: FrontendLanguageModelRegistry;

    // @inject(PromptFragmentCustomizationService)
    // protected readonly promptFragmentCustomizationService: PromptFragmentCustomizationService;

    @inject(LanguageModelAliasRegistry)
    protected readonly languageModelAliasRegistry: LanguageModelAliasRegistry;

    @inject(AISettingsService)
    protected readonly aiSettingsService: AISettingsService;

    @inject(AIConfigurationSelectionService)
    protected readonly aiConfigurationSelectionService: AIConfigurationSelectionService;

    @inject(AIVariableService)
    protected readonly variableService: AIVariableService;

    @inject(PromptService)
    protected promptService: PromptService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    protected languageModels: LanguageModel[] | undefined;
    protected languageModelAliases: LanguageModelAlias[] = [];
    protected parsedPromptParts: ParsedPrompt | undefined;
    protected isLoadingDetails = false;
    protected savedCapabilityOverrides: Record<string, boolean> | undefined;
    protected savedGenericCapabilitySelections: GenericCapabilitySelections | undefined;

    @postConstruct()
    protected init(): void {
        this.id = AIAgentConfigurationWidget.ID;
        this.title.label = AIAgentConfigurationWidget.LABEL;
        this.title.closable = false;

        Promise.all([
            this.loadItems(),
            this.languageModelRegistry.getLanguageModels().then(models => {
                this.languageModels = models ?? [];
            })
        ]).then(() => this.update());

        this.languageModelAliasRegistry.ready.then(() => {
            this.languageModelAliases = this.languageModelAliasRegistry.getAliases();
            this.toDispose.push(this.languageModelAliasRegistry.onDidChange(() => {
                this.languageModelAliases = this.languageModelAliasRegistry.getAliases();
                this.update();
            }));
        });

        this.toDispose.pushAll([
            this.languageModelRegistry.onChange(({ models }) => {
                this.languageModelAliases = this.languageModelAliasRegistry.getAliases();
                this.languageModels = models;
                this.update();
            }),
            this.promptService.onPromptsChange(() => this.updateParsedPromptParts()),
            // this.promptFragmentCustomizationService.onDidChangePromptFragmentCustomization(() => {
            //     this.updateParsedPromptParts();
            // }),
            this.aiSettingsService.onDidChange(() => {
                this.updateParsedPromptParts();
            }),
            this.aiConfigurationSelectionService.onDidAgentChange(() => {
                this.selectedItem = this.aiConfigurationSelectionService.getActiveAgent();
                this.updateParsedPromptParts();
            }),
            this.agentService.onDidChangeAgents(async () => {
                await this.loadItems();
                this.update();
            })
        ]);

        this.updateParsedPromptParts();
    }

    protected async loadItems(): Promise<void> {
        this.items = this.agentService.getAllAgents();
        const activeAgent = this.aiConfigurationSelectionService.getActiveAgent();
        if (activeAgent) {
            this.selectedItem = activeAgent;
        } else if (this.items.length > 0 && !this.selectedItem) {
            this.selectedItem = this.items[0];
            this.aiConfigurationSelectionService.setActiveAgent(this.items[0]);
        }
    }

    protected getItemId(agent: Agent): string {
        return agent.id;
    }

    protected getItemLabel(agent: Agent): string {
        return agent.name;
    }

    protected override getEmptySelectionMessage(): string {
        return nls.localize('theia/ai/core/agentConfiguration/selectAgentMessage', '请先选择一个代理！');
    }

    protected override handleItemSelect = (agent: Agent): void => {
        this.selectedItem = agent;
        this.aiConfigurationSelectionService.setActiveAgent(agent);
        this.updateParsedPromptParts();
    };

    protected override renderItemPrefix(agent: Agent): React.ReactNode {
        const enabled = this.agentService.isEnabled(agent.id);
        
        return React.createElement('span', {
            className: `agent-status-indicator ${enabled ? 'agent-enabled' : 'agent-disabled'} ${enabled ? codicon('circle-filled') : codicon('circle')}`,
            title: enabled ? nls.localizeByDefault('启用') : nls.localizeByDefault('禁用')
        });
    }

    protected override renderItemSuffix(agent: Agent): React.ReactNode {
        if (!agent.tags?.length) return undefined;
        
        return React.createElement('span', null, 
            agent.tags.map(tag => 
                React.createElement('span', { key: tag, className: 'agent-tag' }, tag)
            )
        );
    }

    protected override renderList(): React.ReactNode {
        // 遍历生成所有 li 子元素
        const listItems = this.items.map(agent => {
            const agentId = this.getItemId(agent);
            const isSelected = this.selectedItem && this.getItemId(this.selectedItem) === agentId;
            
            // 拼接 className
            const liClassName = `theia-TreeNode theia-CompositeTreeNode${isSelected ? ' theia-mod-selected' : ''} ${this.getItemClassName(agent)}`;
            
            // 创建 li 元素（包含前缀、标签、后缀）
            return React.createElement('li', {
                key: agentId,
                className: liClassName,
                onClick: () => this.handleItemSelect(agent)
            },
                // 子元素按顺序渲染
                this.renderItemPrefix(agent),
                React.createElement('span', { className: 'ai-configuration-list-item-label' }, this.getItemLabel(agent)),
                this.renderItemSuffix(agent)
            );
        });

        // 外层结构：div > ul > li...
        return React.createElement('div', {
            className: 'ai-configuration-list preferences-tree-widget theia-TreeContainer'
        },
            React.createElement('ul', null, listItems)
        );
    }

    protected async updateParsedPromptParts(): Promise<void> {
        this.isLoadingDetails = true;
        const agent = this.aiConfigurationSelectionService.getActiveAgent();
        if (agent) {
            this.parsedPromptParts = await this.parsePromptFragmentsForVariableAndFunction(agent);
            const agentSettings = await this.aiSettingsService.getAgentSettings(agent.id);
            this.showInChatState = agentSettings?.showInChat ?? true;
            this.savedCapabilityOverrides = agentSettings?.capabilityOverrides;
            this.savedGenericCapabilitySelections = agentSettings?.genericCapabilitySelections;
        } else {
            this.parsedPromptParts = undefined;
            this.savedCapabilityOverrides = undefined;
            this.savedGenericCapabilitySelections = undefined;
        }
        this.isLoadingDetails = false;
        this.update();
    }

    protected showInChatState: boolean = true;

    protected renderItemDetail(agent: Agent): React.ReactNode {
        if (this.isLoadingDetails) {
            return React.createElement('div', null, nls.localizeByDefault('加载中...'));
        }

        const enabled = this.agentService.isEnabled(agent.id);

        if (!this.parsedPromptParts) {
            this.updateParsedPromptParts();
            return React.createElement('div', null, nls.localizeByDefault('加载中...'));
        }

        const globalVariables = Array.from(new Set([...this.parsedPromptParts.globalVariables, ...agent.variables]));
        const functions = Array.from(new Set([...this.parsedPromptParts.functions, ...agent.functions]));

        // 构建 agentNameWithTags（片段 → 数组）
        const agentNameWithTags = [
            agent.name,
            agent.tags && agent.tags.length > 0 && React.createElement(
                'span',
                null,
                agent.tags.map(tag => React.createElement('span', { key: tag, className: 'agent-tag' }, tag))
            )
        ].filter(Boolean);

        // 主体返回
        return React.createElement('div', { key: agent.id },
            // === 标题 + 开关区域 ===
            React.createElement('div', { className: 'settings-section-title settings-section-category-title agent-title-with-toggle' },
                React.createElement('div', { className: 'agent-title-content' },
                    React.createElement('div', null,
                        ...agentNameWithTags,
                        React.createElement('pre', { className: 'ai-id-label' }, `Id: ${agent.id}`)
                    ),
                    React.createElement('div', { className: 'agent-toggles' },
                        // 启用 Agent 开关
                        React.createElement('label', {
                            className: 'agent-enable-toggle',
                            title: nls.localize('theia/ai/core/agentConfiguration/enableAgent', '启用代理')
                        },
                            React.createElement('span', { className: 'toggle-label' },
                                nls.localize('theia/ai/core/agentConfiguration/enableAgent', '启用代理')
                            ),
                            React.createElement('div', {
                                className: 'toggle-switch',
                                onClick: this.toggleAgentEnabled
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: enabled,
                                    onChange: this.toggleAgentEnabled
                                }),
                                React.createElement('span', { className: 'toggle-slider' })
                            )
                        ),
                        // Show in Chat 开关（条件渲染）
                        isChatAgent(agent) && React.createElement('label', {
                            className: `agent-enable-toggle${enabled ? '' : ' disabled'}`,
                            title: nls.localize('theia/ai/core/agentConfiguration/showInChat', '在聊天中显示')
                        },
                            React.createElement('span', { className: 'toggle-label' },
                                nls.localize('theia/ai/core/agentConfiguration/showInChat', '在聊天中显示')
                            ),
                            React.createElement('div', {
                                className: 'toggle-switch',
                                onClick: enabled ? this.toggleShowInChat : undefined
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: this.showInChatState,
                                    disabled: !enabled,
                                    onChange: this.toggleShowInChat
                                }),
                                React.createElement('span', { className: 'toggle-slider' })
                            )
                        )
                    )
                )
            ),

            // === 描述 ===
            agent.description && React.createElement('div', { className: 'ai-agent-description' }, agent.description),

            // === Prompt Templates ===
            agent.prompts.length > 0 && [
                React.createElement('div', {
                    className: 'settings-section-subcategory-title ai-settings-section-subcategory-title'
                }, nls.localize('theia/ai/core/agentConfiguration/promptTemplates', '提示词模板')),
                React.createElement('table', { className: 'ai-templates-table' },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, nls.localize('theia/ai/core/agentConfiguration/templateName', '模板')),
                            React.createElement('th', null, nls.localize('theia/ai/core/agentConfiguration/variant', '变量')),
                            React.createElement('th', { className: 'template-actions-header' },
                                nls.localize('theia/ai/core/agentConfiguration/actions', '操作')
                            )
                        )
                    ),
                    React.createElement('tbody', null,
                        agent.prompts.map(prompt => React.createElement(PromptVariantRenderer, {
                            key: agent.id + '.' + prompt.id,
                            agentId: agent.id,
                            promptVariantSet: prompt,
                            promptService: this.promptService
                        }))
                    )
                )
            ],

            // === LanguageModelRenderer ===
            React.createElement('div', { className: 'ai-lm-requirements' },
                React.createElement(LanguageModelRenderer, {
                    agent: agent,
                    languageModels: this.languageModels,
                    aiSettingsService: this.aiSettingsService,
                    languageModelRegistry: this.languageModelRegistry,
                    languageModelAliases: this.languageModelAliases
                })
            ),

            // === Used Global Variables ===
            globalVariables.length > 0 && [
                React.createElement('div', {
                    className: 'settings-section-subcategory-title ai-settings-section-subcategory-title'
                }, nls.localize('theia/ai/core/agentConfiguration/usedGlobalVariables', '已使用的全局变量')),
                React.createElement(AgentGlobalVariables, {
                    variables: globalVariables,
                    variableService: this.variableService
                })
            ],

            // === Used Agent-Specific Variables ===
            this.parsedPromptParts.agentSpecificVariables.length > 0 && [
                React.createElement('div', {
                    className: 'settings-section-subcategory-title ai-settings-section-subcategory-title'
                }, nls.localize('theia/ai/core/agentConfiguration/usedAgentSpecificVariables', '已使用的Agent特定变量')),
                React.createElement('ul', { className: 'variable-references' },
                    React.createElement(AgentSpecificVariables, {
                        promptVariables: this.parsedPromptParts.agentSpecificVariables,
                        agent: agent
                    })
                )
            ],

            // === Used Functions ===
            functions.length > 0 && [
                React.createElement('div', {
                    className: 'settings-section-subcategory-title ai-settings-section-subcategory-title'
                }, nls.localize('theia/ai/core/agentConfiguration/usedFunctions', '已使用的工具')),
                React.createElement('ul', { className: 'function-references' },
                    React.createElement(AgentFunctions, { functions: functions })
                )
            ],

            // === Available Capabilities ===
            this.parsedPromptParts.capabilities.length > 0 && [
                React.createElement('div', { className: 'settings-section-subcategory-title' },
                    nls.localize('theia/ai/core/agentConfiguration/availableCapabilities', '可用功能')
                ),
                React.createElement(AgentCapabilitiesSettings, {
                    capabilities: this.parsedPromptParts.capabilities,
                    agentId: agent.id,
                    savedOverrides: this.savedCapabilityOverrides,
                    aiSettingsService: this.aiSettingsService,
                    onSettingsChange: () => this.updateParsedPromptParts()
                })
            ],

            // === Generic Capabilities ===
            GenericCapabilitySelections.hasSelections(this.savedGenericCapabilitySelections) && [
                React.createElement('div', {
                    className: 'settings-section-subcategory-title ai-settings-section-subcategory-title'
                }, nls.localize('theia/ai/ide/agentConfiguration/genericCapabilitiesSettings', '通用功能')),
                React.createElement(AgentGenericCapabilitiesSettings, {
                    agentId: agent.id,
                    savedSelections: this.savedGenericCapabilitySelections,
                    aiSettingsService: this.aiSettingsService,
                    onSettingsChange: () => this.updateParsedPromptParts()
                })
            ],
        );
    }

    protected async parsePromptFragmentsForVariableAndFunction(agent: Agent): Promise<ParsedPrompt> {
        const result: ParsedPrompt = { functions: [], globalVariables: [], agentSpecificVariables: [], capabilities: [] };
        const agentSettings = await this.aiSettingsService.getAgentSettings(agent.id);
        const selectedVariants = agentSettings?.selectedVariants ?? {};

        for (const mainTemplate of agent.prompts) {
            const promptId = selectedVariants[mainTemplate.id] ?? mainTemplate.defaultVariant.id ?? mainTemplate.id;
            const promptToAnalyze: string | undefined = this.promptService.getRawPromptFragment(promptId)?.template;

            if (!promptToAnalyze) {
                continue;
            }

            this.extractVariablesAndFunctions(promptToAnalyze, result, agent);
            this.extractCapabilities(promptToAnalyze, result);
        }

        return result;
    }

    protected extractCapabilities(promptContent: string, result: ParsedPrompt): void {
        const capabilities = parseCapabilitiesFromTemplate(promptContent);
        const existingIds = new Set(result.capabilities.map(c => c.fragmentId));
        for (const capability of capabilities) {
            if (!existingIds.has(capability.fragmentId)) {
                const fragment = this.promptService.getRawPromptFragment(capability.fragmentId);
                result.capabilities.push({
                    ...capability,
                    name: fragment?.name,
                    description: fragment?.description,
                });
                existingIds.add(capability.fragmentId);
            }
        }
    }

    protected extractVariablesAndFunctions(promptContent: string, result: ParsedPrompt, agent: Agent): void {
        const variableMatches = matchVariablesRegEx(promptContent);
        variableMatches.forEach(match => {
            const variableId = match[1];
            if (variableId.startsWith('!--') || variableId.startsWith('capability:')) {
                return;
            }

            const baseVariableId = variableId.split(':')[0];

            if (this.variableService.hasVariable(baseVariableId) &&
                agent.agentSpecificVariables.find(v => v.name === baseVariableId) === undefined) {
                result.globalVariables.push(variableId);
            } else {
                result.agentSpecificVariables.push(variableId);
            }
        });

        const functionMatches = [...promptContent.matchAll(PROMPT_FUNCTION_REGEX)];
        functionMatches.forEach(match => {
            const functionId = match[1];
            result.functions.push(functionId);
        });
    }

    private toggleAgentEnabled = async () => {
        const agent = this.aiConfigurationSelectionService.getActiveAgent();
        if (!agent) {
            return false;
        }
        const enabled = this.agentService.isEnabled(agent.id);
        if (enabled) {
            await this.agentService.disableAgent(agent.id);
        } else {
            await this.agentService.enableAgent(agent.id);
        }
        this.update();
    };

    private toggleShowInChat = async () => {
        const agent = this.aiConfigurationSelectionService.getActiveAgent();
        if (!agent) {
            return;
        }
        if (!this.agentService.isEnabled(agent.id)) {
            return;
        }
        const newValue = !this.showInChatState;
        await this.aiSettingsService.updateAgentSettings(agent.id, { showInChat: newValue });
        this.showInChatState = newValue;
        this.update();
    };
}
