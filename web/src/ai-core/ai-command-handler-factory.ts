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

import { CommandRegistry } from "@lumino/commands";
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';

export interface AICommandHandler extends CommandRegistry.ICommandOptions {
  execute: (args: ReadonlyPartialJSONObject) => void;
  isEnabled?: (args: ReadonlyPartialJSONObject) => boolean;
  isVisible?: (args: ReadonlyPartialJSONObject) => boolean;
  isToggled?: (args: ReadonlyPartialJSONObject) => boolean;
}

export type AICommandHandlerFactory = (handler: AICommandHandler) => AICommandHandler;
export const AICommandHandlerFactory = Symbol('AICommandHandlerFactory');
