import URI from "@MagicIdea/core/common/uri";
export interface Variable {
  name: string;
  type: string;
  value: any;
  children?: Variable[];
}

export interface BreakpointInfo {
  variables: Variable[];
  range: number[];
}

export interface RequestInfo {
  url: string;
  status?: number;
}

export interface ResponseStats {
  size: string;
  duration: number;
}

export interface RunResult {
  id: string;
  uri: URI;
  timestamp: string;
  responseBody: any;
  responseHeaders: any;
  requestInfo: RequestInfo;
  stats: ResponseStats;
}