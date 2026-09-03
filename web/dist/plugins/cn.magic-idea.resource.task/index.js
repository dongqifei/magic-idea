definePlugin('@plugins/cn.magic-idea.resource.task', ['@capital/shared/inversify', '@capital/core/plugin', '@capital/core', '@capital/core/filesystem', '@capital/core/magic-api', '@capital/core/notification', 'react', '@capital/core/common'], (function (inversify, plugin, core, filesystem, magicApi, notification, React, common) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

  var css = ".task-property-form {\r\n  height: 100%;\r\n  overflow: auto;\r\n}\r\n\r\n.task-property-form .form-container{\r\n  height: 100%;\r\n}\r\n\r\n.task-property-form .form-content {\r\n  display: flex;\r\n  gap: 12px;\r\n  padding-block: 6px;\r\n}\r\n\r\n.task-property-form .form-group {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n}\r\n\r\n.task-property-form .form-label {\r\n  text-align: right;\r\n  min-width: 80px;\r\n}\r\n\r\n.task-property-form .form-control-wrapper {\r\n  flex: 1;\r\n}\r\n\r\n.task-property-form .param-table-section {\r\n  width: 100%;\r\n  height: calc(100% - 42px);\r\n  border-top: 1px solid var(--magic-idea-border-color);\r\n}\r\n\r\n.task-property-form .param-table-section .form-control-wrapper {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n\r\n.task-property-form .btn-next-runs{\r\n  font-size: 12px;\r\n  cursor: pointer;\r\n  border: none;\r\n  padding: 4px;\r\n  border-radius: 2px;\r\n  min-width: 85px;\r\n  max-width: 160px;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  background-color: transparent;\r\n  color: var(--magic-idea-link-color);\r\n}\r\n\r\n.task-property-form .btn-next-runs:hover{\r\n  color: var(--magic-idea-button-hover-background);\r\n}";
  n(css,{});

  const TaskPropertyForm = ({
    fileData,
    onUpdate,
    message
  }) => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      onUpdate({ [name]: name === "enabled" ? e.target.checked : value });
    };
    const viewCornNextRunTime = () => {
      if (!fileData.cron) {
        message.error("\u8BF7\u586B\u5199cron\u8868\u8FBE\u5F0F");
        return;
      }
      try {
        const nextRuns = common.cronParser(fileData.cron, 5);
        const html = `
        <div>
          <label style="font-weight:bold;">\u4EFB\u52A1\u4E0B\u6B21\u8FD0\u884C\u65F6\u95F4</label>
          <br/>
          ${nextRuns.map((time, i) => `
            <div key="${i}" style="margin:4px 0;">
              ${time}
            </div>
          `).join("")}
        </div>
        `;
        message.info(html);
      } catch (error) {
        message.error("Cron\u8868\u8FBE\u5F0F\u683C\u5F0F\u9519\u8BEF\uFF0C\u793A\u4F8B\uFF1A0 0/5 * * * ? ");
      }
    };
    return /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "task-property-form"
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
    }, "Cron"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper",
      style: { display: "flex" }
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "cron",
      className: "form-control",
      value: fileData.cron,
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165Cron\u8868\u8FBE\u5F0F"
    }), /* @__PURE__ */ React__default["default"].createElement("button", {
      type: "button",
      className: "btn-next-runs",
      onClick: viewCornNextRunTime
    }, "\u4E0B\u6B21\u8FD0\u884C\u65F6\u95F4"))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u4EFB\u52A1\u540D\u79F0"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "name",
      className: "form-control",
      style: { width: 250 },
      value: fileData.name,
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165\u4EFB\u52A1\u540D\u79F0"
    }))), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-group"
    }, /* @__PURE__ */ React__default["default"].createElement("label", {
      className: "form-label"
    }, "\u4EFB\u52A1\u8DEF\u5F84"), /* @__PURE__ */ React__default["default"].createElement("div", {
      className: "form-control-wrapper"
    }, /* @__PURE__ */ React__default["default"].createElement("input", {
      type: "text",
      name: "path",
      className: "form-control",
      style: { width: 350 },
      value: fileData.path || "",
      onChange: handleChange,
      placeholder: "\u8BF7\u8F93\u5165\u4EFB\u52A1\u8DEF\u5F84"
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
      placeholder: "\u8BF7\u8F93\u5165\u4EFB\u52A1\u63CF\u8FF0",
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
  let TaskPropertyProvider = class {
    matches(uri) {
      return uri.resourceType === "task";
    }
    getFormComponent(fileData, onUpdate) {
      return React.createElement(TaskPropertyForm, {
        fileData,
        onUpdate,
        message: this.notificationService
      });
    }
  };
  __decorateClass$2([
    inversify.inject(notification.NotificationService)
  ], TaskPropertyProvider.prototype, "notificationService", 2);
  TaskPropertyProvider = __decorateClass$2([
    inversify.injectable()
  ], TaskPropertyProvider);

  var TaskResourceMetaData;
  (function(TaskResourceMetaData2) {
    function is(node) {
      if (!common.isObject(node))
        return false;
      return "type" in node && node.type === "task" && "groupId" in node && !!node.groupId || "id" in node && "enabled" in node && "cron" in node;
    }
    TaskResourceMetaData2.is = is;
  })(TaskResourceMetaData || (TaskResourceMetaData = {}));

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
  let TaskResourceLabelProvider = class extends magicApi.ResourceLabelProvider {
    canHandle(element) {
      return TaskResourceMetaData.is(element) ? 50 : 0;
    }
    getIconColor(node) {
      return "#8dc149";
    }
    getIcon(node) {
      return "TASK";
    }
  };
  TaskResourceLabelProvider = __decorateClass$1([
    inversify.injectable()
  ], TaskResourceLabelProvider);

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
    bind(filesystem.FilePropertyProvider).to(TaskPropertyProvider).inSingletonScope();
    bind(core.LabelProviderContribution).to(TaskResourceLabelProvider).inSingletonScope();
  });
  plugin.regContainerModule(MagicApiTaskResourceModule);

}));
