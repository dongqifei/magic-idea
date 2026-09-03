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
import { CommandRegistry, MenuModelRegistry, AbstractViewContribution, PreferenceService, CommonMenus, Widget } from '@MagicIdea/core';
import { KeybindingRegistry } from '@MagicIdea/core/keybinding';
import { inject, injectable, postConstruct } from 'inversify';
import { AICommandHandlerFactory } from './ai-command-handler-factory';

@injectable()
export class AIViewContribution<T extends Widget> extends AbstractViewContribution<T> {

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(AICommandHandlerFactory)
    protected readonly commandHandlerFactory: AICommandHandlerFactory;

    @postConstruct()
    protected init(): void {
    }

    override registerCommands(commands: CommandRegistry): void {
        if (this.toggleCommand) {
            const options = this.commandHandlerFactory({
                label: this.toggleCommand.label,
                iconClass: this.toggleCommand.iconClass,
                execute: () => this.toggleView(),
            })
            commands.addCommand(this.toggleCommand.id, options);
        }
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.toggleCommand) {
            menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
                commandId: this.toggleCommand.id,
                label: this.viewLabel
            });
        }
    }
    registerKeybindings(keybindings: KeybindingRegistry): void {
        if (this.toggleCommand && this.options.toggleKeybinding) {
            keybindings.registerKeybinding({
                command: this.toggleCommand.id,
                keybinding: this.options.toggleKeybinding
            });
        }
    }
}

