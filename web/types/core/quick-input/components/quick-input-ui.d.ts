import { QuickInputUI, QuickPickOptions, QuickPickItem, InputBoxOptions } from "../quick-input-types";
import "./quick-input-style.css";
export declare class QuickInputUILumino implements QuickInputUI {
    private currentWidget;
    private mask;
    private host;
    constructor();
    showQuickPick(options: QuickPickOptions): Promise<QuickPickItem | QuickPickItem[] | undefined>;
    showInputBox(options: InputBoxOptions): Promise<string | undefined>;
    hide(): void;
    private cleanup;
}
