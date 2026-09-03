import { interfaces } from "inversify";
import { FileSystemProvider } from '@MagicIdea/core/filesystem';
import { TimelineService } from './timeline-service';
import { TimelineWidget } from './timeline-widget';
import { MagicApiHistoryFileSystemProvider } from './history-file-system-provider';

export * from './timeline-widget';

/**
 * 绑定接口依赖
 * @param bind 
 */
export function bindTimelineModule(bind: interfaces.Bind): void {
  bind(TimelineService).toSelf().inSingletonScope();
  bind(FileSystemProvider).to(MagicApiHistoryFileSystemProvider).inSingletonScope();
  // 绑定 Widget
  bind(TimelineWidget).to(TimelineWidget).inSingletonScope();
}
