import { injectable, inject } from "@capital/shared/inversify";
import { Resource, ResourceLabelProvider } from '@capital/core/magic-api';
import { TaskResourceMetaData } from "./types";

@injectable()
export class TaskResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return TaskResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: TaskResourceMetaData): string | undefined {
    return "#8dc149";
  }

  getIcon(node: TaskResourceMetaData): string | undefined {
    return "TASK";
  }
}