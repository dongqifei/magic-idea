import { interfaces } from 'inversify';
import { Widget } from '@lumino/widgets';
import { CommandContribution, CommandRegistry, Command } from '../commands';
import { WidgetManager } from '../widget-manager';
import { ApplicationShellLayout as ApplicationShell } from './application-shell';
export interface OpenViewArguments extends ApplicationShell.WidgetOptions {
    toggle?: boolean;
    activate?: boolean;
    reveal?: boolean;
}
export interface ViewContributionOptions {
    widgetId: string;
    viewContainerId?: string;
    widgetName: string;
    defaultWidgetOptions: ApplicationShell.WidgetOptions;
    toggleCommandId?: string;
    toggleKeybinding?: string;
    iconClass?: string;
}
export declare function bindViewContribution<T extends AbstractViewContribution<Widget>>(bind: interfaces.Bind, identifier: interfaces.Newable<T>): interfaces.BindingWhenOnSyntax<T>;
/**
 * An abstract superclass for frontend contributions that add a view to the application shell.
 */
export declare abstract class AbstractViewContribution<T extends Widget> implements CommandContribution {
    protected readonly options: ViewContributionOptions;
    protected readonly widgetManager: WidgetManager;
    protected readonly shell: ApplicationShell;
    readonly toggleCommand?: Command;
    constructor(options: ViewContributionOptions);
    get viewId(): string;
    get viewLabel(): string;
    get defaultViewOptions(): ApplicationShell.WidgetOptions;
    get widget(): Promise<T>;
    tryGetWidget(): T | undefined;
    openView(args?: Partial<OpenViewArguments>): Promise<T>;
    registerCommands(commands: CommandRegistry): void;
    closeView(): Promise<T | undefined>;
    toggleView(): Promise<T>;
}
