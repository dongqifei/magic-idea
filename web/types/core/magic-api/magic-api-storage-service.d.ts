import { StorageService } from '../storage';
import { MagicApiProjectService } from './magic-api-project-service';
export declare class MagicApiStorageService implements StorageService {
    private prefix;
    private initialized;
    protected storageService: StorageService;
    protected projectService: MagicApiProjectService;
    protected init(): void;
    setData<T>(key: string, data: T): Promise<void>;
    getData<T>(key: string, defaultValue?: T): Promise<T | undefined>;
    protected prefixWorkspaceURI(originalKey: string): string;
    protected getPrefix(): string;
    private updatePrefix;
}
