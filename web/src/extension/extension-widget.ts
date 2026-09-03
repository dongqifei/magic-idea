import { injectable, inject, postConstruct, interfaces } from 'inversify';
import { createElement } from "react";
import { AccordionPanel } from "@lumino/widgets";

import { ReactWidget } from '@MagicIdea/core/widgets/react-widget';
import { ApplicationShellLayout } from '@MagicIdea/core/shell/application-shell';
import { PluginManager, pluginManager, PluginManifest } from '@MagicIdea/core/plugin';
import { ExtensionView } from './extension-views';
import { Extension } from './extension-types';
import { CommandContribution, CommandRegistry } from '@MagicIdea/core/commands';
import { KeybindingContribution, KeybindingRegistry } from '@MagicIdea/core/keybinding';
import { InstallRemoteExtensionDialog } from './extension-dialog';
import { NotificationService } from '@MagicIdea/core/notification';

// 所有插件数据
export const allPlugins: PluginManifest[] = [
  {
    "label": "Code formatter",
    "name": "cn.magic-idea.code-formatter",
    "url": "plugins/cn.magic-idea.code-formatter/index.js",
    "icon": "plugins/cn.magic-idea.code-formatter/assets/icon.png",
    "version": "1.0.0",
    "description": "Code formatter using js-beautify",
    "author": "amofly",
    "requireRestart": true,
  },
  {
    "label": "定时任务",
    "name": "cn.magic-idea.resource.task",
    "url": "plugins/cn.magic-idea.resource.task/index.js",
    "icon": "plugins/cn.magic-idea.resource.task/assets/icon.png",
    "version": "1.0.0",
    "description": "管理系统定时任务资源信息",
    "author": "amofly",
    "requireRestart": false
  },
  {
    "label": "RocketMQ",
    "name": "cn.magic-idea.resource.rocketmq",
    "url": "plugins/cn.magic-idea.resource.rocketmq/index.js",
    "icon": "plugins/cn.magic-idea.resource.rocketmq/assets/icon.png",
    "version": "1.0.0",
    "description": "管理RocketMQ消息队列资源信息",
    "author": "amofly",
    "requireRestart": false
  },
  {
    "label": "Kafka",
    "name": "cn.magic-idea.resource.kafka",
    "url": "plugins/cn.magic-idea.resource.kafka/index.js",
    "icon": "plugins/cn.magic-idea.resource.kafka/assets/icon.png",
    "version": "1.0.0",
    "description": "管理Kafka消息队列资源信息",
    "author": "amofly",
    "requireRestart": false
  },
  {
    "label": "MQTT",
    "name": "cn.magic-idea.resource.mqtt",
    "url": "plugins/cn.magic-idea.resource.mqtt/index.js",
    "icon": "plugins/cn.magic-idea.resource.mqtt/assets/icon.png",
    "version": "1.0.0",
    "description": "管理MQTT消息队列资源信息",
    "author": "amofly",
    "requireRestart": false
  },
  {
    "label": "RabbitMQ",
    "name": "cn.magic-idea.resource.rabbitmq",
    "url": "plugins/cn.magic-idea.resource.rabbitmq/index.js",
    "icon": "plugins/cn.magic-idea.resource.rabbitmq/assets/icon.svg",
    "version": "1.0.0",
    "description": "管理RabbitMQ消息队列资源信息",
    "author": "amofly",
    "requireRestart": true
  }
  // {
  //   "label": "工作流",
  //   "name": "cn.magic-idea.turbo-flow",
  //   "url": "plugins/cn.magic-idea.turbo-flow/index.js",
  //   "icon": "plugins/cn.magic-idea.turbo-flow/assets/icon.svg",
  //   "version": "1.0.0",
  //   "author": "amofly",
  //   "description": "基于didi/turbo实现的工作流插件。",
  //   "requireRestart": true
  // }
]

export class ExtensionDataWidget extends ReactWidget {

  private _plugins: Extension[] = [];

