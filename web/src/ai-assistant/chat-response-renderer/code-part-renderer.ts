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
import {
    ChatResponseContent,
    CodeChatResponseContent,
} from '@MagicIdea/ai-chat/common';
import { ContributionProvider, UntitledResourceResolver, URI } from '@MagicIdea/core';
import { ContextMenuRenderer, TreeNode } from '@MagicIdea/core';
import { inject, injectable, named } from 'inversify';
import * as React from 'react';
import { createElement } from "react";
import { ReactNode } from 'react';
import { nls } from '@MagicIdea/core/common/nls';
import { Position } from 'vscode-languageserver-protocol';
import { EditorManager, EditorWidget } from '@MagicIdea/editor';
import { ChatResponsePartRenderer } from '../chat-response-part-renderer';
import { ResponseNode } from '../chat-view/chat-view-widget';
import { IMouseEvent } from 'monaco-editor';
import { CodePartRendererWrapper, CopyToClipboardButton, InsertCodeAtCursorButton } from './components/code-part-renderer-view';

export const CodePartRendererAction = Symbol('CodePartRendererAction');
/**
 * The CodePartRenderer offers to contribute arbitrary React nodes to the rendered code part.
 * Technically anything can be rendered, however it is intended to be used for actions, like
 * "Copy to Clipboard" or "Insert at Cursor".
 */
export interface CodePartRendererAction {
    render(response: CodeChatResponseContent, parentNode: ResponseNode): ReactNode;
    /**
     * Determines if the action should be rendered for the given response.
     */
    canRender?(response: CodeChatResponseContent, parentNode: ResponseNode): boolean;
    /**
     *  The priority determines the order in which the actions are rendered.
     *  The default priorities are 10 and 20.
     */
    priority: number;
}

@injectable()
export class CodePartRenderer
    implements ChatResponsePartRenderer<CodeChatResponseContent> {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;
    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    @inject(ContributionProvider) @named(CodePartRendererAction)
    protected readonly codePartRendererActions: ContributionProvider<CodePartRendererAction>;

    canHandle(response: ChatResponseContent): number {
        if (CodeChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: CodeChatResponseContent, parentNode: ResponseNode): ReactNode {
        const language = (response.language?.toLocaleLowerCase() === 'magic' || response.language?.toLocaleLowerCase() === 'magic_script' ) ? 'magicscript' : response.language || undefined;
        return createElement(CodePartRendererWrapper, {
            title: this.renderTitle(response),
            actionNode: this.codePartRendererActions.getContributions()
                .filter(action => action.canRender ? action.canRender(response, parentNode) : true)
                .sort((a, b) => a.priority - b.priority)
                .map(action => action.render(response, parentNode)),
            content: response.code,
            language,
            untitledResourceResolver: this.untitledResourceResolver,
            contextMenuCallback: e => this.handleContextMenuEvent(parentNode, e, response.code)
        });
    }

    protected renderTitle(response: CodeChatResponseContent): ReactNode {
        const uri = response.location?.uri;
        const position = response.location?.position;
        if (uri && position) {
            return createElement(
                'a',
                { onClick: this.openFileAtPosition.bind(this, uri, position) },
                this.getTitle(response.location?.uri, response.language)
            );
            // return <a onClick={this.openFileAtPosition.bind(this, uri, position)}>{this.getTitle(response.location?.uri, response.language)}</a>;
        }
        return this.getTitle(response.location?.uri, response.language);
    }

    private getTitle(uri: URI | undefined, language: string | undefined): string {
        // If there is a URI, use the file name as the title. Otherwise, use the language as the title.
        // If there is no language, use a generic fallback title.
        return uri?.path?.toString().split('/').pop() ?? language ?? nls.localize('theia/ai/chat-ui/code-part-renderer/generatedCode', 'Generated Code');
    }

    /**
     * Opens a file and moves the cursor to the specified position.
     *
     * @param uri - The URI of the file to open.
     * @param position - The position to move the cursor to, specified as {line, character}.
     */
    async openFileAtPosition(uri: URI, position: Position): Promise<void> {
        const editorWidget = await this.editorManager.open(uri) as EditorWidget;
        if (editorWidget) {
            const editor = editorWidget.editor;
            editor.revealPosition(position);
            editor.focus();
            editor.cursor = position;
        }
    }

    protected handleContextMenuEvent(node: TreeNode | undefined, event: IMouseEvent, code: string): void {
        this.contextMenuRenderer.render({
            menuPath: ['chat-tree-context-menu'],
            anchor: { x: event.posx, y: event.posy },
            args: [node, { code }],
            context: event.target
        });
        event.preventDefault();
    }
}

@injectable()
export class CopyToClipboardButtonAction implements CodePartRendererAction {
    priority = 10;
    render(response: CodeChatResponseContent): ReactNode {
        return createElement(CopyToClipboardButton, { code: response.code });
    }
}


@injectable()
export class InsertCodeAtCursorButtonAction implements CodePartRendererAction {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    priority = 20;
    render(response: CodeChatResponseContent): ReactNode {
        return createElement(InsertCodeAtCursorButton, { code: response.code, editorManager: this.editorManager });
    }
}
