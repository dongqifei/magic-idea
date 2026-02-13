definePlugin('@plugins/cn.magic-idea.resource.task', ['@capital/shared/inversify', '@capital/core/plugin', '@capital/core/magic-api'], (function (inversify, plugin, magicApi) { 'use strict';

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
  let MagicApiTaskResourceWidget = class {
    registerResource(registry) {
      registry.registerResource({
        type: "task",
        label: "\u5B9A\u65F6\u4EFB\u52A1"
      });
    }
  };
  MagicApiTaskResourceWidget = __decorateClass([
    inversify.injectable()
  ], MagicApiTaskResourceWidget);
  const MagicApiTaskResourceModule = new inversify.ContainerModule((bind) => {
    bind(MagicApiTaskResourceWidget).toSelf().inSingletonScope();
    bind(magicApi.MagicApiResourceContribution).toService(MagicApiTaskResourceWidget);
  });
  plugin.regContainerModule(MagicApiTaskResourceModule);

}));
//# sourceMappingURL=index.js.map
