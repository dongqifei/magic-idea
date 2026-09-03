import { injectable, inject, postConstruct } from "inversify";
import { URI } from '../common/uri';
import { IEvent as Event, Emitter } from '../common';
import { LabelProviderContribution, DidChangeLabelEvent, LabelProvider } from '../label-provider';
import { FileData, FileSystemService } from "../filesystem/file-system-types";

@injectable()
export class MagicApiLabelProviderContribution implements LabelProviderContribution { 

  private readonly onDidChangeLableEmitter = new Emitter<DidChangeLabelEvent>();

  readonly onDidChange: Event<DidChangeLabelEvent> = this.onDidChangeLableEmitter.event;

  @inject(FileSystemService)
  protected readonly fileSystemService: FileSystemService;

  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;

  constructor(){}

  @postConstruct()
  protected init(): void { 
    this.fileSystemService.onDidFileDataChange.connect(
      (_, event) => { 
        this.onDidChangeLableEmitter.fire({
          affects: uri => this.canHandle(uri) > 0
        });
      }
    );
  }

  canHandle(element: object): number { 
    if(element instanceof URI && element.scheme === 'file'){
      return 100;
    }
    return 0;
  }

  getIconColor(uri: URI): string { 
    const filedata = this.getResource(uri);
    if(!filedata){
      return '';
    }
    return this.labelProvider.getIconColor(filedata);
  }

  getIcon(uri: URI): string { 
    const filedata = this.getResource(uri);
    if(!filedata){
      return '';
    }
    return this.labelProvider.getIcon(filedata);
  }

  getLongName(uri: URI): string {
    const longName = uri.path.toString();
    const node = this.getResource(uri);
    if(node && typeof node === 'object' && 'description' in node && node.description){
      return `${longName} (${node.description})`;
    }
    return longName;
  }

  getName(uri: URI): string { 
    const filedata = this.getResource(uri);
    return filedata?.name || uri.fileName;
  }

  affects: (uri: URI, event: DidChangeLabelEvent) => boolean = (uri, event) => {
    return false;
  }

  private getResource(uri: URI): FileData | undefined {
    return this.fileSystemService.getFileData(uri);
  }
}