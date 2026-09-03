/**
 * Breadcrumb widget
 */
import React from "react";
import { CommandRegistry } from "@lumino/commands";
import { ReactWidget } from "../../widgets/react-widget";
export declare class BreadcrumbWidget extends ReactWidget {
    readonly commands: CommandRegistry;
    private _fileInfo;
    /**
     * Construct a new breadcrumb widget.
     */
    constructor(commands: CommandRegistry);
    openCommandCenter(): void;
    protected render(): React.ReactNode;
}
