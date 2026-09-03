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

import * as React from 'react';
import { DeviceCodeResponse } from './common/copilot-auth-service';
import { CopilotAuthDialogMessages } from './copilot-auth-dialog-messages';
import { AuthDialogState } from './copilot-auth-dialog';

// ========================== UI Props 定义 ==========================
export interface AuthDialogRenderProps {
    state: AuthDialogState;
    deviceCodeResponse?: DeviceCodeResponse;
    errorMessage?: string;
    copied: boolean;
    messages: CopilotAuthDialogMessages;

    onCopyCode: () => Promise<void>;
    onOpenUrl: () => void;
    onOpenTos: () => void;
    onOpenAIConfig: () => void;
    onRetry: () => void;
}

// ========================== 主渲染函数 ==========================
export function renderAuthDialogContent(props: AuthDialogRenderProps) {
    return (
        <div className="theia-copilot-auth-dialog-content">
            {renderContent(props)}
        </div>
    );
}

// ========================== 状态渲染分发 ==========================
function renderContent(props: AuthDialogRenderProps) {
    switch (props.state) {
        case 'loading':
            return renderLoading(props);
        case 'waiting':
            return renderWaiting(props);
        case 'polling':
            return renderPolling(props);
        case 'success':
            return renderSuccess(props);
        case 'error':
            return renderError(props);
        default:
            return null;
    }
}

// ========================== 各状态UI ==========================
function renderLoading(_props: AuthDialogRenderProps) {
    return (
        <div className="theia-copilot-auth-state">
            <div className="theia-spin">
                <span className="codicon codicon-loading"></span>
            </div>
            <p>正在初始化认证流程...</p>
        </div>
    );
}

function renderWaiting(props: AuthDialogRenderProps) {
    const { deviceCodeResponse, copied, messages, onCopyCode, onOpenUrl, onOpenTos } = props;
    if (!deviceCodeResponse) return null;

    return (
        <div className="theia-copilot-auth-waiting">
            <p className="theia-copilot-auth-instructions">
                {messages.instructions}
            </p>

            <div className="theia-copilot-auth-code-section">
                <div className="theia-copilot-auth-code-display">
                    <span className="theia-copilot-auth-code">{deviceCodeResponse.user_code}</span>
                    <button
                        className="theia-button secondary theia-copilot-copy-button"
                        onClick={onCopyCode}
                        title={copied ? '已复制！' : '复制验证码'}
                    >
                        <span className={`codicon ${copied ? 'codicon-check' : 'codicon-copy'}`}></span>
                        {'复制'}
                    </button>
                </div>
            </div>

            <div className="theia-copilot-auth-url-section">
                <button
                    className="theia-button theia-copilot-open-url-button"
                    onClick={onOpenUrl}
                >
                    <span className="codicon codicon-link-external"></span>
                    {'打开 GitHub'}
                </button>
                <a href={deviceCodeResponse.verification_uri} target="_blank" className="theia-copilot-auth-url">{deviceCodeResponse.verification_uri}</a>
            </div>

            <p className="theia-copilot-auth-hint">
                {'输入验证码并完成授权后，请点击下方的“我已完成授权”。'}
            </p>

            <div className="theia-copilot-auth-privacy">
                <p className="theia-copilot-auth-privacy-text">
                    {messages.privacyNotice}
                </p>
                <p className="theia-copilot-auth-tos-text">
                    {'登录即表示你同意 '}
                    <a
                        href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {'GitHub 服务条款'}
                    </a>。
                </p>
            </div>
        </div>
    );
}

function renderPolling(_props: AuthDialogRenderProps) {
    return (
        <div className="theia-copilot-auth-state">
            <div className="theia-spin">
                <span className="codicon codicon-loading"></span>
            </div>
            <p>正在验证授权信息...</p>
        </div>
    );
}

function renderSuccess(props: AuthDialogRenderProps) {
    return (
        <div className="theia-copilot-auth-state theia-copilot-auth-success">
            <span className="codicon codicon-check"></span>
            <p>成功登录 GitHub Copilot！</p>
            <p className="theia-copilot-auth-success-hint">
                如果你的 GitHub 账号拥有 Copilot 访问权限，现在可以在 智能助手 中查看 Copilot 语言模型。
            </p>
        </div>
    );
}

function renderError(props: AuthDialogRenderProps) {
    return (
        <div className="theia-copilot-auth-state theia-copilot-auth-error">
            <span className="codicon codicon-error"></span>
            <p>{props.errorMessage}</p>
            <button
                className="theia-button"
                onClick={props.onRetry}
            >
                重试
            </button>
        </div>
    );
}