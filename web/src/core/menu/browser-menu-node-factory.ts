import { injectable, inject } from 'inversify';
import { CommandRegistry } from "@lumino/commands";
import {
    ActionMenuNode, CommandMenu, Group, GroupImpl, MenuAction, MenuNode, MenuNodeFactory,
    MutableCompoundMenuNode, SubMenuLink, Submenu, SubmenuImpl
} from '../common/menu';
import { ContextKeyService } from '../context-key-service';
import { KeybindingRegistry } from '../keybinding';

@injectable()
export class BrowserMenuNodeFactory implements MenuNodeFactory {
    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;
    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;
    @inject(KeybindingRegistry)
    protected readonly keybindingRegistry: KeybindingRegistry;

    createGroup(id: string, orderString?: string, when?: string): Group & MutableCompoundMenuNode {
        return new GroupImpl(id, orderString, when);
    }

    createCommandMenu(item: MenuAction): CommandMenu {
        return new ActionMenuNode(item, this.commandRegistry, this.keybindingRegistry, this.contextKeyService);
    }
    createSubmenu(id: string, label: string, contextKeyOverlays: Record<string, string> | undefined, orderString?: string, icon?: string, when?: string):
        Submenu & MutableCompoundMenuNode {
        return new SubmenuImpl(id, label, contextKeyOverlays, orderString, icon, when);
    }
    createSubmenuLink(delegate: Submenu, sortString?: string, when?: string): MenuNode {
        return new SubMenuLink(delegate, sortString, when);
    }
}
