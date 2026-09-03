import { interfaces } from 'inversify';
import { MenuNodeFactory } from '../common';
import { FrontendApplicationContribution } from '../frontend-application-contribution';
import { ContextMenuRenderer } from '../context-menu-renderer';
import { BrowserMenuBarContribution, BrowserMainMenuFactory } from './browser-menu-plugin';
import { BrowserContextMenuRenderer } from './browser-context-menu-renderer';
import { BrowserMenuNodeFactory } from './browser-menu-node-factory';

export function bingCoreMenuModule(bind: interfaces.Bind): void {
    bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(ContextMenuRenderer).to(BrowserContextMenuRenderer).inSingletonScope();
    bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);
    bind(BrowserMenuNodeFactory).toSelf().inSingletonScope();
    bind(MenuNodeFactory).toService(BrowserMenuNodeFactory);
}