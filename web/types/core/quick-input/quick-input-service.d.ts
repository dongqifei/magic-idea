import { Emitter } from '../common';
import { QuickPickOptions, InputBoxOptions, QuickPickItem, QuickInputUI, QuickInputService } from "./quick-input-types";
import { QuickAccessRegistry } from "./quick-access-registry";
export declare class QuickInputServiceImpl implements QuickInputService {
    protected readonly registry: QuickAccessRegistry;
    protected readonly ui: QuickInputUI;
    protected readonly onDidHideQuickInputEmitter: Emitter<unknown>;
    constructor(registry: QuickAccessRegistry, ui: QuickInputUI);
    showQuickPick(options: QuickPickOptions): Promise<QuickPickItem | QuickPickItem[] | undefined>;
    showInputBox(options: InputBoxOptions): Promise<string | undefined>;
    hide(): void;
    private getQueryVaule;
    showQuickAccess(input?: string): Promise<any>;
}
