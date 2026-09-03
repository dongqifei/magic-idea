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
import { ToolInvocationContext, ToolProvider, ToolRequest } from '@MagicIdea/ai-core';
import { CancellationToken, Disposable, PreferenceService, URI, Path } from '@MagicIdea/core';
import { inject, injectable } from 'inversify';
import { FileSystemService as FileService } from '@MagicIdea/core/filesystem';
import { FileData } from '@MagicIdea/core/filesystem';
// import { WorkspaceService } from '@MagicIdea/workspace/lib/browser';
import {
    FILE_CONTENT_FUNCTION_ID, GET_FILE_DIAGNOSTICS_ID,
    GET_WORKSPACE_DIRECTORY_STRUCTURE_FUNCTION_ID,
    GET_WORKSPACE_FILE_LIST_FUNCTION_ID, FIND_FILES_BY_PATTERN_FUNCTION_ID
} from './common/workspace-functions';
import { extractJsonStringField } from '@MagicIdea/ai-assistant/chat-response-renderer/toolcall-utils';
// import ignore from 'ignore';
// import { Minimatch } from 'minimatch';
// import { CONSIDER_GITIGNORE_PREF, FILE_CONTENT_MAX_SIZE_KB_PREF, USER_EXCLUDE_PATTERN_PREF } from './common/workspace-preferences';
// import { MonacoWorkspace } from '@theia/monaco/lib/browser/monaco-workspace';
// import { MonacoTextModelService } from '@MagicIdea/monaco/lib/browser/monaco-text-model-service';
// import { ProblemManager } from '@MagicIdea/markers/lib/browser';
// import { DiagnosticSeverity, Range } from 'vscode-languageserver-protocol';

@injectable()
export class FileContentFunction implements ToolProvider {
    static ID = FILE_CONTENT_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: FileContentFunction.ID,
            name: FileContentFunction.ID,
            description: 'Returns the content of a specified file within the workspace as a raw string. ' +
                'You MUST use this tool immediately for ANY file listed in the "Provided Files" context. ' +
                'The `file` parameter MUST be exactly the relative path shown in the file list (e.g., "folder/file.ms?resourceType=type&resourceId=xxx"). ' +
                'Do NOT modify the path and query parameters. ' +
                'IMPORTANT: You must call this tool on EVERY user turn where files are provided, even if you have previously retrieved the same file. Do not cache file contents across turns.'+
                'You MUST NOT answer the user until you have retrieved the content of all provided files.',
            parameters: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        description: 'The exact relative path from the workspace root, as shown in the file list. ' +
                            'Example: "folder/file.ms?resourceType=type&resourceId=xxx)". Must NOT be a URI or absolute path.',
                    }
                },
                required: ['file']
            },
            handler: (arg_string: string, ctx?: ToolInvocationContext) => {
                const { file } = this.parseArg(arg_string);
                return this.getFileContent(file, ctx?.cancellationToken);
            },
            providerName: undefined,
            getArgumentsShortLabel: (args: string): { label: string; hasMore: boolean } | undefined => {
                try {
                    const parsed = JSON.parse(args);
                    if (parsed && typeof parsed === 'object' && 'file' in parsed) {
                        return { label: String(parsed.file), hasMore: false };
                    }
                } catch {
                    const file = extractJsonStringField(args, 'file');
                    if (file) {
                        return { label: file, hasMore: false };
                    }
                }
                return undefined;
            },
        };
    }

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    private parseArg(arg_string: string): { file: string; offset?: number; limit?: number } {
        const result = JSON.parse(arg_string);
        return { file: result.file, offset: result.offset, limit: result.limit };
    }

    private async getFileContent(file: string, cancellationToken?: CancellationToken): Promise<string> {
        if (cancellationToken?.isCancellationRequested) {
            return JSON.stringify({ error: 'Operation cancelled by user' });
        }
        if(!file){
            return JSON.stringify({ error: 'The file path is invalid' });
        }
        let targetUri: URI = URI.parse(file);

        if (cancellationToken?.isCancellationRequested) {
            return JSON.stringify({ error: 'Operation cancelled by user' });
        }

        return this.readStreamedSlice(targetUri)
    }

    private async readStreamedSlice(
        targetUri: URI): Promise<string> {
        try {
            const streamValue: FileData = await this.fileService.readFile(targetUri);
            return JSON.stringify({streamValue})
        } catch (e) {
            return JSON.stringify({ error: 'File not found' });
        }
    }
}
