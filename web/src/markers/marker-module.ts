import { interfaces } from 'inversify';
import { MarkerService } from './markers-types';
import { MarkerServiceImpl } from './marker-service';
import { MarkerWidget } from './marker-widget';

export function bindMarkerModule(bind: interfaces.Bind): void {
  // 绑定标记服务
  bind(MarkerService).to(MarkerServiceImpl).inSingletonScope();
  // 绑定标记面板Widget
  bind(MarkerWidget).toSelf().inSingletonScope();
}