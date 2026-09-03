import { ContributionProvider } from "../common/contribution-provider";
import { ContextKeyService } from '../context-key-service';
import { CommandRegistry } from "@lumino/commands";
import { Keybinding } from "./keybinding-type";
export declare const KeybindingContribution: unique symbol;
/**
 * Allows extensions to contribute {@link common.Keybinding}s
 */
export interface KeybindingContribution {
    /**
     * Registers keybindings.
     * @param keybindings the keybinding registry.
     */
    registerKeybindings(keybindings: KeybindingRegistry): void;
}
export declare class KeybindingRegistry {
    private contextKeyService;
    private commandRegistry;
    protected readonly contributionProvider: ContributionProvider<KeybindingContribution>;
    private keybindings;
    constructor(contextKeyService: ContextKeyService, commandRegistry: CommandRegistry, contributionProvider: ContributionProvider<KeybindingContribution>);
    onStart(): void;
    registerKeybinding(keybinding: Keybinding): void;
    private formatKeybinding;
    private handleKeydown;
    private parseKeyEvent;
    private getPlatformKey;
    private evaluateWhenCondition;
}
