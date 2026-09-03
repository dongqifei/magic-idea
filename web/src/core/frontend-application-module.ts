/**
 * 依赖注入容器配置
 */
import "reflect-metadata"; // 必须导入，Inversify 依赖反射元数据
import {
  Container,
  ContainerModule,
  interfaces,
} from "inversify";
import { CommandRegistry } from "@lumino/commands";
import { DockPanel } from "@lumino/widgets";
import { bindStatusBar } from "./statusbar";
import { bindAppliconShellModule } from "./shell";
import { bindCommandKeybindModule, KeybindingContribution } from "./keybinding";
import { bindNotificationModule } from "./notification/notification-module";
import { bindPreferencesModule, PreferenceContribution } from "./preferences";
import { bindMagicApiModule } from "./magic-api";
import { bindThemeModule } from "./theme";
import { bindFileSystemModule } from "./filesystem";
import { bindQuickInputModule } from "./quick-input";
import { bindRequsetModule } from "./request";
import { bindCommandsModule } from "./commands";
import {
    bindRootContributionProvider, DefaultResourceProvider, ResourceProvider, ResourceResolver,
    InMemoryResources,
    InMemoryTextResourceResolver,
    UntitledResourceResolver,
} from './common';
import { EnvVariablesServer, envVariablesPath, EnvVariable } from './common/env-variables';
import { WebSocketConnectionProvider } from './browser/messaging';
import { bindUndoRedoModule } from "./undo-redo";
import { bindWorkbenchModule } from "./workbench";
import { bindMessagingFrontendModulebind } from "./browser/messaging/messaging-frontend-module";
import { bindWindowModule } from "./window/browser-window-module";
import { pluginLoader, pluginContainerModule } from "./plugin";
import { DialogOverlayService } from './browser/dialogs';
import { bingCoreMenuModule } from "./menu/browser-menu-module";
import { CommonFrontendContribution } from "./common-frontend-contribution";
import { bindStorageModule } from "./storage";
import { QuickCommandContribution } from "./quick-input";
import { TabBarRenderer, TabBarRendererFactory } from "./shell/tab-bars";
import { MainDockPanel } from "./shell/main-dock-panel";
import { ContextMenuRenderer } from './context-menu-renderer';
import { DockPanelRenderer, DockPanelRendererFactory, ApplicationShellLayoutMigration, ApplicationShellLayoutMigrationError, ShellLayoutTransformer } from "./shell";
import { TabBarToolbarRegistry, TabBarToolbarContribution, TabBarToolbarFactory, TabBarToolbar } from './shell/tab-bar-toolbar';
import { SelectionService } from "./selection-service";
import { SaveableService } from "./saveable-service";
import { ExternalUriService } from './external-uri-service';
import { HttpOpenHandler } from './http-open-handler';
import { HoverService } from "./hover-service";
import {
  DefaultOpenerService,
  OpenerService,
  OpenHandler,
} from "./opener-service";
import {
  bindContributionProvider,
  MenuModelRegistry,
  MenuContribution
} from "./common";
import { ShellLayoutRestorer } from "./shell/shell-layout-restorer";
import { WidgetFactory, WidgetManager } from "./widget-manager";
import { OpenWithService } from "./open-with-service";
import { LabelParser } from "./label-parser";
import {
  LabelProvider,
  LabelProviderContribution,
  DefaultUriLabelProviderContribution,
} from "./label-provider";
import { DiffUriLabelProviderContribution } from './common/diff-uris';
import {
  FrontendApplicationContribution,
  DefaultFrontendApplicationContribution,
} from "./frontend-application-contribution";
import {
  BackendStopwatch,
  Stopwatch,
  DefaultBackendStopwatch,
} from "./performance";
import { MarkdownRenderer, MarkdownRendererFactory, MarkdownRendererImpl } from './markdown-rendering/markdown-renderer';
import { FrontendStopwatch } from "./performance/frontend-stopwatch";
import { FrontendApplication } from "./frontend-application";
import { CommandContribution } from "./commands";
import { ContextKeyService, ContextKeyServiceDummyImpl } from './context-key-service';
import { ContextMenuContext } from "./context-menu-context";
import { CommonPreferencesSchema } from "./common-preferences";
import { BreakpointManager } from "./breakpoint-manager";
import { MonacoInit } from '@MagicIdea/editor/monaco-init';

