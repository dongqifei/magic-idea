import { URI } from '../common/uri';
import { IEvent as Event } from '../common';
import { LabelProviderContribution, DidChangeLabelEvent, LabelProvider } from '../label-provider';
import { FileSystemService } from "../filesystem/file-system-types";
export declare class MagicApiLabelProviderContribution implements LabelProviderContribution {
    private readonly onDidChangeLableEmitter;
    readonly onDidChange: Event<DidChangeLabelEvent>;
    protected readonly fileSystemService: FileSystemService;
    protected readonly labelProvider: LabelProvider;
    constructor();
    protected init(): void;
    canHandle(element: object): number;
    getIconColor(uri: URI): string;
    getIcon(uri: URI): string;
    getLongName(uri: URI): string;
    getName(uri: URI): string;
    affects: (uri: URI, event: DidChangeLabelEvent) => boolean;
    private getResource;
}
