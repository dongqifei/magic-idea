import { injectable, inject, postConstruct, interfaces } from "inversify";
import { URI } from "@MagicIdea/core";
import { MagicApiClientService } from "@MagicIdea/core/magic-api/magic-api-client-service";
import {
  Timeline,
  TimelineItem,
  TimelineOptions,
  TimelineSource,
} from "./timeline-model";

@injectable()
export class TimelineService {

  constructor(
    @inject(MagicApiClientService) protected readonly client: MagicApiClientService
  ){}

  getSources(): TimelineSource[] {
    return [{
      id: "magic-api",
      label: "magic-api",
    }];
  }

  getTimeline(
    source: string,
    uri: URI,
    options?: TimelineOptions,
  ): Promise<Timeline | undefined> {
    return this.provideTimeline(source, uri, options)
      .then((result: Timeline) => {
        if (!result) {
          return undefined;
        }
        result.items = result.items.map((item: TimelineItem) => ({
          ...item,
        }));
        return result;
      });
  }

  private async provideTimeline(source: string,uri: URI, options?: TimelineOptions): Promise<Timeline> {
    const data = {
      source: source,
      items: []
    }
    const resourceId = uri.resourceId;
    const result = await this.client.backupList(resourceId);
    data.items = result.data.map((item: any) => ({
      source: source,
      uri: uri.toString(),
      handle: item.createBy,
      timestamp: item.createDate,
      description: item.createBy,
      label: item.name,
      id: item.id,
    }));
    return data;
  }
}