// 创建容器实例
const container = new Container();

// 创建模块并绑定service
const initAppContainer = async (bindOtherModule: (bind: interfaces.Bind, unbind: any, isBound: any, rebind: any) => void) => {
  const frontendApplicationModule = new ContainerModule(
    (bind: interfaces.Bind, unbind, isBound, rebind) => {
      // 绑定命令服务
      bindCommandsModule(bind);
      // 绑定状态栏模块依赖
      bindStatusBar(bind);
      // 绑定快捷键服务模块依赖
      bindCommandKeybindModule(bind);
      // 绑定消息通知模块依赖
      bindNotificationModule(bind);

      // 绑定菜单模块依赖
      bingCoreMenuModule(bind);

      bind(ContextKeyService).to(ContextKeyServiceDummyImpl).inSingletonScope();
      bind(ContextMenuContext).toSelf().inSingletonScope();

      bind(MenuModelRegistry).toSelf().inSingletonScope();
      bindContributionProvider(bind, MenuContribution);

      bind(Stopwatch).to(FrontendStopwatch).inSingletonScope();
      bind(DefaultBackendStopwatch).toSelf().inSingletonScope();
      bind(BackendStopwatch).to(DefaultBackendStopwatch).inSingletonScope();

      // 绑定前端应用
      bind(FrontendApplication).toSelf().inSingletonScope();
      bind(DefaultFrontendApplicationContribution).toSelf();
      bindContributionProvider(bind, FrontendApplicationContribution);

      bindContributionProvider(bind, TabBarToolbarContribution);
      bind(TabBarToolbarRegistry).toSelf().inSingletonScope();
      bind(FrontendApplicationContribution).toService(TabBarToolbarRegistry);
      bind(TabBarToolbarFactory).toFactory(context => () => {
          const container = context.container.createChild();
          container.bind(TabBarToolbar).toSelf().inSingletonScope();
          return container.get(TabBarToolbar);
      });

      bind(DockPanelRendererFactory).toFactory<DockPanelRenderer, [(Document | ShadowRoot)?]>(context => (document?: Document | ShadowRoot) => {
        const renderer = context.container.get(DockPanelRenderer);
        renderer.document = document;
        return renderer;
      });

      bind(DockPanelRenderer).toSelf();
      bind(TabBarRendererFactory).toFactory(({ container }) => () => {
        const contextMenuRenderer = container.get(ContextMenuRenderer);
        const selectionService = container.get(SelectionService);
        const commandService = container.get<CommandRegistry>(CommandRegistry);
        const contextKeyService: ContextKeyService = container.get(ContextKeyService);
        return new TabBarRenderer(contextMenuRenderer, selectionService, commandService, contextKeyService);
      });

      // 绑定主面板工厂
      bind(MainDockPanel.Factory).toFactory(() => (options?: DockPanel.IOptions, maximizeCallback?: (area: MainDockPanel) => void) => {
        return new MainDockPanel(options, maximizeCallback);
      });

      bind(OpenWithService).toSelf().inSingletonScope();
      bindContributionProvider(bind, OpenHandler);
      bind(DefaultOpenerService).toSelf().inSingletonScope();
      bind(OpenerService).toService(DefaultOpenerService);

      bind(ExternalUriService).toSelf().inSingletonScope();
      bind(HttpOpenHandler).toSelf().inSingletonScope();
      bind(OpenHandler).toService(HttpOpenHandler);
      
      bind(SelectionService).toSelf().inSingletonScope();

      bind(MarkdownRenderer).to(MarkdownRendererImpl).inSingletonScope();
      bind(MarkdownRendererFactory).toFactory(({ container }) => () => container.get(MarkdownRenderer));

      bind(HoverService).toSelf().inSingletonScope();

      bind(SaveableService).toSelf().inSingletonScope();
      bind(FrontendApplicationContribution).toService(SaveableService);

      bindContributionProvider(bind, ApplicationShellLayoutMigration);
      bind<ApplicationShellLayoutMigration>(ApplicationShellLayoutMigration).toConstantValue({
          layoutVersion: 2.0,
          onWillInflateLayout({ layoutVersion }): void {
              throw ApplicationShellLayoutMigrationError.create(
                  `It is not possible to migrate layout of version ${layoutVersion} to version ${this.layoutVersion}.`
              );
          }
      });
      bindContributionProvider(bind, ShellLayoutTransformer);

      bindContributionProvider(bind, WidgetFactory);
      bind(WidgetManager).toSelf().inSingletonScope();

      bind(ShellLayoutRestorer).toSelf().inSingletonScope();
      bind(CommandContribution).toService(ShellLayoutRestorer);

      bind(DefaultResourceProvider).toSelf().inSingletonScope();
      bind(ResourceProvider).toProvider(context => uri => context.container.get(DefaultResourceProvider).get(uri));
      bindRootContributionProvider(bind, ResourceResolver);
      bind(InMemoryResources).toSelf().inSingletonScope();
      bind(ResourceResolver).toService(InMemoryResources);

      bind(InMemoryTextResourceResolver).toSelf().inSingletonScope();
      bind(ResourceResolver).toService(InMemoryTextResourceResolver);

      bind(UntitledResourceResolver).toSelf().inSingletonScope();
      bind(ResourceResolver).toService(UntitledResourceResolver);

      bind(LabelParser).toSelf().inSingletonScope();

      bindContributionProvider(bind, LabelProviderContribution);
      bind(LabelProvider).toSelf().inSingletonScope();
      bind(FrontendApplicationContribution).toService(LabelProvider);
      bind(DefaultUriLabelProviderContribution).toSelf().inSingletonScope();
      bind(LabelProviderContribution).toService(DefaultUriLabelProviderContribution);
      bind(LabelProviderContribution).to(DiffUriLabelProviderContribution).inSingletonScope();

      bind(DialogOverlayService).toSelf().inSingletonScope();
      bind(FrontendApplicationContribution).toService(DialogOverlayService);

      // 绑定消息模块依赖
      bindMessagingFrontendModulebind(bind);

      bind(EnvVariablesServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<EnvVariablesServer>(envVariablesPath);
      }).inSingletonScope();

      // 绑定窗口模块依赖
      bindWindowModule(bind);

      // 绑定主题模块依赖
      bindThemeModule(bind);
      // 绑定文件系统模块依赖
      bindFileSystemModule(bind);
      // 绑定偏好设置模块依赖
      bindPreferencesModule(bind);
      // 绑定本地存储模块依赖
      bindStorageModule(bind);
      // 绑定快速输入模块依赖
      bindQuickInputModule(bind);
      // 绑定全局请求模块依赖
      bindRequsetModule(bind);
      // 绑定应用布局模块
      bindAppliconShellModule(bind);
      // 绑定工作台模块依赖
      bindWorkbenchModule(bind);
      // 绑定撤销重做模块依赖
      bindUndoRedoModule(bind);
      // 绑定魔法API模块依赖
      bindMagicApiModule(bind);
      // 绑定公共模块依赖
      bind(CommonFrontendContribution).toSelf().inSingletonScope();
      [FrontendApplicationContribution, CommandContribution, KeybindingContribution, MenuContribution].forEach(serviceIdentifier =>
        bind(serviceIdentifier).toService(CommonFrontendContribution)
      );

      // 绑定系统公共偏好配置
      bind(PreferenceContribution).toConstantValue({ schema: CommonPreferencesSchema });

      bind(BreakpointManager).toSelf().inSingletonScope();

      // 加载系统扩展模块
      bindOtherModule(bind, unbind, isBound, rebind);
    }
  );

  MonacoInit.init(container);

  // 1) 加载系统模块
  container.load(frontendApplicationModule);
  
  // 2) 加载插件模块
  await pluginLoader.initPlugins();
  for (const module of pluginContainerModule){
    container.load(module);
  }

  // 3)主动 get 一次，触发实例创建和 init 执行
  container.get(QuickCommandContribution);

  // 4) 启动应用
  container.get(FrontendApplication).start();

  return container;
};

export { container, initAppContainer };