/**
 * 依赖注入容器配置
 */
import "reflect-metadata";
import { CommandRegistry } from "@lumino/commands";
import { MaybePromise, MenuModelRegistry } from "./common";
import { ApplicationShellLayout } from "./shell";
import { ShellLayoutRestorer } from './shell/shell-layout-restorer';
import { KeybindingRegistry } from "./keybinding";
import { ContributionProvider } from "./common/contribution-provider";
import { FrontendApplicationContribution } from "./frontend-application-contribution";
import { Stopwatch } from "./performance";
export declare class FrontendApplication {
    protected readonly commands: CommandRegistry;
    protected readonly keybindings: KeybindingRegistry;
    protected readonly layoutRestorer: ShellLayoutRestorer;
    protected readonly menus: MenuModelRegistry;
    private logger;
    protected readonly _shell: ApplicationShellLayout;
    protected readonly contributions: ContributionProvider<FrontendApplicationContribution>;
    protected readonly stopwatch: Stopwatch;
    private readonly commandsImpl;
    private readonly magicApiServerService;
    constructor(commands: CommandRegistry, keybindings: KeybindingRegistry, layoutRestorer: ShellLayoutRestorer, menus: MenuModelRegistry);
    get shell(): ApplicationShellLayout;
    /**
     * Start the frontend application.
     *
     * Start up consists of the following steps:
     * - start frontend contributions
     * - attach the application shell to the host element
     * - initialize the application shell layout
     * - reveal the application shell if it was hidden by a startup indicator
     */
    start(): Promise<void>;
    /**
     * Register global event listeners.
     */
    protected registerEventListeners(): void;
    /**
     * Initialize the shell layout either using the layout restorer service or, if no layout has
     * been stored, by creating the default layout.
     */
    protected initializeLayout(): Promise<void>;
    /**
     * Try to restore the shell layout from the storage service. Resolves to `true` if successful.
     */
    protected restoreLayout(): Promise<boolean>;
    /**
     * Let the frontend application contributions initialize the shell layout. Override this
     * method in order to create an application-specific custom layout.
     */
    protected createDefaultLayout(): Promise<void>;
    protected fireOnDidInitializeLayout(): Promise<void>;
    /**
     * Initialize and start the frontend application contributions.
     */
    protected startContributions(): Promise<void>;
    /**
     * Stop the frontend application contributions. This is called when the window is unloaded.
     */
    protected stopContributions(): void;
    /**
     * Return a promise to the host element to which the application shell is attached.
     */
    getHost(): Promise<HTMLElement>;
    protected measure<T>(name: string, fn: () => MaybePromise<T>, message?: string, threshold?: boolean): Promise<T>;
}
