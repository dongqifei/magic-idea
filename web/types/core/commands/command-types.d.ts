import { CommandRegistry } from '@lumino/commands';
/**
 * A command is a unique identifier of a function
 * which can be executed by a user via a keyboard shortcut,
 * a menu action or directly.
 */
export interface Command {
    /**
     * A unique identifier of this command.
     */
    id: string;
    /**
     * A label of this command.
     */
    label?: string;
    originalLabel?: string;
    /**
     * An icon class of this command.
     */
    iconClass?: string;
    /**
     * A short title used for display in menus.
     */
    shortTitle?: string;
    /**
     * A category of this command.
     */
    category?: string;
    originalCategory?: string;
}
export declare namespace Command {
    function is(arg: unknown): arg is Command;
    /** Utility function to easily translate commands */
    function toLocalizedCommand(command: Command, nlsLabelKey?: string, nlsCategoryKey?: string): Command;
    function toDefaultLocalizedCommand(command: Command): Command;
    /** Comparator function for when sorting commands */
    function compareCommands(a: Command, b: Command): number;
    /**
     * Determine if two commands are equal.
     *
     * @param a the first command for comparison.
     * @param b the second command for comparison.
     */
    function equals(a: Command, b: Command): boolean;
}
export declare const CommandContribution: unique symbol;
/**
 * The command contribution should be implemented to register custom commands and handler.
 */
export interface CommandContribution {
    /**
     * Register commands and handlers.
     */
    registerCommands(commands: CommandRegistry): void;
}
export declare const CommandService: unique symbol;
/**
 * The command service should be used to execute commands.
 */
export interface CommandService {
}
