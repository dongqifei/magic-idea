import { interfaces } from 'inversify';
import { StorageService, LocalStorageService } from './storage-service';

export * from './storage-service';

/**
 * 绑定本地储存接口依赖
 * @param bind 
 */
export function bindStorageModule(bind: interfaces.Bind): void {
    bind(StorageService).to(LocalStorageService).inSingletonScope();
}
