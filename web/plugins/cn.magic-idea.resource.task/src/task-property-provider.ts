import { injectable, inject } from "@capital/shared/inversify";
import { FileData, FilePropertyProvider } from '@capital/core/filesystem';
import { NotificationService } from "@capital/core/notification";
import { TaskResourceMetaData } from "./types";
import { createElement, ReactElement } from "react";
import { TaskPropertyForm } from "./task-property-form";
import { URI } from "@capital/core/common";

@injectable()
export class TaskPropertyProvider implements FilePropertyProvider {

  @inject(NotificationService)
  private notificationService: NotificationService;

  matches(uri: URI): boolean {
    return uri.resourceType === 'task';
  }

  getFormComponent(fileData: TaskResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(TaskPropertyForm, {
      fileData: fileData,
      onUpdate: onUpdate,
      message: this.notificationService
    });
  }
}
