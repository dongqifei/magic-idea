import { inject, injectable, ContainerModule, postConstruct } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { ApplicationShellLayout } from '@capital/core/shell';
import { CommandContribution, CommandRegistry } from '@capital/core/commands';
import { getLogger } from '@capital/core/logger';
import { Widget, } from "@capital/core/widgets";

import "./index.css";

@injectable()
class MagicHelloWorldWidget extends Widget implements CommandContribution {

  private logger = getLogger('MagicHelloWorldWidget');

  constructor(
    @inject(ApplicationShellLayout) private shellLayout: ApplicationShellLayout,
  ) {
    super();
    this.title.label = 'HelloWorld';
    this.node.className = 'magic-helloworld-widget';
    this.node.tabIndex = -1;
    this.node.innerHTML = "此插件展示了如何注册菜单、工具栏、命令以及自定义视图等核心插件能力。";

    this.logger.info("一个简单的 Hello World 插件，用于演示 MagicIDEA 插件系统的基本功能。");
    // 注册活动面板
    this.registerPanel();
  }

  @postConstruct()
  init(): void {
    // 初始化逻辑
  }

  registerPanel() {
    const activityManager = this.shellLayout.activityManager;
    activityManager.registerActivity({
      id: 'magic-helloworld-plugin',
      title: 'HelloWorld',
      iconClass: 'icon icon-helloworld-plugin',
      priority: 100,
      location: 'right-top',
      factory: () => {
        return this;
      }
    });
  }

  registerCommands(registry: CommandRegistry): void {
  }
}

const MagicHelloWorldModule = new ContainerModule(
  (bind: any) => {
  bind(MagicHelloWorldWidget).toSelf().inSingletonScope();

  bind(CommandContribution).toService(MagicHelloWorldWidget);
})
// 注册容器模块到插件中心
regContainerModule(MagicHelloWorldModule);