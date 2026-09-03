// *****************************************************************************
// Copyright (C) 2018 TypeFox and others.
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

import { JSONValue } from '@lumino/coreutils';
import { JSONSchema7 } from 'json-schema';

export type JsonType = 'string' | 'array' | 'number' | 'integer' | 'object' | 'boolean' | 'null';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// copied from https://github.com/Microsoft/vscode/blob/d4edb9abcc261846cabee6702715fe2914ae42cb/src/vs/base/common/jsonSchema.ts

// Keep tab indent for easier comparison with the original file.
/* eslint-disable @typescript-eslint/indent */

/**
 * extended JSON schema
 */
export interface IJSONSchema extends JSONSchema7 {
}

export interface IJSONSchemaMap {
    [name: string]: IJSONSchema;
}

export interface IJSONSchemaSnippet {
    label?: string;
    description?: string;
    body?: JSONValue; // a object that will be JSON stringified
    bodyText?: string; // an already stringified JSON object that can contain new lines (\n) and tabs (\t)
}
