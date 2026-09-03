import { CommandRegistry } from "@lumino/commands";
import { CommandMenu, Group, MenuAction, MenuNode, MenuNodeFactory, MutableCompoundMenuNode, Submenu } from '../common/menu';
import { ContextKeyService } from '../context-key-service';
import { KeybindingRegistry } from '../keybinding';
export declare class BrowserMenuNodeFactory implements MenuNodeFactory {
    protected readonly contextKeyService: ContextKeyService;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly keybindingRegistry: KeybindingRegistry;
    createGroup(id: string, orderString?: string, when?: string): Group & MutableCompoundMenuNode;
    createCommandMenu(item: MenuAction): CommandMenu;
    createSubmenu(id: string, label: string, contextKeyOverlays: Record<string, string> | undefined, orderString?: string, icon?: string, when?: string): Submenu & MutableCompoundMenuNode;
    createSubmenuLink(delegate: Submenu, sortString?: string, when?: string): MenuNode;
}
