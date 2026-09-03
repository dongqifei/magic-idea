import { ISignal } from '@lumino/signaling';
import URI from "./common/uri";
import { CommandRegistry } from "@lumino/commands";
export interface Breakpoint {
    readonly resourceUri: URI;
    readonly lineNumber: number;
    enabled: boolean;
    condition?: string;
}
export declare class BreakpointManager {
    private readonly commands;
    private _breakpoints;
    private _onDidChangeBreakpoints;
    constructor(commands: CommandRegistry);
    get onDidChangeBreakpoints(): ISignal<this, {
        resourceUri: URI;
        breakpoints: Breakpoint[];
    }>;
    getBreakpoints(resourceUri: URI): Breakpoint[];
    toggleBreakpoint(resourceUri: URI, lineNumber: number): Breakpoint | undefined;
    clearAllBreakpoints(): void;
    updateAllBreakpointStatus(enabled: boolean): void;
    private fireBreakpointChangeEvent;
}
