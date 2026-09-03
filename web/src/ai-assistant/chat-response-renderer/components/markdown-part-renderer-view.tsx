import React, { ReactNode, useEffect, useRef } from 'react';
import markdownit from 'markdown-it';
import * as markdownitemoji from 'markdown-it-emoji';
import DOMPurify from 'dompurify';
import {
    InformationalChatResponseContent,
    MarkdownChatResponseContent,
} from '@MagicIdea/ai-chat/common';
import { MarkdownString } from '@MagicIdea/core/common/markdown-rendering';
import { OpenerService, open } from '@MagicIdea/core';
import { URI } from '@MagicIdea/core';
import { styled } from 'styled-components';

export const MarkdownRenderContainer = styled.div`
    table {
      margin: 0.5em 0;
      border: 1px solid var(--magic-idea-border-color);
      font-size: 14px;
      line-height: 1.7;
      width: 100%;
      overflow: auto;
      border-collapse: collapse;
      border-spacing: 0;
      box-sizing: border-box;
      color: var(--magic-idea-foreground);
      table-layout: fixed !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      white-space: pre-wrap !important;
    }

    th {
      text-align: center;
      background-color: var(--magic-idea-sidebar-background);
      font-weight: 600;
      border: 1px solid var(--magic-idea-border-color);
      word-break: break-word;
      padding: 10px 6px;
    }

    td {
      padding: 10px 16px;
      border: 1px solid  var(--magic-idea-border-color);
      text-align: left;
      word-break: break-word;
      min-width: 60px;
    }

    tr{
      border: 1px solid var(--magic-idea-border-color);
    }

    tr:hover td {
      background-color: var(---magic-idea-list-hoverBackground) !important;

    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        margin: 0 0 0.25em 0;
        color: var(--magic-idea-foreground);
        font-weight: 600;
    }

    p {
        margin: 0.5em 0;
        line-height: 1.5em;
    }

    p:first-child {
        margin-top: 0px !important;
    }

    p:last-child {
        margin-bottom: 0px !important;
    }

    hr {
        margin: 0.5em 0;
        border: none;
    }

    ul,
    ol {
        margin: 0.8em 0;
        padding-left: 20px;
    }

    a {
        color: var(--magic-idea-link-color);
        text-decoration: underline;
        &:hover {
        color: var(--magic-idea-link-hover-color);
        }
    }

    img {
        max-width: 100%;
        height: auto;
    }

    code {
        font-family: Consolas, "Courier New", monospace;
        padding: 2px 4px;
        border-radius: 4px;
        background: var(--magic-idea-activityBar-background) !important;
    }

    pre {
        margin: 0 !important;
        padding: 8px !important;
        background: var(--magic-idea-editor-background);
        font-size: 14px;
        line-height: 1.5;
        overflow-x: hidden;
        transition: all 0.2s ease;

        &:hover {
            overflow-x: auto;
        }

        code {
            display: block;
            padding: 0;
            background: transparent !important;
            color: inherit !important;
            box-sizing: border-box !important;
            max-width: 100% !important;
            white-space: pre-wrap !important;
            word-break: break-all !important;
            overflow-wrap: break-word !important;
        }
    }
`;

export const MarkdownRender = ({ response, openerService }: { response: MarkdownChatResponseContent | InformationalChatResponseContent | string; openerService: OpenerService }) => {
    let content: string | MarkdownString = '';
    if (typeof response === 'string') {
        content = response;
    } else {
        content = response.content;
    }
    const ref = useMarkdownRendering(content, openerService);

    return <MarkdownRenderContainer ref={ref}></MarkdownRenderContainer>;
};


export interface DeclaredEventsEventListenerObject extends EventListenerObject {
    handledEvents?: (keyof HTMLElementEventMap)[];
}

/**
 * This hook uses markdown-it directly to render markdown.
 * The reason to use markdown-it directly is that the MarkdownRenderer is
 * overridden by theia with a monaco version. This monaco version strips all html
 * tags from the markdown with empty content. This leads to unexpected behavior when
 * rendering markdown with html tags.
 *
 * Moreover, we want to intercept link clicks to use the Theia OpenerService instead of the default browser behavior.
 *
 * @param markdown the string to render as markdown
 * @param skipSurroundingParagraph whether to remove a surrounding paragraph element (default: false)
 * @param openerService the service to handle link opening
 * @param eventHandler `handleEvent` will be called by default for `click` events and additionally
 * for all events enumerated in {@link DeclaredEventsEventListenerObject.handledEvents}. If `handleEvent` returns `true`,
 * no additional handlers will be run for the event.
 * @returns the ref to use in an element to render the markdown
 */
export const useMarkdownRendering = (
    markdown: string | MarkdownString,
    openerService: OpenerService,
    skipSurroundingParagraph: boolean = false,
    eventHandler?: DeclaredEventsEventListenerObject
) => {
    // null is valid in React
    // eslint-disable-next-line no-null/no-null
    const ref = useRef<HTMLDivElement | null>(null);
    const markdownString = typeof markdown === 'string' ? markdown : markdown.value;
    useEffect(() => {
        const markdownIt = markdownit().use(markdownitemoji.full);
        const host = document.createElement('div');

        // markdownIt always puts the content in a paragraph element, so we remove it if we don't want that
        const html = skipSurroundingParagraph ? markdownIt.render(markdownString).replace(/^<p>|<\/p>|<p><\/p>$/g, '') : markdownIt.render(markdownString);

        host.innerHTML = DOMPurify.sanitize(html, {
            // DOMPurify usually strips non http(s) links from hrefs
            // but we want to allow them (see handleClick via OpenerService below)
            ALLOW_UNKNOWN_PROTOCOLS: true
        });
        while (ref?.current?.firstChild) {
            ref.current.removeChild(ref.current.firstChild);
        }
        ref?.current?.appendChild(host);

        // intercept link clicks to use the Theia OpenerService instead of the default browser behavior
        const handleClick = (event: MouseEvent) => {
            if ((eventHandler?.handleEvent(event) as unknown) === true) { return; }
            let target = event.target as HTMLElement;
            while (target && target.tagName !== 'A') {
                target = target.parentElement as HTMLElement;
            }
            if (target && target.tagName === 'A') {
                const href = target.getAttribute('href');
                if (href) {
                    open(openerService, new URI(href));
                    event.preventDefault();
                }
            }
        };

        ref?.current?.addEventListener('click', handleClick);
        eventHandler?.handledEvents?.forEach(eventType => eventType !== 'click' && ref?.current?.addEventListener(eventType, eventHandler));
        return () => {
            ref.current?.removeEventListener('click', handleClick);
            eventHandler?.handledEvents?.forEach(eventType => eventType !== 'click' && ref?.current?.removeEventListener(eventType, eventHandler));
        };
    }, [markdownString, skipSurroundingParagraph, openerService]);

    return ref;
};
