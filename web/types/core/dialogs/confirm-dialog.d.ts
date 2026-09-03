import { Dialog } from './dialog';
export type ConfirmResult = true | false;
export declare class ConfirmDialog extends Dialog<ConfirmResult> {
    constructor(content: string | React.ReactNode | HTMLElement);
    static openConfirm(content: string | React.ReactNode | HTMLElement): Promise<ConfirmResult>;
}
