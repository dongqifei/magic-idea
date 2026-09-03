import { Command, Disposable, Event } from "@MagicIdea/core";

export interface TimelineItem {
  source: string;
  uri: string;
  handle: string;
  timestamp: number;
  label: string;
  id?: string;
  icon?: string | { light: string; dark: string };
  description?: string;
  tooltip?: string | undefined;
  command?: Command & { arguments?: unknown[] };
  contextValue?: string;
}

export interface TimelineOptions {
  cursor?: string;
  limit?: number | { timestamp: number; id?: string };
}

export interface InternalTimelineOptions {
  cacheResults: boolean;
  resetCache: boolean;
}

export interface Timeline {
  source: string;
  paging?: {
    readonly cursor: string | undefined;
  };
  items: TimelineItem[];
}

export interface TimelineSource {
  id: string;
  label: string;
}
