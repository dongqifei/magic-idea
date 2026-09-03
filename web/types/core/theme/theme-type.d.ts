export type ThemeType = 'light' | 'dark' | string;
export interface CssVariables {
    [key: string]: string;
}
export interface Theme {
    id: string;
    type: ThemeType;
    label: string;
    description?: string;
    variables: CssVariables;
    monacoTheme?: string;
    rules?: any[];
    colors?: any;
    spacing?: number;
}
export interface ThemeChangedEvent {
    oldTheme: Theme | undefined;
    newTheme: Theme;
}
export interface ThemeContribution {
    activate?(theme: Theme): void;
    onDidChangeTheme?(event: ThemeChangedEvent): void;
}
export declare const ThemeContribution: unique symbol;
