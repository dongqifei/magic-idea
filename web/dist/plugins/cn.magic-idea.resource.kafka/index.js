definePlugin('@plugins/cn.magic-idea.resource.kafka', ['@capital/shared/inversify', '@capital/core/plugin', '@capital/core', '@capital/core/filesystem', '@capital/core/magic-api', 'react', '@capital/core/common'], (function (inversify, plugin, core, filesystem, magicApi, React, common) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

  var css = ".kafka-property-form {\r\n  height: 100%;\r\n  overflow: auto;\r\n}\r\n\r\n.kafka-property-form .form-container{\r\n  height: 100%;\r\n}\r\n\r\n.kafka-property-form .form-content {\r\n  display: flex;\r\n  gap: 12px;\r\n  padding-block: 6px;\r\n}\r\n\r\n.kafka-property-form .form-group {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n}\r\n\r\n.kafka-property-form .form-label {\r\n  text-align: right;\r\n  min-width: 80px;\r\n}\r\n\r\n.kafka-property-form .form-control-wrapper {\r\n  flex: 1;\r\n}\r\n\r\n.kafka-property-form .param-table-section {\r\n  width: 100%;\r\n  height: calc(100% - 42px);\r\n  border-top: 1px solid var(--magic-idea-border-color);\r\n}\r\n\r\n.kafka-property-form .param-table-section .form-control-wrapper {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n.kafka-property-form select.form-control {\r\n  cursor: pointer;\r\n}\r\n";
  n(css,{});

  const KafkaPropertyForm = ({
    fileData,
    onUpdate
  }) => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      onUpdate({ [name]: name === "enabled" ? e.target.checked : value });
    };
    return /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "kafka-property-form"
    }, /* @__PURE__ */ React__default["default"].createElement("form", {
      className: "form-container"
    }, /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-content"
    }, /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u542F\u7528"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "checkbox",
      name: "enabled",
      className: "form-control",
      checked: fileData.enabled,
      onChange: handleChange
    }))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u4E3B\u9898"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "topic",
      className: "form-control",
      style: { width: 250 },
      value: fileData.topic,
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165Topic\u540D\u79F0"
    }))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u6D88\u8D39\u7EC4"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "group",
      className: "form-control",
      style: { width: 200 },
      value: fileData.group || "",
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165\u6D88\u8D39\u7EC4ID"
    }))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u540D\u79F0"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "name",
      className: "form-control",
      style: { width: 250 },
      value: fileData.name,
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165\u540D\u79F0"
    }))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u8DEF\u5F84"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "path",
      className: "form-control",
      style: { width: 350 },
      value: fileData.path || "",
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165\u8DEF\u5F84"
    })))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "param-table-section"
    }, /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("div", {
      style: { width: "100%", height: "100%", padding: 4, boxSizing: "border-box" }
    }, /* @__PURE__ */ React__default["default"].createElement("textarea", {
      className: "form-control",
      name: "description",
      style: { height: "100%" },
      value: fileData.description || "",
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165\u63CF\u8FF0\u4FE1\u606F",
      rows: 10
    }))))));
  };

  var __defProp$2 = Object.defineProperty;
  var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
  var __decorateClass$2 = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp$2(target, key, result);
    return result;
  };
  let KafkaPropertyProvider = class {
    matches(uri) {
      return uri.resourceType === "kafka";
    }
    getFormComponent(fileData, onUpdate) {
      return React.createElement(KafkaPropertyForm, {
        fileData,
        onUpdate
      });
    }
  };
  KafkaPropertyProvider = __decorateClass$2([
    inversify.injectable()
  ], KafkaPropertyProvider);

  var KafkaResourceMetaData;
  (function(KafkaResourceMetaData2) {
    function is(node) {
      if (!common.isObject(node))
        return false;
      return "type" in node && node.type === "kafka" && "groupId" in node && !!node.groupId || "id" in node && "enabled" in node && "topic" in node && "group" in node;
    }
    KafkaResourceMetaData2.is = is;
  })(KafkaResourceMetaData || (KafkaResourceMetaData = {}));

  var __defProp$1 = Object.defineProperty;
  var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
  var __decorateClass$1 = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp$1(target, key, result);
    return result;
  };
  let KafkaResourceLabelProvider = class extends magicApi.ResourceLabelProvider {
    canHandle(element) {
      return KafkaResourceMetaData.is(element) ? 50 : 0;
    }
    getIconColor(node) {
      return "#a2852f";
    }
    getIcon(node) {
      return "KAFKA";
    }
  };
  KafkaResourceLabelProvider = __decorateClass$1([
    inversify.injectable()
  ], KafkaResourceLabelProvider);

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
  let MagicApiKafkaResourceWidget = class {
    registerResource(registry) {
      registry.registerResource({
        type: "kafka",
        label: "Kafka"
      });
    }
  };
  MagicApiKafkaResourceWidget = __decorateClass([
    inversify.injectable()
  ], MagicApiKafkaResourceWidget);
  const MagicApiKafkaResourceModule = new inversify.ContainerModule((bind) => {
    bind(MagicApiKafkaResourceWidget).toSelf().inSingletonScope();
    bind(magicApi.MagicApiResourceContribution).toService(MagicApiKafkaResourceWidget);
    bind(filesystem.FilePropertyProvider).to(KafkaPropertyProvider).inSingletonScope();
    bind(core.LabelProviderContribution).to(KafkaResourceLabelProvider).inSingletonScope();
  });
  plugin.regContainerModule(MagicApiKafkaResourceModule);

}));
