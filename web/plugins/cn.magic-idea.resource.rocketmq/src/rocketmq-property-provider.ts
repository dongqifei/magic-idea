import { injectable, inject } from "@capital/shared/inversify";
import { FileData, FilePropertyProvider } from '@capital/core/filesystem';
import { RocketMQResourceMetaData } from "./types";
import { createElement, ReactElement } from "react";
import { RocketMQPropertyForm } from "./rocketmq-property-form";
import { URI } from "@capital/core/common";

@injectable()
export class RocketMQPropertyProvider implements FilePropertyProvider {

  matches(uri: URI): boolean {
    return uri.resourceType === 'rocketmq';
  }

  getFormComponent(fileData: RocketMQResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(RocketMQPropertyForm, {
      fileData: fileData,
      onUpdate: onUpdate,
    });
  }
}
