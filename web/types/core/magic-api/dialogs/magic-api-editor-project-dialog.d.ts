import { Dialog } from '..\..\dialogs';
import { IJSONSchema } from '..\..\common\json-schema';
export type EditProjectResult = {
    id: string;
    name: string;
    url: string;
    webPath: string;
    proxyEnable: boolean;
};
export declare class MagicApiEditProjectDialog extends Dialog<EditProjectResult> {
    constructor(title: string, schema: IJSONSchema);
    protected renderNode(schema: IJSONSchema): void;
    static openEditProjectDialog(title: string, message: IJSONSchema): Promise<EditProjectResult | undefined>;
}
