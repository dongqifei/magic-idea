import { interfaces } from 'inversify';
import { ThemeManager } from './theme-manager';
import { ThemeService } from './theme-service';
import { ThemeContributionManager } from './theme-contribution';

export * from './theme-manager';
export * from './theme-service';
export * from './theme-contribution';
export * from './theme-type';

export function bindThemeModule(bind: interfaces.Bind): void {
    bind(ThemeContributionManager).toSelf().inSingletonScope();
    bind(ThemeService).to(ThemeService).inSingletonScope();
    bind(ThemeManager).toSelf().inSingletonScope();
}
