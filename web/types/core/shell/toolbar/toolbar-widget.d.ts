import { CommandRegistry } from "@lumino/commands";
import { ReactWidget } from "../../widgets/react-widget";
import { ToolbarService } from "./toolbar-types";
import { ActivityManager } from "../../nav-activity/nav-activity-manager";
export declare class ToolbarWidget extends ReactWidget {
    private commands;
    private toolbarService;
    private activityManager;
    private disposables;
    constructor(commands: CommandRegistry, toolbarService: ToolbarService, activityManager: ActivityManager);
    /** 重写渲染方法 */
    protected render(): React.ReactNode;
    /** 销毁时清理资源 */
    dispose(): void;
}
