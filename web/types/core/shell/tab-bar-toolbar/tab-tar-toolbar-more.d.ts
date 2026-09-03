import * as React from "react";
import { Widget } from "@lumino/widgets";
interface TabBarToolbarMoreProps {
    current: Widget | undefined;
    isMore: boolean;
    inline: any[];
    onShowMoreContextMenu: (e: React.MouseEvent) => void;
}
export declare const TabBarToolbarMore: React.FC<TabBarToolbarMoreProps>;
export {};
