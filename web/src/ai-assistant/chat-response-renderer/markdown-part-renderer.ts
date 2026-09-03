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

import { ChatResponsePartRenderer } from '../chat-response-part-renderer';
import { inject, injectable } from 'inversify';
import {
    ChatResponseContent,
    InformationalChatResponseContent,
    MarkdownChatResponseContent,
} from '@MagicIdea/ai-chat/common';
import { ReactNode, useEffect, useRef } from 'react';
import { createElement } from "react";
import { OpenerService, open } from '@MagicIdea/core/';
import { MarkdownRender } from './components/markdown-part-renderer-view';


@injectable()
export class MarkdownPartRenderer implements ChatResponsePartRenderer<MarkdownChatResponseContent | InformationalChatResponseContent> {
    @inject(OpenerService) protected readonly openerService: OpenerService;
    canHandle(response: ChatResponseContent): number {
        if (MarkdownChatResponseContent.is(response)) {
            return 10;
        }
        if (InformationalChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }
    render(response: MarkdownChatResponseContent | InformationalChatResponseContent): ReactNode {
        // TODO let the user configure whether they want to see informational content
        if (InformationalChatResponseContent.is(response)) {
            // null is valid in React
            // eslint-disable-next-line no-null/no-null
            return null;
        }
        return createElement(MarkdownRender, {
            response: response,
            openerService: this.openerService,
        });
    }
}

