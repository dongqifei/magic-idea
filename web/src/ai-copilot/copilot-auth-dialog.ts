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
import { DialogProps, DialogError } from '@MagicIdea/core/browser/dialogs';
import { ReactDialog } from '@MagicIdea/core/dialogs/react-dialog';
import { CommandRegistry } from '@MagicIdea/core/commands';
import { WindowService } from '@MagicIdea/core/window/window-service';
import { CopilotAuthService, DeviceCodeResponse } from './common/copilot-auth-service';
import { CopilotAuthDialogMessages } from './copilot-auth-dialog-messages';
import { renderAuthDialogContent } from './copilot-auth-dialog-views';

export const OPEN_AI_CONFIG_VIEW_COMMAND = 'aiConfiguration:open';

export type AuthDialogState = 'loading' | 'waiting' | 'polling' | 'success' | 'error';

@injectable()
export class CopilotAuthDialogProps extends DialogProps {
    enterpriseUrl?: string;
}

@injectable()
export class CopilotAuthDialog extends ReactDialog<boolean> {

    @inject(CopilotAuthService)
    protected readonly authService: CopilotAuthService;

    @inject(CommandRegistry)
    protected readonly commandService: CommandRegistry;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(CopilotAuthDialogMessages)
    protected readonly messages: CopilotAuthDialogMessages;

    protected state: AuthDialogState = 'loading';
    protected deviceCodeResponse?: DeviceCodeResponse;
    protected errorMessage?: string;
    protected copied = false;

    static readonly ID = 'copilot-auth-dialog';

    constructor(
        @inject(CopilotAuthDialogProps) protected override readonly props: CopilotAuthDialogProps
    ) {
        super(props);
    }

    @postConstruct()
    protected init(): void {
        this.titleNode.textContent = this.props.title;
        this.appendAcceptButton('我已授权');
        this.appendCloseButton('取消');
    }

    protected updateButtonStates(): void {
        const isPolling = this.state === 'polling';
        const isSuccess = this.state === 'success';
        if (this.acceptButton) {
            this.acceptButton.disabled = isPolling || isSuccess;
            if (isSuccess) {
                this.acceptButton.style.display = 'none';
            }
        }
        if (this.closeButton) {
            if (isSuccess) {
                this.closeButton.textContent = '关闭';
            }
        }
    }

    override async open(): Promise<boolean | undefined> {
        this.initiateFlow();
        return super.open();
    }

    override update(): void {
        super.update();
        this.updateButtonStates();
    }

    protected async initiateFlow(): Promise<void> {
        try {
            this.state = 'loading';
            this.update();

            this.deviceCodeResponse = await this.authService.initiateDeviceFlow(this.props.enterpriseUrl);
            this.state = 'waiting';
            this.update();
        } catch (error) {
            this.state = 'error';
            this.errorMessage = error instanceof Error ? error.message : String(error);
            this.update();
        }
    }

    protected override async accept(): Promise<void> {
        if (this.state !== 'waiting' || !this.deviceCodeResponse) {
            return;
        }

        this.state = 'polling';
        this.update();

        try {
            const success = await this.authService.pollForToken(
                this.deviceCodeResponse.device_code,
                this.deviceCodeResponse.interval,
                this.props.enterpriseUrl
            );

            if (success) {
                this.state = 'success';
                this.update();
            } else {
                this.state = 'error';
                this.errorMessage = '授权已过期或被拒绝。请重试。';
                this.update();
            }
        } catch (error) {
            this.state = 'error';
            this.errorMessage = error instanceof Error ? error.message : String(error);
            this.update();
        }
    }

    get value(): boolean {
        return this.state === 'success';
    }

    protected override isValid(_value: boolean, _mode: DialogError): DialogError {
        if (this.state === 'error') {
            return this.errorMessage ?? '发生错误';
        }
        return '';
    }

    protected handleCopyCode = async (): Promise<void> => {
        if (this.deviceCodeResponse) {
            this.copied = true;
            await navigator.clipboard.writeText(this.deviceCodeResponse.user_code);
            this.update();
            setTimeout(() => {
                this.copied = false;
                this.update();
            }, 2000);
        }
    };

    protected handleOpenUrl = (): void => {
        if (this.deviceCodeResponse) {
            this.windowService.openNewWindow(this.deviceCodeResponse.verification_uri, { external: true });
        }
    };

    protected handleOpenTos = (): void => {
        this.windowService.openNewWindow('https://docs.github.com/en/site-policy/github-terms/github-terms-of-service', { external: true });
    };


    protected handleOpenAIConfig = (): void => {
        this.commandService.execute(OPEN_AI_CONFIG_VIEW_COMMAND);
    };

    protected handleRetry = (): void => {
        this.initiateFlow();
    };

    protected render() {
        return renderAuthDialogContent({
            state: this.state,
            deviceCodeResponse: this.deviceCodeResponse,
            errorMessage: this.errorMessage,
            copied: this.copied,
            messages: this.messages,
            onCopyCode: this.handleCopyCode,
            onOpenUrl: this.handleOpenUrl,
            onOpenTos: this.handleOpenTos,
            onOpenAIConfig: this.handleOpenAIConfig,
            onRetry: this.handleRetry
        });
    }
}