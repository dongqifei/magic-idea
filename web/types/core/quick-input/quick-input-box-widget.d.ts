import { Widget } from "@lumino/widgets";
import { InputBoxOptions } from "./quick-input-types";
export declare class InputBoxWidget extends Widget {
    private options;
    private resolve;
    private input;
    private focusInputTimer;
    constructor(options: InputBoxOptions, resolve: (value: string | undefined) => void);
    dispose(): void;
    private focusInput;
    private preventFocusLoss;
    private clearFocusInputTimer;
    private globalMouseDown;
    private render;
    private keyboardHandler;
}
