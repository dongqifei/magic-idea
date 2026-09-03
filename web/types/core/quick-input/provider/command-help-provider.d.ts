import { QuickAccessProvider } from "../quick-access-registry";
import { QuickPickItem } from "../quick-input-types";
export declare class HelpQuickAccessProvider implements QuickAccessProvider {
    prefix: string;
    placeholder: string;
    private providers;
    constructor(providers: QuickAccessProvider[]);
    provide(input: string): Promise<QuickPickItem[]>;
}
