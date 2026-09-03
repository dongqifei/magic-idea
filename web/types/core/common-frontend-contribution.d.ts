import { CommandRegistry } from "@lumino/commands";
import { MenuContribution, MenuModelRegistry } from './common/menu';
import { EnvVariablesServer } from './common/env-variables';
import { KeybindingRegistry } from "./keybinding/keybinding-registry";
import { FrontendApplication } from './frontend-application';
import { FrontendApplicationContribution } from "./frontend-application-contribution";
import { CommandContribution } from "./commands";
import { KeybindingContribution } from './keybinding';
import { ApplicationShellLayout } from "./shell";
import { PreferenceService } from "./preferences";
import { SaveableService } from "./saveable-service";
import { SelectionService } from "./selection-service";
import { MagicApiServerService } from "./magic-api";
export declare const MAGIC_IDEA_SOURCE = "Magic IDEA";
export declare const CLASSNAME_OS_MAC = "mac";
export declare const CLASSNAME_OS_WINDOWS = "windows";
export declare const CLASSNAME_OS_LINUX = "linux";
export declare class CommonFrontendContribution implements FrontendApplicationContribution, CommandContribution, KeybindingContribution, MenuContribution {
    static readonly AUTOSAVE_PREFERENCE: string;
    static readonly AUTOSAVE_DELAY_PREFERENCE: string;
    private readonly undoRedoHandlerService;
    protected readonly preferenceService: PreferenceService;
    protected readonly saveResourceService: SaveableService;
    protected readonly shell: ApplicationShellLayout;
    protected readonly menuRegistry: MenuModelRegistry;
    protected readonly selectionService: SelectionService;
    private notificationService;
    protected readonly environments: EnvVariablesServer;
    protected readonly magicApiServerService: MagicApiServerService;
    configure(app: FrontendApplication): Promise<void>;
    protected setOsClass(): void;
    onStart(): void;
    protected initializeAutoSaveMode(): void;
    protected isAutoSaveOn(): boolean;
    protected toggleAutoSave(): Promise<void>;
    registerCommands(registry: CommandRegistry): void;
    registerKeybindings(keybindings: KeybindingRegistry): void;
    registerMenus(registry: MenuModelRegistry): void;
    /**
     * 新版本检查
     */
    private checkVersionUpdate;
}
