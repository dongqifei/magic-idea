import { interfaces } from 'inversify';
import { IStatusBarService } from './statusbar-types';
import { StatusBarServiceImpl } from './statusbar-service';
import { StatusBarWidget } from './statusbar-widget';

export * from './statusbar-types';
export * from './statusbar-service';
export * from './statusbar-widget';

/**
 * 绑定状态栏接口依赖
 * @param bind 
 */
export function bindStatusBar(bind: interfaces.Bind): void {
    bind(StatusBarServiceImpl).toSelf().inSingletonScope();
    bind(IStatusBarService).to(StatusBarServiceImpl).inSingletonScope();
    bind(StatusBarWidget).toSelf().inSingletonScope();
}
