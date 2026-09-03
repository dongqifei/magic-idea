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
import { CommandContribution, CommandRegistry } from '@MagicIdea/core/commands';
import { Disposable, DisposableCollection } from '@MagicIdea/core/common';
import { ConfirmDialog, Dialog } from '@MagicIdea/core/browser/dialogs';
import { PreferenceService } from '@MagicIdea/core/preferences';
import { CopilotAuthService, CopilotAuthState } from './common/copilot-auth-service';
import { COPILOT_ENABLED_PREF, COPILOT_ENTERPRISE_URL_PREF } from './common/copilot-preferences';
import { CopilotAuthDialog, CopilotAuthDialogProps } from './copilot-auth-dialog';

export namespace CopilotCommands {

  export const SIGN_IN = { id: "copilot.signIn", label: "登录" }; // 撤销命令
  export const SIGN_OUT = { id: "copilot.signOut", label: "退出" }; // 重做命令
}

/**
 * Command contribution for GitHub Copilot authentication commands.
 */
@injectable()
export class CopilotCommandContribution implements CommandContribution, Disposable {
  
    @inject(CopilotAuthService)
    protected readonly authService: CopilotAuthService;

    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(CopilotAuthDialogProps)
    protected readonly dialogProps: CopilotAuthDialogProps;

    @inject(CopilotAuthDialog)
    protected readonly authDialog: CopilotAuthDialog;

    protected authState: CopilotAuthState = { isAuthenticated: false };
    protected readonly toDispose = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.authService.getAuthState().then(state => {
            this.authState = state;
        });

        this.toDispose.push(this.authService.onAuthStateChanged(state => {
            this.authState = state;
        }));
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    registerCommands(registry: CommandRegistry): void {
        registry.addCommand(CopilotCommands.SIGN_IN.id, {
          iconClass: 'codicon codicon-sign-in',
          label: CopilotCommands.SIGN_IN.label,
          execute: async () => {
              const enterpriseUrl = this.preferenceService.get<string>(COPILOT_ENTERPRISE_URL_PREF);
                this.dialogProps.enterpriseUrl = enterpriseUrl || undefined;
                const result = await this.authDialog.open();
                if (result) {
                    this.authState = await this.authService.getAuthState();
                }
          },
          isEnabled: () => !this.authState.isAuthenticated,
          isVisible: () => this.isCopilotEnabled()
        });

        registry.addCommand(CopilotCommands.SIGN_OUT.id, {
            execute: async () => {
              const confirmed = await new ConfirmDialog({
                  title: '退出 GitHub Copilot',
                  msg: '您确定要退出 GitHub Copilot 吗？',
                  ok: Dialog.OK,
                  cancel: Dialog.CANCEL
              }).open();
              if (confirmed) {
                  await this.authService.signOut();
              }
            },
            isEnabled: () => this.authState.isAuthenticated,
            isVisible: () => this.isCopilotEnabled()
        });
    }

    protected isCopilotEnabled(): boolean {
        return this.preferenceService.get<boolean>(COPILOT_ENABLED_PREF, true);
    }
}
