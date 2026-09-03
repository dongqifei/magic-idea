import { injectable } from "@capital/shared/inversify";
import { FileData, FilePropertyProvider } from '@capital/core/filesystem';
import { MqttResourceMetaData } from "./types";
import { createElement, ReactElement } from "react";
import { MqttPropertyForm } from "./mqtt-property-form";
import { URI } from "@capital/core/common";

@injectable()
export class MqttPropertyProvider implements FilePropertyProvider {

  matches(uri: URI): boolean {
    return uri.resourceType === 'mqtt';
  }

  getFormComponent(fileData: MqttResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(MqttPropertyForm, {
      fileData: fileData,
      onUpdate: onUpdate,
    });
  }
}
