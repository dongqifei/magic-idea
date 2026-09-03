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

import { ConfirmDialog } from '@MagicIdea/core/browser/dialogs';
import { inject, injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { ToolInvocationRegistry, ToolRequest } from '@MagicIdea/ai-core';
import { nls, PreferenceService } from '@MagicIdea/core';
import { ToolConfirmationManager } from '@MagicIdea/ai-chat/chat-tool-preference-bindings';
import { ToolConfirmationMode } from '@MagicIdea/ai-chat/common/chat-tool-preferences';
import { AITableConfigurationWidget, TableColumn } from './base/ai-table-configuration-widget';

const TOOL_OPTIONS: { value: ToolConfirmationMode, label: string, icon: string }[] = [
    { value: ToolConfirmationMode.DISABLED, label: nls.localizeByDefault('禁用'), icon: 'close' },
    { value: ToolConfirmationMode.CONFIRM, label: nls.localize('theia/ai/ide/toolsConfiguration/toolOptions/confirm/label', '确认'), icon: 'question' },
    { value: ToolConfirmationMode.ALWAYS_ALLOW, label: nls.localizeByDefault('始终允许'), icon: 'thumbsup' },
];

interface ToolItem {
    name: string;
}

@injectable()
export class AIToolsConfigurationWidget extends AITableConfigurationWidget<ToolItem> {
    static readonly ID = 'ai-tools-configuration-widget';
    static readonly LABEL = nls.localizeByDefault('工具');

    @inject(ToolConfirmationManager)
    protected readonly confirmationManager: ToolConfirmationManager;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(ToolInvocationRegistry)
    protected readonly toolInvocationRegistry: ToolInvocationRegistry;

    protected toolConfirmationModes: Record<string, ToolConfirmationMode> = {};
    protected defaultState: ToolConfirmationMode;
    protected allowlistPatterns: string[] = [];
    protected allowlistInputRef = React.createRef<HTMLInputElement>();
    protected allowlistError: string | undefined;
    protected denylistPatterns: string[] = [];
    protected denylistInputRef = React.createRef<HTMLInputElement>();
    protected denylistError: string | undefined;

    @postConstruct()
    protected init(): void {
        this.id = AIToolsConfigurationWidget.ID;
        this.title.label = AIToolsConfigurationWidget.LABEL;
        this.title.closable = false;
        this.addClass('ai-configuration-widget');

        this.loadData().then(() => this.update());
        this.toDispose.pushAll([
            this.preferenceService.onDidPreferenceChanged(async e => {
                if (e.key === 'ai-assistant.chat.toolConfirmation') {
                    this.defaultState = await this.loadDefaultConfirmation();
                    this.toolConfirmationModes = await this.loadToolConfigurationModes();
                    this.update();
                }
            }),
            this.toolInvocationRegistry.onDidChange(async () => {
                await this.loadItems();
                this.update();
            })
        ]);
    }

    protected async loadData(): Promise<void> {
        await this.loadItems();
        this.defaultState = await this.loadDefaultConfirmation();
        this.toolConfirmationModes = await this.loadToolConfigurationModes();
    }

    protected async loadItems(): Promise<void> {
        const toolNames = this.toolInvocationRegistry.getAllFunctions()
            .map(func => func.name)
            .sort((a, b) => {
                const aIsMcp = a.startsWith('mcp_');
                const bIsMcp = b.startsWith('mcp_');
                if (aIsMcp !== bIsMcp) {
                    return aIsMcp ? 1 : -1;
                }
                return a.localeCompare(b);
            });
        this.items = toolNames.map(name => ({ name }));
    }

    protected getItemId(item: ToolItem): string {
        return item.name;
    }

    protected async loadDefaultConfirmation(): Promise<ToolConfirmationMode> {
        return this.confirmationManager.getConfirmationMode('*', 'doesNotMatter');
    }

    protected async loadToolConfigurationModes(): Promise<Record<string, ToolConfirmationMode>> {
        return this.confirmationManager.getAllConfirmationSettings();
    }

    protected async updateToolConfirmationMode(tool: string, state: ToolConfirmationMode, toolRequest?: ToolRequest): Promise<void> {
        await this.confirmationManager.setConfirmationMode(tool, state, toolRequest);
    }

    protected async updateDefaultConfirmation(state: ToolConfirmationMode): Promise<void> {
        await this.confirmationManager.setConfirmationMode('*', state);
    }

    protected handleToolConfirmationModeChange = async (toolName: string, event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
        const newState = event.target.value as ToolConfirmationMode;
        const toolRequest = this.toolInvocationRegistry.getFunction(toolName);

        if (newState === ToolConfirmationMode.ALWAYS_ALLOW) {
            if (toolRequest?.confirmAlwaysAllow) {
                const confirmed = await this.showConfirmAlwaysAllowDialog(toolName, toolRequest);
                if (!confirmed) {
                    this.update();
                    return;
                }
            }
        }

        await this.updateToolConfirmationMode(toolName, newState, toolRequest);
        this.toolConfirmationModes = await this.loadToolConfigurationModes();
        this.update();
    };

    protected async showConfirmAlwaysAllowDialog(toolName: string, toolRequest: ToolRequest): Promise<boolean> {
        const warningMessage = typeof toolRequest.confirmAlwaysAllow === 'string'
            ? toolRequest.confirmAlwaysAllow
            : nls.localize(
                'theia/ai/ide/toolsConfiguration/confirmAlwaysAllow/genericWarning',
                '此工具需在启用自动批准功能前进行确认。' +
                '启用后,所有后续调用将无需确认直接执行。' +
                '仅当您信任该工具且理解潜在风险时才启用此功能。'
            );

        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/ide/toolsConfiguration/confirmAlwaysAllow/title', '是否为“'+toolName+'”启用自动批准?'),
            msg: warningMessage,
            ok: nls.localize('theia/ai/ide/toolsConfiguration/confirmAlwaysAllow/confirm', '我明白了,启用自动批准'),
            cancel: nls.localizeByDefault('取消')
        });
        return !!await dialog.open();
    }

    protected handleDefaultStateChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = event.target.value as ToolConfirmationMode;
        await this.updateDefaultConfirmation(newState);
    };

    protected async resetAllToolsToDefault(): Promise<void> {
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/ide/toolsConfiguration/resetAllConfirmDialog/title', '重置所有工具确认模式'),
            msg: nls.localize('theia/ai/ide/toolsConfiguration/resetAllConfirmDialog/msg',
                '您确定要将所有工具确认模式重置为默认值吗?此操作将清除所有自定义设置。'),
            ok: nls.localize('theia/ai/ide/toolsConfiguration/resetAll', '重置全部'),
            cancel: nls.localizeByDefault('取消')
        });
        const shouldReset = await dialog.open();
        if (shouldReset) {
            this.confirmationManager.resetAllConfirmationModeSettings();
        }
    }

    protected override renderHeader(): React.ReactNode {
        return React.createElement('div', { className: 'ai-tools-configuration-header' },
            React.createElement('div', { style: { fontWeight: 500 } },
                nls.localize('theia/ai/ide/toolsConfiguration/default/label', '默认工具确认模式:')
            ),
            React.createElement('select', {
                className: 'theia-select form-control',
                style: { width: 'auto' },
                value: this.defaultState,
                onChange: this.handleDefaultStateChange
            },
                TOOL_OPTIONS.map(opt =>
                    React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
                )
            ),
            React.createElement('button', {
                className: 'theia-button secondary ai-tools-reset-button',
                style: { marginLeft: 'auto' },
                title: nls.localize('theia/ai/ide/toolsConfiguration/resetAllTooltip', '将所有工具重置为默认设置'),
                onClick: () => this.resetAllToolsToDefault()
            },
                nls.localize('theia/ai/ide/toolsConfiguration/resetAll', '重置全部')
            )
        );
    }

    protected getEffectiveState(toolName: string): ToolConfirmationMode {
        const explicitSetting = this.toolConfirmationModes[toolName];
        if (explicitSetting !== undefined) {
            return explicitSetting;
        }
        const toolRequest = this.toolInvocationRegistry.getFunction(toolName);
        if (toolRequest?.confirmAlwaysAllow && this.defaultState === ToolConfirmationMode.ALWAYS_ALLOW) {
            return ToolConfirmationMode.CONFIRM;
        }
        return this.defaultState;
    }

    protected getColumns(): TableColumn<ToolItem>[] {
        return [
            {
                id: 'tool-name',
                label: nls.localizeByDefault('工具'),
                className: 'tool-name-column',
                renderCell: (item: ToolItem) =>
                    React.createElement('span', null, item.name)
            },
            {
                id: 'confirmation-mode',
                label: nls.localize('theia/ai/ide/toolsConfiguration/confirmation-mode/label', '确认模式'),
                className: 'confirmation-mode-column',
                renderCell: (item: ToolItem) => {
                    const effectiveState = this.getEffectiveState(item.name);
                    return React.createElement('select', {
                        className: 'theia-select form-control',
                        style: { width: 'auto' },
                        value: effectiveState,
                        onChange: (e: any) => this.handleToolConfirmationModeChange(item.name, e)
                    },
                        TOOL_OPTIONS.map(opt =>
                            React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
                        )
                    );
                }
            }
        ];
    }

    protected override getRowClassName(item: ToolItem): string {
        const effectiveState = this.getEffectiveState(item.name);
        const isDefault = effectiveState === this.defaultState;
        return isDefault ? 'default-mode' : 'custom-mode';
    }
}