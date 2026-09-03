import { Theme, ThemeChangedEvent, ThemeContribution } from '../core/theme/theme-type';
export declare class MonacoThemeContribution implements ThemeContribution {
    private currentMonacoTheme;
    private definedThemes;
    activate(theme: Theme): void;
    onDidChangeTheme(event: ThemeChangedEvent): void;
    private applyMonacoTheme;
    private customizeMonacoTheme;
}
