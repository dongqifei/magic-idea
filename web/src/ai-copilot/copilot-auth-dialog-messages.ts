// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH and others.
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

export const CopilotAuthDialogMessages = Symbol('CopilotAuthDialogMessages');

/**
 * Localizable messages displayed in the {@link CopilotAuthDialog}.
 * Bind this symbol to a custom value in your frontend container module to replace
 * any message that references "Theia" with your own application name.
 */
export interface CopilotAuthDialogMessages {
    /** Dialog title. */
    readonly title: string;
    /** Instructions shown while waiting for the user to enter the code on GitHub. */
    readonly instructions: string;
    /** Privacy notice shown below the authorization code. */
    readonly privacyNotice: string;
}

/**
 * Default messages for the built-in Theia Copilot integration.
 */
export const DEFAULT_COPILOT_AUTH_DIALOG_MESSAGES: CopilotAuthDialogMessages = {
    get title(): string {
        return '登录 GitHub Copilot';
    },
    get instructions(): string {
        return '要授权 MagicIDEA 使用 GitHub Copilot，请访问以下网址并输入代码：';
    },
    get privacyNotice(): string {
        return '我们仅请求访问您的GitHub用户名以连接到GitHub Copilot服务——不会访问或存储任何其他数据。';
    }
};
