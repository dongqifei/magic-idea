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

import { ChatModel, ResponseTokenUsage } from '@MagicIdea/ai-chat/common';
import { nls } from '@MagicIdea/core/common/nls';
import { MarkdownString } from '@MagicIdea/core/common/markdown-rendering';

/**
 * Provisional context window size used as the denominator for the indicator bar
 * fill and the tooltip's "Total: X / Y" display until per-model context sizes
 * are available. See issue #17323 comments for context.
 */
export const CHAT_CONTEXT_WINDOW_SIZE = 262144;

export type TokenUsageWarningDecision = 'notify' | 'reset' | 'skip';

/** Returns true when the given total has crossed (>=) the configured warning threshold. */
export function isAboveTokenUsageWarningThreshold(totalTokens: number, threshold: number): boolean {
    return totalTokens > 0 && totalTokens >= threshold;
}

/**
 * Pure decision function for whether to show the token usage warning for a session.
 * Callers are expected to short-circuit before invoking this when the warning feature
 * is disabled, so this helper is not concerned with the enabled state.
 * - `reset`: usage is below the threshold; any prior "already notified" state for this session should be cleared.
 * - `skip`:  we already notified for this session while still above the threshold.
 * - `notify`: warning should be shown now and the session marked as notified.
 */
export function decideTokenUsageWarning(args: {
    totalTokens: number;
    threshold: number;
    alreadyNotified: boolean;
}): TokenUsageWarningDecision {
    if (!isAboveTokenUsageWarningThreshold(args.totalTokens, args.threshold)) {
        return 'reset';
    }
    if (args.alreadyNotified) {
        return 'skip';
    }
    return 'notify';
}

export function formatTokenCount(count: number | undefined): string {
    if (count === undefined || count === 0) {
        return '-';
    }
    if (count >= 1024) {
        return `${(count / 1024).toFixed(1)}k`;
    }
    return count.toString();
}

/**
 * Returns the CSS class for the token usage indicator based on the current
 * total, the configured warning threshold, and the assumed context window size.
 * Yellow band: [threshold, contextWindowSize). Red band: [contextWindowSize, ∞).
 */
export function getUsageColorClass(totalTokens: number, threshold: number, contextWindowSize: number = CHAT_CONTEXT_WINDOW_SIZE): string {
    if (totalTokens === 0) {
        return 'token-usage-none';
    }
    if (totalTokens < threshold) {
        return 'token-usage-green';
    }
    if (totalTokens < contextWindowSize) {
        return 'token-usage-yellow';
    }
    return 'token-usage-red';
}

export function computeSessionTokenUsage(chatModel?: ChatModel): number {
    if (!chatModel) {
        return 0;
    }
    const requests = chatModel.getRequests();
    for (let i = requests.length - 1; i >= 0; i--) {
        const usage: ResponseTokenUsage | undefined = requests[i].response.tokenUsage;
        if (usage) {
            return usage.inputTokens
                + usage.outputTokens
                + (usage.cacheCreationInputTokens ?? 0)
                + (usage.cacheReadInputTokens ?? 0);
        }
    }
    return 0;
}

export function getLatestTokenUsage(chatModel?: ChatModel): ResponseTokenUsage | undefined {
    if (!chatModel) {
        return undefined;
    }
    const requests = chatModel.getRequests();
    for (let i = requests.length - 1; i >= 0; i--) {
        const usage = requests[i].response.tokenUsage;
        if (usage) {
            return usage;
        }
    }
    return undefined;
}

export function buildBarTooltip(usage: ResponseTokenUsage | undefined, totalTokens: number, threshold: number): MarkdownString | undefined {
    if (!usage) {
        return undefined;
    }
    const lines: string[] = [
        `**${nls.localize('theia/ai/chat-ui/tokenUsageLabel', '上下文使用率')}**`
    ];
    const colorClass = getUsageColorClass(totalTokens, threshold);
    if (colorClass === 'token-usage-yellow') {
        lines.push(`⚠ ${nls.localize('theia/ai/chat-ui/tokenUsageWarning', '已达到令牌使用警告阈值。')}`, '');
    } else if (colorClass === 'token-usage-red') {
        lines.push(`⚠ ${nls.localize('theia/ai/chat-ui/tokenUsageOverflow', '令牌使用量远远超过警告阈值。考虑压缩或启动新会话。')}`, '');
    }
    lines.push(`${nls.localizeByDefault('输入: {0}',
        formatTokenCount(usage.inputTokens))} | ${nls.localizeByDefault('输入: {0}',
            formatTokenCount(usage.outputTokens))}`);
    const cacheParts: string[] = [];
    if (usage.cacheReadInputTokens) {
        cacheParts.push(nls.localize('theia/ai/chat-ui/tokenUsageTooltipCacheRead', '读取缓存：{0}', formatTokenCount(usage.cacheReadInputTokens)));
    }
    if (usage.cacheCreationInputTokens) {
        cacheParts.push(nls.localize('theia/ai/chat-ui/tokenUsageTooltipCacheCreate', '写入缓存：{0}', formatTokenCount(usage.cacheCreationInputTokens)));
    }
    if (cacheParts.length > 0) {
        lines.push(cacheParts.join(' | '));
    }
    const percentage = Math.round((totalTokens / CHAT_CONTEXT_WINDOW_SIZE) * 100);
    lines.push(nls.localize(
        'theia/ai/chat-ui/tokenUsageTooltipTotal',
        '总计: {0} / {1} ({2}%)',
        formatTokenCount(totalTokens),
        formatTokenCount(CHAT_CONTEXT_WINDOW_SIZE),
        percentage
    ));
    return { value: lines.join('  \n') };
}
