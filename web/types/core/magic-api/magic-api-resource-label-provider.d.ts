import { LabelProviderContribution } from "../label-provider";
import { Resource } from "./magic-api-types";
export declare abstract class ResourceLabelProvider implements LabelProviderContribution {
    abstract canHandle(element: object): number;
    abstract getIconColor(node: Resource): string | undefined;
    abstract getIcon(node: Resource): string | undefined;
    getName(node: Resource): string | undefined;
    getLongName(node: Resource): string | undefined;
}
