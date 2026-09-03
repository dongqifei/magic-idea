import { Theme } from './theme-type';
import { StorageService } from '../storage';
export declare class ThemeManager {
    private storageService;
    private themes;
    private defaultThemeId;
    constructor(storageService: StorageService);
    registerTheme(theme: Theme): void;
    getThemes(): Theme[];
    getTheme(id: string): Theme | undefined;
    getStoredThemeId(): Promise<string>;
    storeThemeId(themeId: string): void;
}
