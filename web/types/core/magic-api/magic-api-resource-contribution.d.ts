import { ResourceRegistry } from "./magic-api-resource-service";
import { MagicApiTreeModel } from './magic-api-tree-model';
/**
 * MagicApi资源贡献点
 */
export interface MagicApiResourceContribution {
    registerResource(registry: ResourceRegistry): void;
}
export declare const MagicApiResourceContribution: unique symbol;
export declare abstract class DefaultMagicApiResourceContribution implements MagicApiResourceContribution {
    private treeModel;
    constructor(treeModel: MagicApiTreeModel);
    /**
     * 注册系统内置资源
     * @param registry
     */
    registerResource(registry: ResourceRegistry): void;
}