  constructor(private notification: NotificationService, protected pluginManager: PluginManager, protected flag: boolean) {
    super();
    this.title.label = flag ? '已安装': '推荐';
    this.addClass('extension-data-widget');
    this.node.style.minHeight = '120px';
    this.pluginManager.onDidUpdatePlugins(() => {
      this.initPlugins();
    });
    this.initPlugins();
  }

  async initPlugins(): Promise<void> { 
    const installedPlugins = await this.pluginManager.getInstalledPlugins();
    const filterInstalledPlugins = installedPlugins.map(plugin => ({
      ...plugin,
      isInstalled: true,
    }));
    if(this.flag){
      this._plugins = filterInstalledPlugins;
    }else{
      // 未安装（根据所有插件和已安装的集合中过滤出未安装的插件）
      const uninstallPlugin = this.filterUninstalledPlugins(filterInstalledPlugins);
      this._plugins = [...uninstallPlugin];
    }
    this.update();
  }

  private async handleInstallPlugin(plugin: Extension | string): Promise<void> {
    const manifest = this._plugins.find(p => p.name === plugin);
    if(!manifest) {
      console.error('插件不存在');
      return;
    }
    await this.pluginManager.installPlugin(manifest);
    let messageText = `扩展 ${manifest.label} 安装成功`;
    if(manifest.requireRestart){
      messageText += '，请重启IDEA以应用更改';
    }
    this.notification.success(messageText, {
      timeout: 0,
      source: "扩展中心",
      actions: [
        {
          label: "立即重启",
          type: "primary",
          callback: () => {
            window.location.reload();
          },
        },
      ],
    });
  }

