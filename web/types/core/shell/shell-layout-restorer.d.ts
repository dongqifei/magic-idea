import { Widget } from "@lumino/widgets";
import { FrontendApplication } from "../frontend-application";
import { CommandContribution, CommandRegistry } from "../commands";
import { StorageService } from "../storage";
import { MaybePromise } from "../common";
import { WidgetManager, WidgetConstructionOptions } from "../widget-manager";
import { ContributionProvider } from "../common/contribution-provider";
import { MagicApiServerService } from "../magic-api";
import { ApplicationShellLayout, ApplicationShellLayoutVersion } from "./application-shell";
/**
 * A contract for widgets that want to store and restore their inner state, between sessions.
 */
export interface StatefulWidget {
    /**
     * Called on unload to store the inner state. Returns 'undefined' if the widget cannot be stored.
     */
    storeState(): object | undefined;
    /**
     * Called when the widget got created by the storage service
     */
    restoreState(oldState: object): void;
}
export declare namespace StatefulWidget {
    function is(arg: unknown): arg is StatefulWidget;
}
export interface WidgetDescription {
    constructionOptions: WidgetConstructionOptions;
    innerWidgetState?: string | object;
}
export interface ApplicationShellLayoutMigrationContext {
    /**
     * A resolved version of a current layout.
     */
    layoutVersion: number;
    /**
     * A layout to be inflated.
     */
    layout: ApplicationShellLayout.LayoutData;
    /**
     * A parent widget is to be inflated. `undefined` if the application shell
     */
    parent?: Widget;
}
export interface ApplicationShellLayoutMigrationError extends Error {
    code: "ApplicationShellLayoutMigrationError";
}
export declare namespace ApplicationShellLayoutMigrationError {
    function create(message?: string): ApplicationShellLayoutMigrationError;
    function is(error: Error | undefined): error is ApplicationShellLayoutMigrationError;
}
export declare const ApplicationShellLayoutMigration: unique symbol;
export interface ApplicationShellLayoutMigration {
    /**
     * A target migration version.
     */
    readonly layoutVersion: ApplicationShellLayoutVersion;
    /**
     * A migration can transform layout before it will be inflated.
     *
     * @throws `ApplicationShellLayoutMigrationError` if a layout cannot be migrated,
     * in this case the default layout will be initialized.
     */
    onWillInflateLayout?(context: ApplicationShellLayoutMigrationContext): MaybePromise<void>;
    /**
     * A migration can transform the given description before it will be inflated.
     *
     * @returns a migrated widget description, or `undefined`
     * @throws `ApplicationShellLayoutMigrationError` if a widget description cannot be migrated,
     * in this case the default layout will be initialized.
     */
    onWillInflateWidget?(desc: WidgetDescription, context: ApplicationShellLayoutMigrationContext): MaybePromise<WidgetDescription | undefined>;
}
export declare const ShellLayoutTransformer: unique symbol;
/**
 * This contribution point allows arbitrary modifications to the shell layout
 * data when it is restored.
 */
export interface ShellLayoutTransformer {
    /**
     * Modifies the shell layout data before it is restored.
     * @param layoutData
     */
    transformLayoutOnRestore(layoutData: ApplicationShellLayout.LayoutData): void;
}
export declare const RESET_LAYOUT: {
    id: string;
    label: string;
};
export declare class ShellLayoutRestorer implements CommandContribution {
    protected widgetManager: WidgetManager;
    protected storageService: StorageService;
    protected readonly magicApiServerService: MagicApiServerService;
    private logger;
    protected prefix: string;
    protected storageKey: string;
    protected shouldStoreLayout: boolean;
    protected readonly migrations: ContributionProvider<ApplicationShellLayoutMigration>;
    protected readonly transformations: ContributionProvider<ShellLayoutTransformer>;
    constructor(widgetManager: WidgetManager, storageService: StorageService, magicApiServerService: MagicApiServerService);
    registerCommands(commands: CommandRegistry): void;
    private updatePrefix;
    protected prefixWorkspaceURI(originalKey: string): string;
    protected resetLayout(): Promise<void>;
    storeLayout(app: FrontendApplication): void;
    restoreLayout(app: FrontendApplication): Promise<boolean>;
    protected isWidgetProperty(propertyName: string): boolean;
    protected isWidgetsProperty(propertyName: string): boolean;
    /**
     * Turns the layout data to a string representation.
     */
    protected deflate(data: object): string;
    private convertToDescription;
    /**
     * Creates the layout data from its string representation.
     */
    protected inflate(layoutData: string): Promise<ApplicationShellLayout.LayoutData>;
    protected fireWillInflateLayout(context: ShellLayoutRestorer.InflateContext): Promise<void>;
    protected parse<T>(layoutData: string, parseContext: ShellLayoutRestorer.ParseContext): T;
    protected fireWillInflateWidget(desc: WidgetDescription, context: ShellLayoutRestorer.InflateContext): Promise<WidgetDescription>;
    protected convertToWidget(desc: WidgetDescription, context: ShellLayoutRestorer.InflateContext): Promise<Widget | undefined>;
}
export declare namespace ShellLayoutRestorer {
    class ParseContext {
        protected readonly toInflate: Inflate[];
        protected readonly toFilter: Widgets[];
        /**
         * Returns an array, which will be filtered from undefined elements
         * after resolving promises, that create widgets.
         */
        filteredArray(): Widgets;
        push(toInflate: Inflate): void;
        inflate(context: InflateContext): Promise<void>;
    }
    type Widgets = (Widget | undefined)[];
    type Inflate = (context: InflateContext) => Promise<void>;
    interface InflateContext extends ApplicationShellLayoutMigrationContext {
        readonly migrations: ApplicationShellLayoutMigration[];
    }
}
