import { CommandRegistry } from "@lumino/commands";
import { IItemOptions, IItem, CommandPaletteService } from "./command-palette-type";
export declare class CommandPaletteServiceImpl implements CommandPaletteService {
    private commands;
    private _items;
    constructor(commands: CommandRegistry);
    /**
     * A read-only array of the command items in the palette.
     */
    get items(): ReadonlyArray<IItem>;
    addItem(options: IItemOptions): IItem;
    /**
     * Adds command items to the command palette.
     *
     * @param items - An array of options for creating each command item.
     *
     * @returns The command items added to the palette.
     */
    addItems(items: IItemOptions[]): IItem[];
    /**
     * Remove an item from the command palette.
     *
     * @param item - The item to remove from the palette.
     *
     * #### Notes
     * This is a no-op if the item is not in the palette.
     */
    removeItem(item: IItem): void;
    /**
     * Remove the item at a given index from the command palette.
     *
     * @param index - The index of the item to remove.
     *
     * #### Notes
     * This is a no-op if the index is out of range.
     */
    removeItemAt(index: number): void;
    /**
     * Remove all items from the command palette.
     */
    clearItems(): void;
}
/**
 * Create a new command item from a command registry and options.
 */
export declare function createItem(commands: CommandRegistry, options: IItemOptions): IItem;
