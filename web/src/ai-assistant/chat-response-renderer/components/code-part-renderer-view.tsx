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
import { ContributionProvider, UntitledResourceResolver, URI } from '@MagicIdea/core';
import * as React from 'react';
import { nls } from '@MagicIdea/core/common/nls';
import { EditorManager, EditorWidget } from '@MagicIdea/editor';
import { ShowLightbulbIconMode } from 'monaco-editor/esm/vs/editor/common/config/editorOptions';
import { IMouseEvent } from 'monaco-editor';
import * as monaco from 'monaco-editor';


export const CopyToClipboardButton = (props: { code: string }) => {
    const { code } = props;
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => () => {
        if (timeoutRef.current !== undefined) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    const copyCodeToClipboard = React.useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        if (timeoutRef.current !== undefined) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setCopied(false);
            timeoutRef.current = undefined;
        }, 2000);
    }, [code]);

    const iconClass = copied ? 'codicon-check' : 'codicon-copy';
    const title = copied ? nls.localize('theia/ai/chat-ui/code-part-renderer/copied', 'Copied') : nls.localizeByDefault('Copy');
    return <div className={`button codicon ${iconClass}`} title={title} role='button' onClick={copyCodeToClipboard}></div>;
};

export const InsertCodeAtCursorButton = (props: { code: string, editorManager: EditorManager }) => {
    const { code, editorManager } = props;
    const insertCode = React.useCallback(() => {
        const editor = editorManager.currentEditor;
        if (editor) {
            const currentEditor = editor.editor;
            const selection = currentEditor.selection;

            // Insert the text at the current cursor position
            // If there is a selection, replace the selection with the text
            // currentEditor.executeEdits([{
            //     range: {
            //         start: selection.start,
            //         end: selection.end
            //     },
            //     newText: code
            // }]);
        }
    }, [code, editorManager]);
    return <div className='button codicon codicon-insert' title={nls.localizeByDefault('Insert At Cursor')} role='button' onClick={insertCode}></div>;
};

export const CodePartRendererWrapper = (props: {
    title: React.ReactNode,
    actionNode: React.ReactNode,
    content: string,
    language?: string,
    untitledResourceResolver: UntitledResourceResolver,
    contextMenuCallback: (e: IMouseEvent) => void
}) => {
    const { title, actionNode, content, language, contextMenuCallback, untitledResourceResolver } = props;
    return (
        <div className="theia-CodePartRenderer-root">
        <div className="theia-CodePartRenderer-top">
            <div className="theia-CodePartRenderer-left">{title}</div>
            <div className="theia-CodePartRenderer-right theia-CodePartRenderer-actions">
                {actionNode}
            </div>
        </div>
        <div className="theia-CodePartRenderer-separator"></div>
        <div className="theia-CodePartRenderer-bottom">
            <CodeWrapper
                content={content}
                language={language}
                untitledResourceResolver={untitledResourceResolver}
                contextMenuCallback={contextMenuCallback}></CodeWrapper>
        </div>
    </div>
    );
};

/**
 * Renders the given code within a Monaco Editor
 */
export const CodeWrapper = (props: {
    content: string,
    language?: string,
    untitledResourceResolver: UntitledResourceResolver,
    contextMenuCallback: (e: IMouseEvent) => void
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
    const contentLengthRef = React.useRef<string>('');

    // 创建编辑器
    const createEditor = () => {
        if (!ref.current) return;

        const editor = monaco.editor.create(ref.current, {
            language: props.language || 'plaintext',
            value: props.content,
            readOnly: true,
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            renderFinalNewline: 'off',
            automaticLayout: true,
            minimap: { enabled: false },
            overviewRulerLanes: 0,
            glyphMargin: false,
            lineNumbers: 'off',
            folding: false,
            selectionHighlight: false,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: 'none',
            codeLens: false,
            inlayHints: { enabled: 'off' },
            hover: { enabled: false },
            lightbulb: { enabled: ShowLightbulbIconMode.On },
            scrollbar: {
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                vertical: 'hidden',
                alwaysConsumeMouseWheel: false
            },
        });
        // 自定义右键菜单
        // editor.onContextMenu(e => props.contextMenuCallback(e.event));
        editorRef.current = editor;
        fixEditorHeight(); // 初始化固定高度
    };

    // 根据内容行数设置固定高度
    const fixEditorHeight = () => {
        if (!editorRef.current || !ref.current) return;
        const editor = editorRef.current;

        // 内容没变就不更新（防止循环）
        if (contentLengthRef.current === props.content) return;
        contentLengthRef.current = props.content;

        // 计算内容高度 + 安全边距
        const lineHeight = 18; // 标准行高
        const lines = editor.getModel()?.getLineCount() || 1;
        const padding = 16;
        const finalHeight = Math.min(lines * lineHeight + padding, 1200); // 最大 1200px 防过高

        // 强制给容器固定高度（关键！阻断无限循环）
        ref.current.style.height = `${finalHeight}px`;
        editor.layout({ width: ref.current.clientWidth, height: finalHeight });
    };

    // 挂载
    React.useEffect(() => {
        createEditor();
        return () => {
            editorRef.current?.dispose();
            editorRef.current = undefined;
        };
    }, []);

    // 内容变化 → 仅更新内容 + 重新计算高度
    React.useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setValue(props.content);
            fixEditorHeight();
        }
    }, [props.content]);

    return (
        <div
            ref={ref}
            className='theia-CodeWrapper'
        />
    );
};