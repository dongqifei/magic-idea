import { LabelProviderContribution } from "../label-provider";
import { Resource } from "./magic-api-types";

export abstract class ResourceLabelProvider implements LabelProviderContribution {
  
  abstract canHandle(element: object): number;

  abstract getIconColor(node: Resource): string | undefined;

  abstract getIcon(node: Resource): string | undefined;

  getName(node: Resource): string | undefined {
    return node.name;
  }

  getLongName(node: Resource): string | undefined {
    return node.fullPathName;
  }
}
