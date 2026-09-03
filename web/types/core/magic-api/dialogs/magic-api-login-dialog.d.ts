import { Dialog } from '..\..\dialogs';
import { IJSONSchema } from '..\..\common\json-schema';
export type LoginFormResult = {
    username: string;
    password: string;
};
export declare class MagicApiLoginDialog extends Dialog<LoginFormResult> {
    constructor(title: string, schema: IJSONSchema);
    protected renderNode(schema: IJSONSchema): void;
    static openLoginDialog(title: string, message: IJSONSchema): Promise<LoginFormResult | undefined>;
}
