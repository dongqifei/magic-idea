import { ReadonlyJSONObject } from "@lumino/coreutils";
import { CommandRegistry } from "@lumino/commands";
import { VirtualElement } from "@lumino/virtualdom";

/**
 * 命令 palette 服务
 */
export interface IItemOptions {
  /**
   * The category for the item.
   */
  category: string;
  /**
   * The command to execute when the item is triggered.
   */
  command: string;
  /**
   * The arguments for the command.
   *
   * The default value is an empty object.
   */
  args?: ReadonlyJSONObject;
  /**
   * The rank for the command item.
   *
   * The rank is used as a tie-breaker when ordering command items
   * for display. Items are sorted in the following order:
   *   1. Text match (lower is better)
   *   2. Category (locale order)
   *   3. Rank (lower is better)
   *   4. Label (locale order)
   *
   * The default rank is `Infinity`.
   */
  rank?: number;
  /**
   * The prefix to insert when the command item is executed.
   */
  insertPrefix?: string;
}

/**
 * An object which represents an item in a command palette.
 *
 * #### Notes
 * Item objects are created automatically by a command palette.
 */
export interface IItem {
  /**
   * The command to execute when the item is triggered.
   */
  readonly command: string;
  /**
   * The arguments for the command.
   */
  readonly args: ReadonlyJSONObject;
  /**
   * The category for the command item.
   */
  readonly category: string;
  /**
   * The prefix to insert into the input when the item is triggered.
   */
  readonly insertPrefix: string;
  /**
   * The rank for the command item.
   */
  readonly rank: number;
  /**
   * The display label for the command item.
   */
  readonly label: string;
  /**
   * The display caption for the command item.
   */
  readonly caption: string;
  /**
   * The icon renderer for the command item.
   */
  readonly icon: VirtualElement.IRenderer | undefined;
  /**
   * The icon class for the command item.
   */
  readonly iconClass: string;
  /**
   * The icon label for the command item.
   */
  readonly iconLabel: string;
  /**
   * The extra class name for the command item.
   */
  readonly className: string;
  /**
   * The dataset for the command item.
   */
  readonly dataset: CommandRegistry.Dataset;
  /**
   * Whether the command item is enabled.
   */
  readonly isEnabled: boolean;
  /**
   * Whether the command item is toggled.
   */
  readonly isToggled: boolean;
  /**
   * Whether the command item is toggleable.
   */
  readonly isToggleable: boolean;
  /**
   * Whether the command item is visible.
   */
  readonly isVisible: boolean;
  /**
   * The key binding for the command item.
   */
  readonly keyBinding: CommandRegistry.IKeyBinding | null;
}

export interface CommandPaletteService {
  /**
   * A read-only array of the command items in the palette.
   */
  get items(): ReadonlyArray<IItem>;

  /**
   * Add a command item to the command palette.
   *
   * @param options - The options for creating the command item.
   *
   * @returns The command item added to the palette.
   */
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
   * Remove an item from the command palette by index.
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

export const CommandPaletteService = Symbol('CommandPaletteService');