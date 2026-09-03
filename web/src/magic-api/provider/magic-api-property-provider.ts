import { injectable, inject } from "inversify";
import { FileData, FilePropertyProvider } from '../../core/filesystem/file-system-types';
import { ApiResourceMetaData, FunctionResourceMetaData } from "../magic-api-tree-types";
import { createElement, ReactElement } from "react";
import { ApiFilePropertyForm } from "../components/api-property-form";
import { FunctionPropertyForm } from "../components/function-property-form";
import { MagicApiConstantsService } from "@MagicIdea/core/magic-api";
import URI from "@MagicIdea/core/common/uri";


@injectable()
export class ApiFileFunctionPropertyProvider implements FilePropertyProvider {
  matches(uri: URI): boolean {
    return uri.resourceType === 'function';
  }

  getFormComponent(fileData: FunctionResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(FunctionPropertyForm, {
      fileData: fileData,
      onUpdate: onUpdate
    });
  }
}


@injectable()
export class ApiFileApiPropertyProvider implements FilePropertyProvider {

  constructor(
    @inject(MagicApiConstantsService) private constants: MagicApiConstantsService,
  ){}

  matches(uri: URI): boolean {
    return uri.resourceType === 'api';
  }

  getFormComponent(fileData: ApiResourceMetaData, onUpdate: (data: Partial<FileData>) => void): ReactElement {
    return createElement(ApiFilePropertyForm, {
      fileData: fileData,
      options: this.constants.options,
      onUpdate: onUpdate
    });
  }
}