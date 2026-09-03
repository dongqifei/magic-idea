import { inject, named, injectable } from "inversify";

import { ContributionProvider } from "@MagicIdea/core/common/contribution-provider";
import { MagicApiResourceContribution } from "./magic-api-resource-contribution";
import { ResourceType } from "./magic-api-types";

export interface ResourceRegistry { 
  registerResource(resourceType: ResourceType): void;
  getAllResourceTypes(): ResourceType[];
}

export const ResourceRegistry = Symbol("ResourceRegistry");

@injectable()
export class MagicApiResourceService implements ResourceRegistry { 

  private resourceTypes: ResourceType[];

  constructor(
    @inject(ContributionProvider)
    @named(MagicApiResourceContribution)
    protected readonly contributions: ContributionProvider<MagicApiResourceContribution>
  ) { 
    // 默认注册
    this.resourceTypes = [];
    for (const contribution of this.contributions.getContributions()) {
      contribution.registerResource(this);
    }
  }

  registerResource(resourceType: ResourceType): void { 
    this.resourceTypes.push(resourceType);
  }

  getAllResourceTypes(): ResourceType[] { 
    return this.resourceTypes;
  }
}