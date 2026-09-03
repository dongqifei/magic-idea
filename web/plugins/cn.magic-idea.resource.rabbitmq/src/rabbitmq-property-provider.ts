import { injectable, inject } from "@capital/shared/inversify";
import { FileData, FilePropertyProvider } from '@capital/core/filesystem';
import { RabbitMQResourceMetaData } from "./types";
import { createElement, ReactElement } from "react";
import { RabbitMQPropertyForm } from "./rabbitmq-property-form";
import { URI } from "@capital/core/common";

@injectable()
export class RabbitMQPropertyProvider implements FilePropertyProvider {

  matches(uri: URI): boolean {
    return uri.resourceType === 'rabbitmq';
  }

  getFormComponent(fileData: RabbitMQResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(RabbitMQPropertyForm, {
      fileData: fileData,
      onUpdate: onUpdate,
    });
  }
}