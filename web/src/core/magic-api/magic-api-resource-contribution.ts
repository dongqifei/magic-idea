import { injectable, inject } from "inversify";
import { ResourceRegistry } from "./magic-api-resource-service";
import { MagicApiTreeModel } from './magic-api-tree-model';
import { loadMagicScriptLanguage } from './language/magic-script';
import javaClass from './language/magic-script/editor/java-class';

/**
 * MagicApi资源贡献点
 */
export interface MagicApiResourceContribution {

  registerResource(registry: ResourceRegistry): void;
}

export const MagicApiResourceContribution = Symbol('MagicApiResourceContribution');

@injectable()
export abstract class DefaultMagicApiResourceContribution implements MagicApiResourceContribution {
  constructor(
    @inject(MagicApiTreeModel) private treeModel: MagicApiTreeModel
  ) {
    this.treeModel.setResourceUpdateCallback(() => {
      // 整理资源并设置到 java-class
      const { apis, functions } = treeModel.getFormattedResources();
      javaClass.setImportResources({ apis, functions });
    });
    // 加载MagicScript语言
    loadMagicScriptLanguage();
  }

  /**
   * 注册系统内置资源
   * @param registry 
   */
  registerResource(registry: ResourceRegistry): void {
    registry.registerResource({
      type: "api",
      label: "接口"
    });
    registry.registerResource({
      type: "function",
      label: "函数"
    });
  }
}