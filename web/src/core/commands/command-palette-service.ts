import { injectable, inject } from "inversify";
import { ArrayExt } from '@lumino/algorithm';
import { JSONExt, ReadonlyJSONObject } from '@lumino/coreutils';
import { CommandRegistry } from "@lumino/commands";
import { VirtualElement } from "@lumino/virtualdom";
import {
  IItemOptions,
  IItem,
  CommandPaletteService,
} from "./command-palette-type";

@injectable()
export class CommandPaletteServiceImpl implements CommandPaletteService {

  private _items: IItem[] = [];

  constructor(
    @inject(CommandRegistry) private commands: CommandRegistry
  ) {}

  /**
   * A read-only array of the command items in the palette.
   */
  get items(): ReadonlyArray<IItem> {
    return this._items;
  }

  addItem(options: IItemOptions): IItem {
    // Create a new command item for the options.
    let item = createItem(this.commands, options);

    // Add the item to the array.
    this._items.push(item);

    // Return the item added to the palette.
    return item;
  }

  /**
   * Adds command items to the command palette.
   *
   * @param items - An array of options for creating each command item.
   *
   * @returns The command items added to the palette.
   */
  addItems(items: IItemOptions[]): IItem[] {
    const newItems = items.map(item => createItem(this.commands, item));
    newItems.forEach(item => this._items.push(item));
    return newItems;
  }

  /**
   * Remove an item from the command palette.
   *
   * @param item - The item to remove from the palette.
   *
   * #### Notes
   * This is a no-op if the item is not in the palette.
   */
  removeItem(item: IItem): void {
    this.removeItemAt(this._items.indexOf(item));
  }

  /**
   * Remove the item at a given index from the command palette.
   *
   * @param index - The index of the item to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeItemAt(index: number): void {
    // Remove the item from the array.
    let item = ArrayExt.removeAt(this._items, index);

    // Bail if the index is out of range.
    if (!item) {
      return;
    }
  }

  /**
   * Remove all items from the command palette.
   */
  clearItems(): void {
    // Bail if there is nothing to remove.
    if (this._items.length === 0) {
      return;
    }

    // Clear the array of items.
    this._items.length = 0;
  }
}

/**
 * Create a new command item from a command registry and options.
 */
export function createItem(
  commands: CommandRegistry,
  options: IItemOptions
): IItem {
  return new CommandItem(commands, options);
}

/**
 * A concrete implementation of `CommandPalette.IItem`.
 */
class CommandItem implements IItem {
  /**
   * Construct a new command item.
   */
  constructor(commands: CommandRegistry, options: IItemOptions) {
    this._commands = commands;
    this.insertPrefix = options.insertPrefix || '';
    this.category = normalizeCategory(options.category);
    this.command = options.command;
    this.args = options.args || JSONExt.emptyObject;
    this.rank = options.rank !== undefined ? options.rank : Infinity;
  }

  readonly insertPrefix: string;

  /**
   * The category for the command item.
   */
  readonly category: string;

  /**
   * The command to execute when the item is triggered.
   */
  readonly command: string;

  /**
   * The arguments for the command.
   */
  readonly args: ReadonlyJSONObject;

  /**
   * The rank for the command item.
   */
  readonly rank: number;

  /**
   * The display label for the command item.
   */
  get label(): string {
    return this._commands.label(this.command, this.args);
  }

  /**
   * The icon renderer for the command item.
   */
  get icon(): VirtualElement.IRenderer | undefined {
    return this._commands.icon(this.command, this.args);
  }

  /**
   * The icon class for the command item.
   */
  get iconClass(): string {
    return this._commands.iconClass(this.command, this.args);
  }

  /**
   * The icon label for the command item.
   */
  get iconLabel(): string {
    return this._commands.iconLabel(this.command, this.args);
  }

  /**
   * The display caption for the command item.
   */
  get caption(): string {
    return this._commands.caption(this.command, this.args);
  }

  /**
   * The extra class name for the command item.
   */
  get className(): string {
    return this._commands.className(this.command, this.args);
  }

  /**
   * The dataset for the command item.
   */
  get dataset(): CommandRegistry.Dataset {
    return this._commands.dataset(this.command, this.args);
  }

  /**
   * Whether the command item is enabled.
   */
  get isEnabled(): boolean {
    return this._commands.isEnabled(this.command, this.args);
  }

  /**
   * Whether the command item is toggled.
   */
  get isToggled(): boolean {
    return this._commands.isToggled(this.command, this.args);
  }

  /**
   * Whether the command item is toggleable.
   */
  get isToggleable(): boolean {
    return this._commands.isToggleable(this.command, this.args);
  }

  /**
   * Whether the command item is visible.
   */
  get isVisible(): boolean {
    return this._commands.isVisible(this.command, this.args);
  }

  /**
   * The key binding for the command item.
   */
  get keyBinding(): CommandRegistry.IKeyBinding | null {
    let { command, args } = this;
    return (
      ArrayExt.findLastValue(this._commands.keyBindings, (kb) => {
        return kb.command === command && JSONExt.deepEqual(kb.args, args);
      }) || null
    );
  }

  private _commands: CommandRegistry;
}

/**
 * Normalize a category for a command item.
 */
function normalizeCategory(category: string): string {
  return category.trim().replace(/\s+/g, " ");
}
