definePlugin('@plugins/cn.magic-idea.embedded-agent', ['exports', '@capital/shared/inversify', '@capital/core/plugin', '@capital/core/shell', '@capital/core/commands', '@capital/core/logger', '@capital/core/widgets', '@capital/core/preferences'], (function (exports, inversify, plugin, shell, commands, logger, widgets, preferences) { 'use strict';

  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp(target, key, result);
    return result;
  };
  var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
  const EmbeddedAgentPreferencesSchema = {
    "title": "\u5185\u5D4C\u667A\u80FD\u4F53",
    "properties": {
      "extensions.embedded-agent.agentUrl": {
        "type": "string",
        "default": "https://yuanqi.tencent.com/agent/m5fSqCnzYVca",
        "title": "\u667A\u80FD\u4F53\u5730\u5740",
        "description": "\u7B2C\u4E09\u65B9\u667A\u80FD\u4F53\u5E73\u53F0\u53D1\u5E03\u7684\u670D\u52A1\u5730\u5740"
      }
    }
  };
  const EMBEDDED_AGENT_URL_KEY = "extensions.embedded-agent.agentUrl";
  let EmbeddedAgentWidget = class extends widgets.Widget {
    constructor(shellLayout, preferenceService) {
      super();
      this.shellLayout = shellLayout;
      this.preferenceService = preferenceService;
      this.logger = logger.getLogger("TencentYuanQiPlugin");
      this.title.label = "\u667A\u80FD\u4F53";
      this.node.className = "tencent-yuanqi-view";
      this.node.tabIndex = -1;
      this.node.innerHTML = `<iframe src="" style="height: 100%; border: 0; width: 100%; border-radius: 8px;"/>`;
      this.registerPanel();
    }
    init() {
      this.preferenceService.ready.then(() => {
        const uri = this.preferenceService.get(EMBEDDED_AGENT_URL_KEY);
        this.refreshEmbeddedAgent(uri);
      });
      this.preferenceService.onDidPreferenceChanged((e) => {
        if (e.key === EMBEDDED_AGENT_URL_KEY && e.newValue) {
          this.refreshEmbeddedAgent(e.newValue);
        }
      });
    }
    registerPanel() {
      const activityManager = this.shellLayout.activityManager;
      activityManager.registerActivity({
        id: "embedded-agent",
        title: "\u667A\u80FD\u52A9\u624B",
        iconClass: "codicon codicon-agent",
        priority: 30,
        location: "right-top",
        toolbarConfig: {
          items: [
            {
              id: "embedded-agent-refresh",
              type: "button",
              commandId: "plugin.embedded-agent.action.refresh"
            }
          ]
        },
        factory: () => {
          return this;
        }
      });
    }
    registerCommands(registry) {
      registry.addCommand("plugin.embedded-agent.action.refresh", {
        label: "\u91CD\u65B0\u8FDB\u5165\u667A\u80FD\u4F53",
        iconClass: "codicon codicon-refresh",
        execute: () => {
          this.refreshEmbeddedAgent();
        }
      });
    }
    refreshEmbeddedAgent(src) {
      const iframe = this.node.querySelector("iframe");
      if (iframe) {
        const originalSrc = src || iframe.src;
        iframe.src = "about:blank";
        setTimeout(() => {
          iframe.src = originalSrc;
        }, 0);
        this.logger.debug("\u91CD\u65B0\u8FDB\u5165\u667A\u80FD\u4F53");
      }
    }
  };
  __decorateClass([
    inversify.postConstruct()
  ], EmbeddedAgentWidget.prototype, "init", 1);
  EmbeddedAgentWidget = __decorateClass([
    inversify.injectable(),
    __decorateParam(0, inversify.inject(shell.ApplicationShellLayout)),
    __decorateParam(1, inversify.inject(preferences.PreferenceService))
  ], EmbeddedAgentWidget);
  const EmbeddedAgentModule = new inversify.ContainerModule((bind) => {
    bind(EmbeddedAgentWidget).toSelf().inSingletonScope();
    bind(commands.CommandContribution).toService(EmbeddedAgentWidget);
    bind(preferences.PreferenceContribution).toConstantValue({ schema: EmbeddedAgentPreferencesSchema });
  });
  plugin.regContainerModule(EmbeddedAgentModule);

  exports.EMBEDDED_AGENT_URL_KEY = EMBEDDED_AGENT_URL_KEY;
  exports.EmbeddedAgentPreferencesSchema = EmbeddedAgentPreferencesSchema;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
