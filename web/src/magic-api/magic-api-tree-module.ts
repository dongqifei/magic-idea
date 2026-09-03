import { interfaces } from 'inversify';
import { CommandContribution } from '@MagicIdea/core/commands';
import { LabelProviderContribution } from '@MagicIdea/core/label-provider';
import { MenuContribution } from '@MagicIdea/core/common';
import { PreferenceContribution } from '@MagicIdea/core/preferences/preference-contribution';

import { MagicApiExplorerWidget } from './magic-api-explorer-widget';
import { ApiFileApiPropertyProvider, ApiFileFunctionPropertyProvider } from './provider/magic-api-property-provider';
import { MagicApiTreeService } from './magic-api-tree-types';
import { MagicApiTreeServiceImpl } from './magic-api-tree-service';

import { FileSystemProvider, FileRunServiceProvider, FilePropertyProvider } from '../core/filesystem';
import { ApiFileSystemProvider } from './provider/magic-api-file-system-provider';
import { MagicApiRunServiceProvider } from './provider/magic-api-run-service-provider';
import { MagicApiCommandContribution } from './magic-api-commands';

import { MagicApiDatasourceWidget } from './magic-api-datasource-widget';
import { MagicApiGlobalPreferencesSchema } from './magic-api-global-preferences';
import { ApiResourceLabelProvider, FunctionResourceLabelProvider } from './provider/magic-api-resource-label-provider';

/**
 * 绑定接口资源器接口依赖
 * @param bind 
 */
export function bindApiTreeModule(bind: interfaces.Bind): void {
  bind(ApiResourceLabelProvider).toSelf().inSingletonScope();
  bind(FunctionResourceLabelProvider).toSelf().inSingletonScope();
  bind(LabelProviderContribution).toService(ApiResourceLabelProvider);
  bind(LabelProviderContribution).toService(FunctionResourceLabelProvider);
  
  // 绑定控制层
  bind(MagicApiTreeService).to(MagicApiTreeServiceImpl).inSingletonScope();
  bind(MagicApiExplorerWidget).toSelf().inSingletonScope();
  bind(FileSystemProvider).to(ApiFileSystemProvider).inSingletonScope();
  bind(MagicApiDatasourceWidget).toSelf().inSingletonScope();

  bind(MagicApiCommandContribution).toSelf().inSingletonScope();
  [CommandContribution, MenuContribution].forEach(serviceIdentifier =>
    bind(serviceIdentifier).toService(MagicApiCommandContribution)
  );
  [CommandContribution].forEach(serviceIdentifier =>
    bind(serviceIdentifier).toService(MagicApiDatasourceWidget)
  );

  // 绑定API文件属性提供者
  bind(FilePropertyProvider).to(ApiFileApiPropertyProvider).inSingletonScope();
  bind(FilePropertyProvider).to(ApiFileFunctionPropertyProvider).inSingletonScope();
  // 绑定API运行服务提供者
  bind(FileRunServiceProvider).to(MagicApiRunServiceProvider).inSingletonScope();

  // 绑定MagicApi偏好配置
  bind(PreferenceContribution).toConstantValue({ schema: MagicApiGlobalPreferencesSchema });
}
