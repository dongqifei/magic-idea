import { ContributionProvider } from '..\common\contribution-provider';
import { MagicApiResourceContribution } from "./magic-api-resource-contribution";
import { ResourceType } from "./magic-api-types";
export interface ResourceRegistry {
    registerResource(resourceType: ResourceType): void;
    getAllResourceTypes(): ResourceType[];
}
export declare const ResourceRegistry: unique symbol;
export declare class MagicApiResourceService implements ResourceRegistry {
    protected readonly contributions: ContributionProvider<MagicApiResourceContribution>;
    private resourceTypes;
    constructor(contributions: ContributionProvider<MagicApiResourceContribution>);
    registerResource(resourceType: ResourceType): void;
    getAllResourceTypes(): ResourceType[];
}
