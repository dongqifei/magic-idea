import { IEvent, Emitter } from '../common';
import { Theme, ThemeChangedEvent } from './theme-type';
import { ThemeManager } from './theme-manager';
import { ThemeContributionManager } from './theme-contribution';
import { QuickInputService } from '../quick-input';
import { CommandRegistry } from '@lumino/commands';
import { KeybindingRegistry } from '../keybinding/keybinding-registry';
export declare class ThemeService {
    private readonly commandRegistry;
    private keybindingRegistry;
    private quickInputService;
    private readonly themeManager;
    private readonly contributionManager;
    private logger;
    private currentTheme;
    private readonly themeApplication;
    protected readonly onDidChangeThemeEmitter: Emitter<ThemeChangedEvent>;
    constructor(commandRegistry: CommandRegistry, keybindingRegistry: KeybindingRegistry, quickInputService: QuickInputService, themeManager: ThemeManager, contributionManager: ThemeContributionManager);
    private init;
    get onDidChangeTheme(): IEvent<ThemeChangedEvent>;
    /**
     * 发送主题变化事件
     */
    protected fireOnDidChangeTheme(event: ThemeChangedEvent): void;
    /**
     * 注册命令
     */
    private registerCommands;
    setTheme(themeId: string): Promise<void>;
    getCurrentTheme(): Theme | undefined;
}
