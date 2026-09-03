import { CompoundMenuNode, ContextExpressionMatcher, Group, MenuNode, MenuPath, Submenu } from './menu-types';
import { IEvent as Event } from '..';
export declare class SubMenuLink implements CompoundMenuNode {
    private readonly delegate;
    private readonly _sortString?;
    private readonly _when?;
    constructor(delegate: Submenu, _sortString?: string, _when?: string);
    get id(): string;
    get onDidChange(): Event<void> | undefined;
    get children(): MenuNode[];
    get contextKeyOverlays(): Record<string, string> | undefined;
    get label(): string;
    get icon(): string | undefined;
    get sortString(): string;
    isVisible<T>(effectiveMenuPath: MenuPath, contextMatcher: ContextExpressionMatcher<T>, context: T | undefined, ...args: unknown[]): boolean;
    isEmpty<T>(effectiveMenuPath: MenuPath, contextMatcher: ContextExpressionMatcher<T>, context: T | undefined, ...args: unknown[]): boolean;
}
/**
 * Node representing a (sub)menu in the menu tree structure.
 */
export declare abstract class AbstractCompoundMenuImpl implements MenuNode {
    readonly id: string;
    protected readonly orderString?: string;
    protected readonly when?: string;
    readonly children: MenuNode[];
    protected constructor(id: string, orderString?: string, when?: string);
    getOrCreate(menuPath: MenuPath, pathIndex: number, endIndex: number): CompoundMenuImpl;
    /**
     * Menu nodes are sorted in ascending order based on their `sortString`.
     */
    isVisible<T>(effectiveMenuPath: MenuPath, contextMatcher: ContextExpressionMatcher<T>, context: T | undefined, ...args: unknown[]): boolean;
    isEmpty<T>(effectiveMenuPath: MenuPath, contextMatcher: ContextExpressionMatcher<T>, context: T | undefined, ...args: unknown[]): boolean;
    addNode(...node: MenuNode[]): void;
    getNode(id: string): MenuNode | undefined;
    removeById(id: string): void;
    removeNode(node: MenuNode): void;
    get sortString(): string;
}
export declare class GroupImpl extends AbstractCompoundMenuImpl implements Group {
    constructor(id: string, orderString?: string, when?: string);
}
export declare class SubmenuImpl extends AbstractCompoundMenuImpl implements Submenu {
    readonly label: string;
    readonly contextKeyOverlays: Record<string, string> | undefined;
    readonly icon?: string;
    constructor(id: string, label: string, contextKeyOverlays: Record<string, string> | undefined, orderString?: string, icon?: string, when?: string);
}
export type CompoundMenuImpl = SubmenuImpl | GroupImpl;
