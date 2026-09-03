import { BreakpointManager } from '../core/breakpoint-manager';
import { EditorManager } from "./editor-manager";
import { ApplicationShellLayout } from '..\core\shell';
export declare class MonacoBreakpointIntegrator {
    private breakpointManager;
    private shell;
    private editorManager;
    private _hoverDecorationIds;
    private _disposables;
    constructor(breakpointManager: BreakpointManager, shell: ApplicationShellLayout, editorManager: EditorManager);
    protected _init(): void;
    private _setupEditorBreakpointInteraction;
    /** 显示鼠标悬停时的临时断点装饰 */
    private _showHoverDecoration;
    /** 清除鼠标悬停时的临时断点装饰 */
    private _clearHoverDecoration;
    private _updateBreakpointDecorations;
    dispose(): void;
}
