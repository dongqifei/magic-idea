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

interface AgentGlobalVariablesProps {
    variables: string[];
    variableService: AIVariableService;
}
export const AgentGlobalVariables = ({ variables: globalVariables, variableService }: AgentGlobalVariablesProps) => {
    if (globalVariables.length === 0) {
        return <div className="ai-empty-state-content">
            {nls.localizeByDefault('None')}
        </div>;
    }

    const allVariables = variableService.getVariables();
    const variableData = globalVariables.map(varId => {
        const variable = allVariables.find(v => v.id === varId);
        return {
            id: varId,
            name: variable?.name || varId,
            description: variable?.description || ''
        };
    });

    return (
        <table className="ai-templates-table">
            <thead>
                <tr>
                    <th>{nls.localizeByDefault('变量')}</th>
                    <th>{nls.localizeByDefault('说明')}</th>
                </tr>
            </thead>
            <tbody>
                {variableData.map(variable => (
                    <tr key={variable.id}>
                        <td className="ai-variable-name-cell">{variable.name}</td>
                        <td className="ai-variable-description-cell">
                            {variable.description || nls.localize('theia/ai/ide/agentConfiguration/noDescription', '无可用描述')}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

interface AgentFunctionsProps {
    functions: string[];
}
export const AgentFunctions = ({ functions }: AgentFunctionsProps) => {
    if (functions.length === 0) {
        return <>{nls.localizeByDefault('无')}</>;
    }
    return <>
        {functions.map(functionId => <li key={functionId} className='variable-reference'>
            <span>{functionId}</span>
        </li>)}
    </>;
};

interface AgentCapabilitiesSettingsProps {
    capabilities: ParsedCapability[];
    agentId: string;
    savedOverrides: Record<string, boolean> | undefined;
    aiSettingsService: AISettingsService;
    onSettingsChange: () => void;
}
export const AgentCapabilitiesSettings = ({ capabilities, agentId, savedOverrides, aiSettingsService, onSettingsChange }: AgentCapabilitiesSettingsProps) => {
    const [loading, setLoading] = React.useState(false);

    const handleToggle = async (fragmentId: string, currentValue: boolean) => {
        if (loading) {
            return;
        }
        setLoading(true);
        try {
            const newValue = !currentValue;
            const capability = capabilities.find(c => c.fragmentId === fragmentId);
            if (!capability) {
                return;
            }

            const newOverrides = { ...savedOverrides };

            // If new value matches default, remove the override
            if (newValue === capability.defaultEnabled) {
                delete newOverrides[fragmentId];
            } else {
                newOverrides[fragmentId] = newValue;
            }

            await aiSettingsService.updateAgentSettings(agentId, { capabilityOverrides: newOverrides });
            onSettingsChange();
        } catch (error) {
            console.error('Failed to update capability settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetAll = async () => {
        if (loading) {
            return;
        }
        setLoading(true);
        try {
            await aiSettingsService.updateAgentSettings(agentId, { capabilityOverrides: undefined });
            onSettingsChange();
        } catch (error) {
            console.error('Failed to reset all capability settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentValue = (capability: ParsedCapability): boolean => {
        if (savedOverrides && capability.fragmentId in savedOverrides) {
            return savedOverrides[capability.fragmentId];
        }
        return capability.defaultEnabled;
    };

    const hasOverride = (capability: ParsedCapability): boolean =>
        savedOverrides !== undefined && capability.fragmentId in savedOverrides;

    const hasAnyOverrides = savedOverrides && Object.keys(savedOverrides).length > 0;

    return (
        <>
            {hasAnyOverrides && (
                <div className="capability-reset-all-container">
                    <button
                        className="theia-button secondary"
                        onClick={handleResetAll}
                        disabled={loading}
                        title={nls.localize('theia/ai/ide/agentConfiguration/resetAllCapabilities', '将所有功能重置为默认值')}
                    >
                        {nls.localize('theia/ai/ide/agentConfiguration/resetAllDefaults', '将所有设置重置为默认值')}
                    </button>
                </div>
            )}
            <table className="ai-templates-table">
                <thead>
                    <tr>
                        <th>{nls.localizeByDefault('ID')}</th>
                        <th>{nls.localizeByDefault('名称')}</th>
                        <th>{nls.localizeByDefault('描述')}</th>
                        <th>{nls.localizeByDefault('启用')}</th>
                    </tr>
                </thead>
                <tbody>
                    {capabilities.map(capability => (
                        <tr key={capability.fragmentId} className={hasOverride(capability) ? 'capability-modified' : ''}>
                            <td className="ai-variable-name-cell">{capability.fragmentId}</td>
                            <td className="ai-variable-name-cell">
                                {capability.name ?? capability.fragmentId}
                            </td>
                            <td className="ai-variable-description-cell">
                                {capability.description ?? nls.localize('theia/ai/ide/agentConfiguration/noDescription', '无可用描述')}
                            </td>
                            <td>
                                <div className='toggle-switch' onClick={!loading ? () => handleToggle(capability.fragmentId, getCurrentValue(capability)) : undefined}>
                                    <input type="checkbox" checked={getCurrentValue(capability)} disabled={loading} readOnly />
                                    <span className='toggle-slider'></span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

interface AgentSpecificVariablesProps {
    promptVariables: string[];
    agent: Agent;
}
export const AgentSpecificVariables = ({ promptVariables, agent }: AgentSpecificVariablesProps) => {
    const agentDefinedVariablesName = agent.agentSpecificVariables.map(v => v.name);
    const variables = Array.from(new Set([...promptVariables, ...agentDefinedVariablesName]));
    if (variables.length === 0) {
        return <div className="ai-empty-state-content">
            {nls.localizeByDefault('无')}
        </div>;
    }
    return <div>
        {variables.map(variableId =>
            <AgentSpecificVariable
                key={variableId}
                variableId={variableId}
                agent={agent}
                promptVariables={promptVariables} />
        )}
    </div>;
};
interface AgentSpecificVariableProps {
    variableId: string;
    agent: Agent;
    promptVariables: string[];
}
export const AgentSpecificVariable = ({ variableId, agent, promptVariables }: AgentSpecificVariableProps) => {
    const agentDefinedVariable = agent.agentSpecificVariables.find(v => v.name === variableId);
    const undeclared = agentDefinedVariable === undefined;
    const notUsed = !promptVariables.includes(variableId) && agentDefinedVariable?.usedInPrompt === true;
    return <div key={variableId} className="ai-agent-specific-variable-item">
        <div className="ai-configuration-value-row">
            <span className="ai-configuration-value-row-label">{nls.localizeByDefault('名称')}:</span>
            <span className="ai-configuration-value-row-value">{variableId}</span>
        </div>
        {undeclared ? (
            <div className="ai-configuration-value-row"
                title={nls.localize('theia/ai/core/agentConfiguration/undeclaredTooltip',
                    '该变量用于提示符,但代理未声明其描述。')}>
                <span className="ai-configuration-value-row-label">{nls.localizeByDefault('状态')}:</span>
                <span className="ai-configuration-value-row-value ai-configuration-warning-text">
                    {nls.localize('theia/ai/core/agentConfiguration/undeclared', '未声明')}
                </span>
            </div>
        ) : (
            <>
                <div className="ai-configuration-value-row">
                    <span className="ai-configuration-value-row-label">{nls.localizeByDefault('描述')}:</span>
                    <span className="ai-configuration-value-row-value">{agentDefinedVariable.description}</span>
                </div>
                {notUsed && (
                    <div className="ai-configuration-value-row"
                        title={nls.localize('theia/ai/core/agentConfiguration/notUsedInPromptTooltip',
                            '该变量由代理声明,但在当前提示模板中未被引用。')}>
                        <span className="ai-configuration-value-row-label">{nls.localizeByDefault('状态')}:</span>
                        <span className="ai-configuration-value-row-value ai-configuration-warning-text">
                            {nls.localize('theia/ai/core/agentConfiguration/notUsedInPrompt', '不用于提示符')}
                        </span>
                    </div>
                )}
            </>
        )}
    </div>;
};

interface AgentGenericCapabilitiesSettingsProps {
    agentId: string;
    savedSelections: GenericCapabilitySelections | undefined;
    aiSettingsService: AISettingsService;
    onSettingsChange: () => void;
}

export const AgentGenericCapabilitiesSettings = ({ agentId, savedSelections, aiSettingsService, onSettingsChange }: AgentGenericCapabilitiesSettingsProps) => {
    const [loading, setLoading] = React.useState(false);

    const handleReset = async (capabilityType: keyof GenericCapabilitySelections) => {
        if (loading) {
            return;
        }
        setLoading(true);
        try {
            const newSelections: GenericCapabilitySelections = {
                ...savedSelections,
                [capabilityType]: undefined
            };
            await aiSettingsService.updateAgentSettings(agentId, { genericCapabilitySelections: newSelections });
            onSettingsChange();
        } catch (error) {
            console.error('Failed to reset generic capability selections:', error);
        } finally {
            setLoading(false);
        }
    };

    const capabilityTypes = CAPABILITY_TYPE_PROMPT_MAP.map(m => m.type);

    const getDisplayName = (type: keyof GenericCapabilitySelections): string => ({
        skills: nls.localizeByDefault('Skills'),
        mcpFunctions: nls.localize('theia/ai/ide/agentConfiguration/genericCapabilityType/mcpFunctions', 'MCP 功能'),
        functions: nls.localize('theia/ai/ide/agentConfiguration/genericCapabilityType/functions', '功能'),
        promptFragments: nls.localize('theia/ai/ide/agentConfiguration/genericCapabilityType/promptFragments', '提示片段'),
        agentDelegation: nls.localize('theia/ai/ide/agentConfiguration/genericCapabilityType/agentDelegation', '代理委托'),
        variables: nls.localizeByDefault('Variables')
    } as const)[type];

    return (
        <table className="ai-templates-table">
            <thead>
                <tr>
                    <th>{nls.localizeByDefault('类型')}</th>
                    <th>{nls.localize('theia/ai/ide/agentConfiguration/selections', '选项')}</th>
                    <th className="template-actions-header">{nls.localize('theia/ai/core/agentConfiguration/actions', '操作')}</th>
                </tr>
            </thead>
            <tbody>
                {capabilityTypes
                    .filter(type => (savedSelections?.[type]?.length ?? 0) > 0)
                    .map(type => (
                        <tr key={type}>
                            <td className="ai-variable-name-cell">{getDisplayName(type)}</td>
                            <td className="ai-variable-description-cell">
                                {(savedSelections?.[type] ?? []).join(', ')}
                            </td>
                            <td className="template-actions-cell">
                                <button
                                    className="theia-button secondary"
                                    onClick={() => handleReset(type)}
                                    disabled={loading}
                                    title={nls.localizeByDefault('重置')}
                                >
                                    {nls.localizeByDefault('重置')}
                                </button>
                            </td>
                        </tr>
                    ))}
            </tbody>
        </table>
    );
};
