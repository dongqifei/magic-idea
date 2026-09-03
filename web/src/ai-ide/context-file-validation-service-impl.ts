// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
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

import { injectable, inject } from 'inversify';
import { URI } from '@MagicIdea/core';
import { FileSystemService } from '@MagicIdea/core/filesystem';
import { ContextFileValidationService, FileValidationResult, FileValidationState } from '@MagicIdea/ai-chat/context-file-validation-service';

@injectable()
export class ContextFileValidationServiceImpl implements ContextFileValidationService {

    @inject(FileSystemService)
    protected readonly fileService: FileSystemService;

    async validateFile(pathOrUri: string | URI): Promise<FileValidationResult> {
        try {
            if(pathOrUri){
                const resolvedUri = pathOrUri instanceof URI ? pathOrUri : new URI(pathOrUri);
                const exists = await this.fileService.exists(resolvedUri);
                if (!exists) {
                    return {
                        state: FileValidationState.VALID,
                    };
                }
            }
            return {
                state: FileValidationState.INVALID_NOT_FOUND,
                message: 'File does not exist in the workspace'
            };
        } catch (error) {
            return {
                state: FileValidationState.INVALID_NOT_FOUND,
                message: 'File does not exist'
            };
        }
    }
}
