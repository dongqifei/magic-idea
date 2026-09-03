import { Theme, ThemeChangedEvent, ThemeContribution } from './theme-type';
export declare class ThemeContributionManager {
    private contributions;
    constructor(contributions?: ThemeContribution[]);
    getContributions(): ThemeContribution[];
    add(contribution: ThemeContribution): void;
    activate(theme: Theme): void;
    fireThemeChange(event: ThemeChangedEvent): void;
}
