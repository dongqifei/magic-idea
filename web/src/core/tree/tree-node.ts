import { isObject, Mutable } from '@MagicIdea/core/common';

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

export namespace TreeNode {
    export function is(node: unknown): node is TreeNode {
        return isObject(node) && 'id' in node && 'parent' in node;
    }

    export function equals(left: TreeNode | undefined, right: TreeNode | undefined): boolean {
        return left === right || (!!left && !!right && left.id === right.id);
    }

    export function isVisible(node: TreeNode | undefined): boolean {
        return !!node && (node.visible === undefined || node.visible);
    }
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

export namespace CompositeTreeNode {
    export function is(node: unknown): node is CompositeTreeNode {
        return isObject(node) && 'children' in node;
    }

    export function getFirstChild(parent: CompositeTreeNode): TreeNode | undefined {
        return parent.children[0];
    }

    export function getLastChild(parent: CompositeTreeNode): TreeNode | undefined {
        return parent.children[parent.children.length - 1];
    }

    export function isAncestor(parent: CompositeTreeNode, child: TreeNode | undefined): boolean {
        if (!child) {
            return false;
        }
        if (TreeNode.equals(parent, child.parent)) {
            return true;
        }
        return isAncestor(parent, child.parent);
    }

    export function indexOf(parent: CompositeTreeNode, node: TreeNode | undefined): number {
        if (!node) {
            return -1;
        }
        return parent.children.findIndex(child => TreeNode.equals(node, child));
    }

    export function addChildren(parent: CompositeTreeNode, children: TreeNode[]): CompositeTreeNode {
        for (const child of children) {
            addChild(parent, child);
        }
        return parent;
    }

    export function addChild(parent: CompositeTreeNode, child: TreeNode): CompositeTreeNode {
        const children = parent.children as TreeNode[];
        const index = children.findIndex(value => value.id === child.id);
        if (index !== -1) {
            children.splice(index, 1, child);
            setParent(child, index, parent);
        } else {
            children.push(child);
            setParent(child, parent.children.length - 1, parent);
        }
        return parent;
    }

    export function removeChild(parent: CompositeTreeNode, child: TreeNode): void {
        const children = parent.children as TreeNode[];
        const index = children.findIndex(value => value.id === child.id);
        if (index === -1) {
            return;
        }
        children.splice(index, 1);
        const { previousSibling, nextSibling } = child;
        if (previousSibling) {
            Object.assign(previousSibling, { nextSibling });
        }
        if (nextSibling) {
            Object.assign(nextSibling, { previousSibling });
        }
    }

    export function setParent(child: TreeNode, index: number, parent: CompositeTreeNode): void {
        const previousSibling = parent.children[index - 1];
        const nextSibling = parent.children[index + 1];
        Object.assign(child, { parent, previousSibling, nextSibling });
        if (previousSibling) {
            Object.assign(previousSibling, { nextSibling: child });
        }
        if (nextSibling) {
            Object.assign(nextSibling, { previousSibling: child });
        }
    }
}
