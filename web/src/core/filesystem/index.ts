import { interfaces } from 'inversify';
import { bindContributionProvider } from "../common/contribution-provider";
import { FileSystemService } from './file-system-types';
import { SimpleFileSystemService, DefaultFilePropertyProvider, DefaultFileSystemProvider } from './file-system-service';
import { FilePersistenceService } from './file-persistence-service';
import { FileSystemProvider, FilePropertyProvider } from './file-system-types';
import { FileRunService, FileRunServiceProvider, FileRunServiceImpl } from './file-run-service';

export * from './file-system-types';
export * from './file-system-service';
export * from './file-persistence-service';
export * from './file-run-service';

/**
 * 绑定文件系统模块依赖
 * @param bind 
 */
export function bindFileSystemModule(bind: interfaces.Bind): void {
    // 绑定API文件属性提供者
    bind(FilePropertyProvider).to(DefaultFilePropertyProvider).inSingletonScope();
    bind(FileSystemProvider).to(DefaultFileSystemProvider).inSingletonScope();
    // 绑定文件系统服务接口实现
    bind(FileSystemService).to(SimpleFileSystemService).inSingletonScope();
    bind(FilePersistenceService).toSelf().inSingletonScope();
    // 绑定文件运行服务
    bind(FileRunService).to(FileRunServiceImpl).inSingletonScope();
    // 注册文件运行处理程序提供者
    bindContributionProvider(bind, FileRunServiceProvider);
}
