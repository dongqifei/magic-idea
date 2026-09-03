import { injectable } from "inversify";
import { ResourceLabelProvider } from "@MagicIdea/core/magic-api/magic-api-resource-label-provider";
import { Resource } from "@MagicIdea/core/magic-api/magic-api-types";
import { ApiResourceMetaData, FunctionResourceMetaData } from "../magic-api-tree-types";

type ColorMap = {
  [key: string]: string | [string, string];
};

const defaultColors: ColorMap = {
  GET: "#249C47",
  POST: "#FFB400",
  DELETE: ["DEL", "#EB2013"],
  PUT: "#097BED",
  PATCH: "#9C27B0",
  HEAD: "#607D8B",
};

const getDisplayText = (value: string): string => {
  const color = defaultColors[value];
  if (color !== undefined && Array.isArray(color)) {
    return color[0];
  }
  return value.toUpperCase();
};

const getColor = (value: string): string => {
  const color = defaultColors[value];
  if (color !== undefined && Array.isArray(color)) {
    return color[1];
  }
  return color;
};

@injectable()
export class ApiResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return ApiResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: ApiResourceMetaData): string | undefined {
    return node ? getColor(node.method) : undefined;
  }

  getIcon(node: ApiResourceMetaData): string | undefined {
    return node ? getDisplayText(node.method) : undefined;
  }
}


@injectable()
export class FunctionResourceLabelProvider extends ResourceLabelProvider {
  canHandle(element: Resource): number {
    return FunctionResourceMetaData.is(element) ? 50 : 0;
  }

  getIconColor(node: FunctionResourceMetaData): string | undefined {
    return "#9012FE";
  }

  getIcon(node: FunctionResourceMetaData): string | undefined {
    return "Fn";
  }
}