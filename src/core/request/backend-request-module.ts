/********************************************************************************
 * Copyright (C) 2022 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
 ********************************************************************************/

import { decorate, injectable, interfaces } from "inversify";
import { RequestService, REQUEST_SERVICE_PATH } from "./common-request-service";
import { NodeRequestService } from "./node-request-service";
import { BackendRequestFacade } from "./backend-request-facade";
import { ConnectionHandler, RpcConnectionHandler } from '../common';

decorate(injectable(), NodeRequestService);

export function bindRequestBackendModule(bind: interfaces.Bind): void {
  bind(RequestService).to(NodeRequestService).inSingletonScope();

  bind(BackendRequestFacade).toSelf().inSingletonScope();
  bind(ConnectionHandler)
    .toDynamicValue(
      (ctx) =>
        new RpcConnectionHandler(REQUEST_SERVICE_PATH, () =>
          ctx.container.get(BackendRequestFacade),
        ),
    )
    .inSingletonScope();
}
