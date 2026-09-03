/**
 * The tree node.
 */
export interface TreeNode {
    /**
     * An unique id of this node.
     */
    readonly id: string;
    /**
     * A human-readable name of this tree node.
     *
     * @deprecated use `LabelProvider.getName` instead or move this property to your tree node type
     */
    readonly name?: string;
    /**
     * A css string for this tree node icon.
     *
     * @deprecated use `LabelProvider.getIcon` instead or move this property to your tree node type
     */
    readonly icon?: string;
    /**
     * A human-readable description of this tree node.
     *
     * @deprecated use `LabelProvider.getLongName` instead or move this property to your tree node type
     */
    readonly description?: string;
    /**
     * Test whether this node should be rendered.
     * If undefined then node will be rendered.
     */
    readonly visible?: boolean;
    /**
     * A parent node of this tree node.
     * Undefined if this node is root.
     */
    readonly parent: Readonly<CompositeTreeNode> | undefined;
    /**
     * A previous sibling of this tree node.
     */
    readonly previousSibling?: TreeNode;
    /**
     * A next sibling of this tree node.
     */
    readonly nextSibling?: TreeNode;
    /**
     * Whether this node is busy. Greater than 0 then busy; otherwise not.
     */
    readonly busy?: number;
}
export declare namespace TreeNode {
    function is(node: unknown): node is TreeNode;
    function equals(left: TreeNode | undefined, right: TreeNode | undefined): boolean;
    function isVisible(node: TreeNode | undefined): boolean;
}
/**
 * The composite tree node.
 */
export interface CompositeTreeNode extends TreeNode {
    /**
     * Child nodes of this tree node.
     */
    children: ReadonlyArray<TreeNode>;
}
export declare namespace CompositeTreeNode {
    function is(node: unknown): node is CompositeTreeNode;
    function getFirstChild(parent: CompositeTreeNode): TreeNode | undefined;
    function getLastChild(parent: CompositeTreeNode): TreeNode | undefined;
    function isAncestor(parent: CompositeTreeNode, child: TreeNode | undefined): boolean;
    function indexOf(parent: CompositeTreeNode, node: TreeNode | undefined): number;
    function addChildren(parent: CompositeTreeNode, children: TreeNode[]): CompositeTreeNode;
    function addChild(parent: CompositeTreeNode, child: TreeNode): CompositeTreeNode;
    function removeChild(parent: CompositeTreeNode, child: TreeNode): void;
    function setParent(child: TreeNode, index: number, parent: CompositeTreeNode): void;
}
