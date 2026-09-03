import { inject, injectable, postConstruct } from "@capital/shared/inversify";
import { ApplicationShellLayout } from '@capital/core/shell';
import { CommandContribution, CommandRegistry } from '@capital/core/commands';
import { getLogger } from '@capital/core/logger';
import { Widget, } from "@capital/core/widgets";
import { PreferenceService } from '@capital/core/preferences';
import { EMBEDDED_AGENT_URL_KEY } from './embedded-agent-preference';

import './index.css';

@injectable()
export class EmbeddedAgentWidget extends Widget implements CommandContribution {

  private logger = getLogger('EmbeddedAgentPlugin');

  constructor(
    @inject(ApplicationShellLayout) private shellLayout: ApplicationShellLayout,
    @inject(PreferenceService) private preferenceService: PreferenceService,
  ) {
    super();
    this.title.label = '智能体';
    this.node.className = 'magic-embedded-aAgent';
    this.node.tabIndex = -1;
    this.node.innerHTML = `<iframe src="" style="height: 100%; border: 0; width: 100%; border-radius: 8px;"/>`;

    // 注册活动面板
    this.registerPanel();
  }

  @postConstruct()
  init(): void {
    // 初始化逻辑
    this.preferenceService.ready.then(() => { 
      const uri = this.preferenceService.get<string>(EMBEDDED_AGENT_URL_KEY);
      this.refreshEmbeddedAgent(uri);
    });
    // 监听配置文件修改
    this.preferenceService.onDidPreferenceChanged((e) => {
      if (e.key === EMBEDDED_AGENT_URL_KEY && e.newValue) {
        this.refreshEmbeddedAgent(e.newValue as string);
      }
    });
  }

  registerPanel() {
    const activityManager = this.shellLayout.activityManager;
    activityManager.registerActivity({
      id: 'embedded-agent',
      title: '智能助手',
      iconClass: 'icon icon-embedded-agent',
      priority: 30,
      location: 'right-top',
      toolbarConfig: {
        items: [
          {
            id: 'embedded-agent-refresh',
            type: 'button',
            commandId: 'plugin.embedded-agent.action.refresh'
          }
        ]
      },
      factory: () => {
        return this;
      }
    });
  }

  registerCommands(registry: CommandRegistry): void {
    registry.addCommand("plugin.embedded-agent.action.refresh", {
      label: "重新进入智能体",
      iconClass: 'codicon codicon-refresh',
      execute: () => {
        this.refreshEmbeddedAgent();
      }
    });
  }

  private refreshEmbeddedAgent(src?: string) {
    const iframe = this.node.querySelector('iframe');
    if (iframe) {
      const originalSrc = src || iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = originalSrc;
      }, 0);
      this.logger.debug("重新进入智能体");
    }
  }
}