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
import { QuestionResponseContent } from '@MagicIdea/ai-chat/common';
import { nls } from '@MagicIdea/core';
import { codicon, OpenerService } from '@MagicIdea/core';
import * as React from 'react';
import { ReactNode } from 'react';
import { ResponseNode } from '../../chat-view/chat-view-widget';
import { useMarkdownRendering } from './markdown-part-renderer-view';

// 工具函数：判断问题是否已处理
export function isResolved(question: QuestionResponseContent): boolean {
    return question.selectedOptions !== undefined;
}

// 工具函数：跳过问题
export function skipQuestion(question: QuestionResponseContent): void {
    if (question.isReadOnly) {
        return;
    }
    question.selectedOptions = [];
    if (question.multiSelect) {
        if (question.handler) {
            (question.handler as any)([]);
        }
    } else {
        question.onSkip?.();
    }
}

// 工具函数：判断选项是否选中
export function isOptionSelected(question: QuestionResponseContent, option: { text: string }): boolean {
    return question.selectedOptions?.some(s => s.text === option.text) === true;
}

// 关闭按钮组件
export function DismissButton({ question, disabled }: { question: QuestionResponseContent, disabled: boolean }): ReactNode {
    if (disabled) {
        return null;
    }
    return (
        <button
            className={`theia-QuestionPartRenderer-dismiss ${codicon('close')}`}
            onClick={() => skipQuestion(question)}
            title={nls.localizeByDefault('Dismiss')}
        />
    );
}

// 单选问题组件
export function SingleSelectQuestion({ question, node, openerService }: {
    question: QuestionResponseContent, node: ResponseNode, openerService: OpenerService
}): React.JSX.Element {
    const isDisabled = question.isReadOnly || isResolved(question) || !node.response.isWaitingForInput;
    const hasDescriptions = question.options.some(option => option.description);
    const questionRef = useMarkdownRendering(question.question, openerService);

    return (
        <div className="theia-QuestionPartRenderer-root">
            {question.onSkip && <DismissButton question={question} disabled={isDisabled} />}
            {question.header && <div className="theia-QuestionPartRenderer-header">{question.header}</div>}
            <div className="theia-QuestionPartRenderer-question" ref={questionRef} />
            <div className={`theia-QuestionPartRenderer-options ${hasDescriptions ? 'has-descriptions' : ''}`}>
                {
                    question.options.map((option, index) => (
                        <button
                            className={`theia-QuestionPartRenderer-option ${isOptionSelected(question, option) ? 'selected' : ''}`}
                            onClick={() => {
                                if (!question.isReadOnly && question.handler) {
                                    question.selectedOption = option;
                                    (question.handler as any)(option);
                                }
                            }}
                            disabled={isDisabled}
                            key={index}
                        >
                            <span className="theia-QuestionPartRenderer-option-label">{option.text}</span>
                            {option.description && (
                                <span className="theia-QuestionPartRenderer-option-description">{option.description}</span>
                            )}
                        </button>
                    ))
                }
            </div>
        </div>
    );
}

// 多选问题组件
export function MultiSelectQuestion({ question, node, openerService }: {
    question: QuestionResponseContent, node: ResponseNode, openerService: OpenerService
}): React.JSX.Element {
    const questionRef = useMarkdownRendering(question.question, openerService);
    const restoredIndices = React.useMemo(() => {
        if (question.selectedOptions && question.selectedOptions.length > 0) {
            const indices = new Set<number>();
            for (const selected of question.selectedOptions) {
                const idx = question.options.findIndex(o => o.text === selected.text);
                if (idx >= 0) {
                    indices.add(idx);
                }
            }
            return indices;
        }
        return new Set<number>();
    }, []);

    const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(restoredIndices);
    const [confirmed, setConfirmed] = React.useState(isResolved(question));
    const isDisabled = question.isReadOnly || confirmed || !node.response.isWaitingForInput;
    const hasDescriptions = question.options.some(option => option.description);

    const toggleOption = React.useCallback((index: number): void => {
        if (isDisabled) {
            return;
        }
        setSelectedIndices(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    }, [isDisabled]);

    const handleConfirm = React.useCallback((): void => {
        if (isDisabled || selectedIndices.size === 0) {
            return;
        }
        const selectedOpts = Array.from(selectedIndices).sort().map(i => question.options[i]);
        question.selectedOptions = selectedOpts;
        setConfirmed(true);
        question.handler?.(selectedOpts);
    }, [isDisabled, selectedIndices]);

    return (
        <div className="theia-QuestionPartRenderer-root">
            <DismissButton question={question} disabled={isDisabled} />
            {question.header && <div className="theia-QuestionPartRenderer-header">{question.header}</div>}
            <div className="theia-QuestionPartRenderer-question" ref={questionRef} />
            <div className={`theia-QuestionPartRenderer-options ${hasDescriptions ? 'has-descriptions' : ''}`}>
                {question.options.map((option, index) => (
                    <button
                        className={`theia-QuestionPartRenderer-option ${selectedIndices.has(index) ? 'selected' : ''}`}
                        onClick={() => toggleOption(index)}
                        disabled={isDisabled}
                        key={index}
                    >
                        <span className="theia-QuestionPartRenderer-option-label">{option.text}</span>
                        {option.description && (
                            <span className="theia-QuestionPartRenderer-option-description">{option.description}</span>
                        )}
                    </button>
                ))}
            </div>
            {!isDisabled && (
                <button
                    className="theia-QuestionPartRenderer-confirm theia-button main"
                    onClick={handleConfirm}
                    disabled={selectedIndices.size === 0}
                >
                    {nls.localize('theia/ai-chat-ui/confirm', 'Confirm')}
                </button>
            )}
        </div>
    );
}