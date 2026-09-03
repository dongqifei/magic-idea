import { injectable } from "@capital/shared/inversify";
import { FileData, FilePropertyProvider } from '@capital/core/filesystem';
import { KafkaResourceMetaData } from "./types";
import { createElement, ReactElement } from "react";
import { KafkaPropertyForm } from "./kafka-property-form";
import { URI } from "@capital/core/common";

@injectable()
export class KafkaPropertyProvider implements FilePropertyProvider {

  matches(uri: URI): boolean {
    return uri.resourceType === 'kafka';
  }

  getFormComponent(fileData: KafkaResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(KafkaPropertyForm, {
      fileData: fileData,
      onUpdate: onUpdate,
    });
  }
}