  private async handleUnInstallPlugin(pluginName: string): Promise<void> {
    try {
      await this.pluginManager.uninstallPlugin(pluginName);
      this.notification.success(`扩展 ${pluginName} 卸载成功，请重启IDEA以应用更改`, {
        timeout: 0,
        source: "扩展中心",
        actions: [
          {
            label: "立即重启",
            type: "primary",
            callback: () => {
              window.location.reload();
            },
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  }
  
  protected render() {
    return createElement(ExtensionView, {
      plugins: this._plugins,
      onInstallPlugin: async (pluginName: string) => {
        this.handleInstallPlugin(pluginName);
      },
      onUnInstallPlugin: async (pluginName: string) => {
        this.handleUnInstallPlugin(pluginName);
      },
    });
  }

  private filterUninstalledPlugins(filterInstalledPlugins: PluginManifest[]): Extension[]{
    return allPlugins
    .filter(
      (plugin) =>
       !this.isPluginInstalled(plugin.name, filterInstalledPlugins)
    )
    .map(plugin => ({
      ...plugin,
      isInstalled: this.isPluginInstalled(plugin.name, filterInstalledPlugins),
    }));
  }

  private isPluginInstalled(pluginName: string, filterInstalledPlugins: PluginManifest[]): boolean { 
    return filterInstalledPlugins.some(p => p.name === pluginName);
  }
}

@injectable()
export class ExtensionWidget extends AccordionPanel implements CommandContribution, KeybindingContribution {

  private extensionPanel: any;

  private installedDataWidget: ExtensionDataWidget;
  private uninstalledDataWidget: ExtensionDataWidget;

  private readonly pluginManager: PluginManager;

  constructor(
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(NotificationService) private notification: NotificationService,
  ) {
    super();
    this.pluginManager = pluginManager;

    this.pluginManager.onDidLoadPluginError(err => {
      this.notification.error("加载 "+ err.pluginName+" 扩展失败: " + err.detail.stack, {
        timeout: 0,
        source: "扩展中心",
        actions: [
          {
            label: "卸载",
            type: "primary",
            callback: () => {
              this.pluginManager.uninstallPlugin(err.pluginName);
            },
          },
        ],
      });
    });

    this.installedDataWidget = new ExtensionDataWidget(this.notification, this.pluginManager, true);
    this.uninstalledDataWidget = new ExtensionDataWidget(this.notification, this.pluginManager, false);
    this.addWidget(this.installedDataWidget);
    this.addWidget(this.uninstalledDataWidget);
  }

  @postConstruct()
  init() {
    this.registerActivePanel();
  }

  
  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.extensionPanel = activityManager.registerActivity({
      id: 'extensions',
      title: '扩展',
      iconClass: 'codicon codicon-extensions',
      priority: 30,
      location: 'left-top',
      toolbarConfig: {
        showTitle: true,
        items: [
          {
            id: 'extension-install-toolbar-item',
            type: 'button',
            commandId: 'extension.action.install',
          },
          {
            id: 'extension-refresh-toolbar-item',
            type: 'button',
            commandId: 'extension.action.refresh',
          }
        ]
      },
      factory: () => {
        return this;
      },
    });
  }

  registerCommands(commands: CommandRegistry): void {
    commands.addCommand('view:extensions', { 
      label: '扩展',
      execute: () => {
        this.extensionPanel.open();
      }
    })
    commands.addCommand('extension.action.refresh', {
      label: '刷新',
      iconClass: 'codicon codicon-refresh',
      execute: () => {
        this.installedDataWidget.initPlugins();
        this.uninstalledDataWidget.initPlugins();
      }
    })
    commands.addCommand('extension.action.install', {
      label: '安装远程扩展...',
      iconClass: 'codicon codicon-json',
      execute: () => {
        // 从 JSON 安装
        const jsonText = document.createElement('textarea');
        jsonText.className = 'form-control';
        jsonText.style.height = '300px';
        jsonText.placeholder = `{
  "name": "com.msgbyte.webview",
  "label": "WebView",
  "description": "WebView 插件",
  "url": "http://localhost:3000/plugins/com.msgbyte.webview/index.js",
  "icon": "http://localhost:3000/plugins/com.msgbyte.webview/icon.png",
  "version": "1.0.0",
  "requireRestart": true
}`;
        InstallRemoteExtensionDialog.openConfirm(jsonText).then(async (result) => { 
          if(result){
            this.installFromJsonPlugin(result);
          }
        });
      }
    })
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: 'view:extensions',
      keybinding: 'ctrl+shift+x',
    });
  }

  // 安装来自 JSON 的插件
  private async installFromJsonPlugin(plugin: string): Promise<void> {
    // 解析 JSON
    try {
      const pluginJson = JSON.parse(plugin);
      // 验证必填字段
      const requiredFields = ['label', 'name', 'url', 'version', 'description'];
      const missingFields = requiredFields.filter(field => !pluginJson[field]);
      if (missingFields.length > 0) {
        this.notification.error(`远程扩展配置中缺少必填字段: ${missingFields.join(', ')}`);
        return;
      }
      if (typeof pluginJson.url !== 'string' || !pluginJson.url.endsWith('.js')) {
        this.notification.error('远程扩展配置中URL(url)格式不正确，应以".js"结尾');
        return;
      }
      // 验证 icon 字段（如果存在）
      if (pluginJson.icon && typeof pluginJson.icon !== 'string') {
        this.notification.error('远程扩展配置中图标(icon)格式不正确，应为网络地址');
        return;
      }
      await this.pluginManager.installPlugin(pluginJson as PluginManifest);
      this.notification.success(`扩展 ${pluginJson.name} 安装成功！`);
    } catch (error) {
      this.notification.error('安装远程扩展失败: ' + error);
    }
  }
}

/**
 * 绑定接口依赖
 * @param bind 
 */
export function bindExtensionModule(bind: interfaces.Bind): void {
  // 绑定 Widget
  bind(ExtensionWidget).to(ExtensionWidget).inSingletonScope();

  [CommandContribution, KeybindingContribution].forEach(serviceIdentifier =>
    bind(serviceIdentifier).toService(ExtensionWidget)
  );
}
