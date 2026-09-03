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
import { BaseWidget, BoxLayout, codicon, DockPanel, WidgetManager, Widget } from '@MagicIdea/core';
import { MainDockPanel } from '@MagicIdea/core/shell/main-dock-panel';
import { AIAgentConfigurationWidget } from './agent-configuration-widget';
import { ModelAliasesConfigurationWidget } from './model-aliases-configuration-widget';
import { AIToolsConfigurationWidget } from './tools-configuration-widget';
import { AIMCPConfigurationWidget } from './mcp-configuration-widget';

@injectable()
export class AIConfigurationContainerWidget extends BaseWidget {

    static readonly ID = 'ai-configuration';
    static readonly LABEL = '智能体配置';
    protected dockpanel: DockPanel;

    @inject(MainDockPanel.Factory)
    protected readonly dockPanelFactory: MainDockPanel.Factory;
    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    protected agentsWidget: AIAgentConfigurationWidget;
    protected modelAliasesWidget: ModelAliasesConfigurationWidget;
    protected toolsWidget: AIToolsConfigurationWidget;
    protected mcpWidget: AIMCPConfigurationWidget;

    @postConstruct()
    protected init(): void {
        this.id = AIConfigurationContainerWidget.ID;
        this.title.label = AIConfigurationContainerWidget.LABEL;
        this.title.caption = AIConfigurationContainerWidget.LABEL;
        this.title.closable = true;
        this.addClass('theia-settings-container');
        this.title.iconClass = codicon('gear');
        this.initUI();
        this.initListeners();
    }

    protected async initUI(): Promise<void> {
        const layout = (this.layout = new BoxLayout({ direction: 'left-to-right', spacing: 0 }));
        this.dockpanel = this.dockPanelFactory({
            mode: 'multiple-document',
            spacing: 0
        });
        BoxLayout.setStretch(this.dockpanel, 1);
        layout.addWidget(this.dockpanel);
        this.dockpanel.addClass('ai-configuration-widget');
        
        this.agentsWidget = await this.widgetManager.getOrCreateWidget(AIAgentConfigurationWidget.ID);
        this.toolsWidget = await this.widgetManager.getOrCreateWidget(AIToolsConfigurationWidget.ID);
        this.mcpWidget = await this.widgetManager.getOrCreateWidget(AIMCPConfigurationWidget.ID);
        this.modelAliasesWidget = await this.widgetManager.getOrCreateWidget(ModelAliasesConfigurationWidget.ID);

        this.dockpanel.addWidget(this.agentsWidget);
        this.dockpanel.addWidget(this.toolsWidget, { mode: 'tab-after', ref: this.agentsWidget });
        this.dockpanel.addWidget(this.mcpWidget, { mode: 'tab-after', ref: this.toolsWidget });
        this.dockpanel.addWidget(this.modelAliasesWidget, { mode: 'tab-after', ref: this.mcpWidget });

        this.update();
    }

    protected initListeners(): void {
    }
}
