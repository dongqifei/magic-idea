import { CommandRegistry } from '@lumino/commands';
import { nls } from '../common/nls';
import { isObject } from '../common/types';

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

export namespace Command {
    /* Determine whether object is a Command */
    export function is(arg: unknown): arg is Command {
        return isObject(arg) && 'id' in arg;
    }

    /** Utility function to easily translate commands */
    export function toLocalizedCommand(command: Command, nlsLabelKey: string = command.id, nlsCategoryKey?: string): Command {
        return {
            ...command,
            label: command.label && nls.localize(nlsLabelKey, command.label),
            originalLabel: command.label,
            category: nlsCategoryKey && command.category && nls.localize(nlsCategoryKey, command.category) || command.category,
            originalCategory: command.category,
        };
    }

    export function toDefaultLocalizedCommand(command: Command): Command {
        return {
            ...command,
            label: command.label && nls.localizeByDefault(command.label),
            originalLabel: command.label,
            category: command.category && nls.localizeByDefault(command.category),
            originalCategory: command.category,
        };
    }

    /** Comparator function for when sorting commands */
    export function compareCommands(a: Command, b: Command): number {
        if (a.label && b.label) {
            const aCommand = (a.category ? `${a.category}: ${a.label}` : a.label).toLowerCase();
            const bCommand = (b.category ? `${b.category}: ${b.label}` : b.label).toLowerCase();
            return (aCommand).localeCompare(bCommand);
        } else {
            return 0;
        }
    }

    /**
     * Determine if two commands are equal.
     *
     * @param a the first command for comparison.
     * @param b the second command for comparison.
     */
    export function equals(a: Command, b: Command): boolean {
        return (
            a.id === b.id &&
            a.label === b.label &&
            a.iconClass === b.iconClass &&
            a.category === b.category
        );
    }
}

export const CommandContribution = Symbol('CommandContribution');

/**
 * The command contribution should be implemented to register custom commands and handler.
 */
export interface CommandContribution {
    /**
     * Register commands and handlers.
     */
    registerCommands(commands: CommandRegistry): void;
}


export const CommandService = Symbol('CommandService');

/**
 * The command service should be used to execute commands.
 */
export interface CommandService {
  
}