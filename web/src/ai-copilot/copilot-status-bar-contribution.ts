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

import { inject, injectable, postConstruct } from 'inversify';
import { FrontendApplicationContribution } from '@MagicIdea/core';
import { IStatusBarService } from '@MagicIdea/core/statusbar';
import { Disposable, DisposableCollection } from '@MagicIdea/core/common';
import { PreferenceService } from '@MagicIdea/core/preferences';
import { CommandRegistry } from '@lumino/commands';
// import { AIActivationService } from '@MagicIdea/ai-core/lib/browser';
import { CopilotAuthService, CopilotAuthState } from './common/copilot-auth-service';
import { CopilotCommands } from './copilot-command-contribution';
import { COPILOT_ENABLED_PREF } from './common/copilot-preferences';

const COPILOT_STATUS_BAR_ID = 'copilot-auth-status';

/**
 * Frontend contribution that displays GitHub Copilot authentication status in the status bar.
 */
@injectable()
export class CopilotStatusBarContribution implements FrontendApplicationContribution, Disposable {

    @inject(IStatusBarService)
    protected readonly statusBar: IStatusBarService;

    @inject(CopilotAuthService)
    protected readonly authService: CopilotAuthService;

    // @inject(AIActivationService)
    // protected readonly activationService: AIActivationService;
    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected authState: CopilotAuthState = { isAuthenticated: false };
    protected readonly toDispose = new DisposableCollection();

    // 当前状态栏项
    private copilotStatusUpdate?: (opts: any) => void;

    @postConstruct()
    protected init(): void {
        this.toDispose.push(this.authService.onAuthStateChanged(state => {
            this.authState = state;
            this.updateStatusBar('update');
        }));
        // this.toDispose.push(this.activationService.onDidChangeActiveStatus(() => {
        //     this.updateStatusBar();
        // }));
        this.toDispose.push(this.preferenceService.onDidPreferenceChanged(event => {
            if (event.key === COPILOT_ENABLED_PREF) {
                this.updateStatusBar('update');
            }
        }));
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    onStart(): void {
        this.authService.getAuthState().then(state => {
            this.authState = state;
            this.updateStatusBar("init");
        });
    }

    protected updateStatusBar(type: string | 'update'): void {
        const isCopilotEnabled = this.preferenceService.get<boolean>(COPILOT_ENABLED_PREF, true);
        
        let text: string;
        let tooltip: string;
        let command: string;

        const isAuthenticated = this.authState.isAuthenticated;
        if (isAuthenticated) {
            const accountLabel = this.authState.accountLabel ?? 'GitHub';
            text = `${accountLabel}`;
            tooltip = `已以 ${accountLabel} 的身份登录 GitHub Copilot。点击此处退出登录。`;
            command = CopilotCommands.SIGN_OUT.id;
        } else {
            text = `登录 GitHub Copilot`;
            tooltip = '尚未登录 GitHub Copilot。点击此处登录。';
            command = CopilotCommands.SIGN_IN.id;
        }

        if (type === 'init') {
            const copilotStatusBarItem = this.statusBar.registerItem(COPILOT_STATUS_BAR_ID, {
                text,
                tooltip,
                icon: 'codicon codicon-copilot',
                alignment: 'right',
                priority: 100,
                visible: isCopilotEnabled,
                type: 'text',
                onClick: () => this.commands.execute(command)
            });
            this.copilotStatusUpdate = copilotStatusBarItem.update;
            return;
        }

        if (this.copilotStatusUpdate) {
            this.copilotStatusUpdate({ text, tooltip, onClick: () => this.commands.execute(command), visible: isCopilotEnabled });
        }
    }
}
