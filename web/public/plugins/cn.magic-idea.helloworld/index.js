definePlugin('@plugins/cn.magic-idea.helloworld', ['@capital/shared/inversify', '@capital/core/plugin', '@capital/core/shell', '@capital/core/commands', '@capital/core/logger', '@capital/core/widgets'], (function (inversify, plugin, shell, commands, logger, widgets) { 'use strict';

  var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

  var css = ".icon-helloworld-plugin{\r\n  background-image: url(data:image/png;base64,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);\r\n}";
  n(css,{});

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
  let MagicHelloWorldWidget = class extends widgets.Widget {
    constructor(shellLayout) {
      super();
      this.shellLayout = shellLayout;
      this.logger = logger.getLogger("MagicHelloWorldWidget");
      this.title.label = "HelloWorld";
      this.node.className = "magic-helloworld-widget";
      this.node.tabIndex = -1;
      this.node.innerHTML = "\u6B64\u63D2\u4EF6\u5C55\u793A\u4E86\u5982\u4F55\u6CE8\u518C\u83DC\u5355\u3001\u5DE5\u5177\u680F\u3001\u547D\u4EE4\u4EE5\u53CA\u81EA\u5B9A\u4E49\u89C6\u56FE\u7B49\u6838\u5FC3\u63D2\u4EF6\u80FD\u529B\u3002";
      this.logger.info("\u4E00\u4E2A\u7B80\u5355\u7684 Hello World \u63D2\u4EF6\uFF0C\u7528\u4E8E\u6F14\u793A MagicIDEA \u63D2\u4EF6\u7CFB\u7EDF\u7684\u57FA\u672C\u529F\u80FD\u3002");
      this.registerPanel();
    }
    init() {
    }
    registerPanel() {
      const activityManager = this.shellLayout.activityManager;
      activityManager.registerActivity({
        id: "magic-helloworld-plugin",
        title: "HelloWorld",
        iconClass: "icon icon-helloworld-plugin",
        priority: 100,
        location: "right-top",
        factory: () => {
          return this;
        }
      });
    }
    registerCommands(registry) {
    }
  };
  __decorateClass([
    inversify.postConstruct()
  ], MagicHelloWorldWidget.prototype, "init", 1);
  MagicHelloWorldWidget = __decorateClass([
    inversify.injectable(),
    __decorateParam(0, inversify.inject(shell.ApplicationShellLayout))
  ], MagicHelloWorldWidget);
  const MagicHelloWorldModule = new inversify.ContainerModule((bind) => {
    bind(MagicHelloWorldWidget).toSelf().inSingletonScope();
    bind(commands.CommandContribution).toService(MagicHelloWorldWidget);
  });
  plugin.regContainerModule(MagicHelloWorldModule);

}));
//# sourceMappingURL=index.js.map
