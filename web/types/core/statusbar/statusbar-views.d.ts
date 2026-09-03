import * as React from 'react';
import { StatusBarItem } from './statusbar-types';
import { HoverService } from '../hover-service';
interface StatusBarComponentProps {
    items: StatusBarItem[];
    hoverService: HoverService;
    onItemClick: (e: MouseEvent, id: string) => void;
}
/**
 * 状态栏组件(仅提供UI渲染，不处理业务逻辑)
 */
export declare const StatusBarComponent: React.FC<StatusBarComponentProps>;
export {};
