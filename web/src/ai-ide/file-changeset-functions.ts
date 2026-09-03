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
import { assertChatContext, ChatToolContext } from '@MagicIdea/ai-chat/common';
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@MagicIdea/ai-core';

import { inject, injectable } from 'inversify';
import { URI } from '@MagicIdea/core/common';
import { FileSystemService as FileService } from '@MagicIdea/core/filesystem';

import { extractJsonStringField } from '@MagicIdea/ai-assistant/chat-response-renderer/toolcall-utils';
import {
    CLEAR_FILE_CHANGES_ID,
    GET_PROPOSED_CHANGES_ID,
    SUGGEST_FILE_CONTENT_ID,
    SUGGEST_FILE_REPLACEMENTS_ID,
    WRITE_FILE_CONTENT_ID,
    WRITE_FILE_REPLACEMENTS_ID,
    SUGGEST_FILE_REPLACEMENTS_SIMPLE_ID,
    WRITE_FILE_REPLACEMENTS_SIMPLE_ID
} from './common/file-changeset-function-ids';

function createPathShortLabel(args: string, hasMore: boolean): { label: string; hasMore: boolean } | undefined {
    const path = extractJsonStringField(args, 'path');
    if (path) {
        return { label: path, hasMore };
    }
    return undefined;
}

@injectable()
export class WriteFileContent implements ToolProvider {
    static ID = WRITE_FILE_CONTENT_ID;

    @inject(FileService)
    fileService: FileService;

    getTool(): ToolRequest {
        return {
            id: WriteFileContent.ID,
            name: WriteFileContent.ID,
            description: `Immediately writes complete content to a file WITHOUT user confirmation. If the file exists, it will be overwritten.
             If the file does not exist, it will be created. This tool will automatically create any directories needed to write the file.
             If the new content is empty, the file will be deleted. To move a file, delete it and re-create it at the new location.
             Use this for creating new files or complete file rewrites in agent mode.
             CAUTION: Changes are applied immediately and cannot be undone through the chat interface.`,
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'provide the full file URI with protocol (e.g. file:///path/to/file) .'
                    },
                    content: {
                        type: 'string',
                        description: `The COMPLETE content to write to the file. You MUST include ALL parts of the file, even if they haven't been modified.
                         Do not truncate or omit any sections. Use empty string "" to delete the file.`
                    }
                },
                required: ['path', 'content']
            },
            handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
                assertChatContext(ctx);
                if (ctx.cancellationToken?.isCancellationRequested) {
                    return JSON.stringify({ error: 'Operation cancelled by user' });
                }
                const { path, content } = JSON.parse(args);
                // console.log('writeFile', path, content);
                // const chatSessionId = ctx.request.session.id;
                let targetUri: URI | undefined = URI.fromFilePath(path);
                let type = 'modify';
                if (content === '') {
                    type = 'delete';
                }
                if (!(await this.fileService.exists(targetUri))) {
                    type = 'add';
                }

                // const fileElement = this.fileChangeFactory({
                //     uri: uri,
                //     type: type as 'modify' | 'add' | 'delete',
                //     state: 'pending',
                //     targetState: content,
                //     requestId: ctx.request.id,
                //     chatSessionId
                // });

                // ctx.request.session.changeSet.setTitle(this.fileChangeSetTitleProvider.getChangeSetTitle(ctx));
                // ctx.request.session.changeSet.addElements(fileElement);

                // console.log('WriteFileContent', type, content);
                try {
                    if(type === 'add'){
                    }else if(type === 'modify'){
                        await this.fileService.updateProperty(targetUri, {
                            script: content
                        });
                    }else{
                    }
                    return `Successfully wrote content to file ${path}.`;
                } catch (error) {
                    return `Failed to write content to file ${path}: ${error.message}`;
                }
            },
            getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
        };
    }
}

// @injectable()
// export class WriteFileReplacements implements ToolProvider {
//     static ID = WRITE_FILE_REPLACEMENTS_ID;

//     @inject(ReplaceContentInFileFunctionHelperV2)
//     protected readonly replaceContentInFileFunctionHelper: ReplaceContentInFileFunctionHelperV2;

//     getTool(): ToolRequest {
//         const metadata = this.replaceContentInFileFunctionHelper.getToolMetadata(true, true);
//         return {
//             id: WriteFileReplacements.ID,
//             name: WriteFileReplacements.ID,
//             description: `Immediately replaces sections of content in an existing file — changes are applied to disk without user confirmation.
//             Each replacement consists of oldContent to be matched and newContent to insert in its place.
//             By default, a single occurrence of each oldContent is expected. If the 'multiple' flag is set to true, all occurrences will be replaced.
//             For deletions, use an empty newContent.
//             Make sure you use the same line endings and whitespace as in the original file content.
//             Multiple calls for the same file will merge replacements unless the reset parameter is set to true.

//             IMPORTANT: Each oldContent must appear exactly once in the file (unless 'multiple' is true).
//             If you see "Expected 1 occurrence but found X" errors:
//             - If found 0: The content doesn't exist, has different whitespace/indentation, or the file changed. Re-read the file first.
//             - If found 2+: Add more surrounding lines to oldContent to make it unique.
//             Common mistakes: Missing/extra trailing newlines, wrong indentation, outdated content.
//             Always read the file with getFileContent before attempting replacements.`,
//             parameters: metadata.parameters,
//             handler: async (args: string, ctx?: ToolInvocationContext): Promise<string> => {
//                 assertChatContext(ctx);
//                 if (ctx.cancellationToken?.isCancellationRequested) {
//                     return JSON.stringify({ error: 'Operation cancelled by user' });
//                 }
//                 return this.replaceContentInFileFunctionHelper.writeChangesetFromToolCall(args, ctx);
//             },
//             getArgumentsShortLabel: (args: string) => createPathShortLabel(args, true),
//         };
//     }
// }

