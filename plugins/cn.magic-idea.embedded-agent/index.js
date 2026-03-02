definePlugin('@plugins/cn.magic-idea.embedded-agent', ['@capital/core/preferences', '@capital/shared/inversify', '@capital/core/plugin', '@capital/core/shell', '@capital/core/logger', '@capital/core/widgets', '@capital/core/commands', '@capital/core', '@capital/core/common', '@capital/shared/monaco-editor'], (function (preferences, inversify, plugin, shell, logger, widgets, commands, core, common, monaco) { 'use strict';

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var monaco__namespace = /*#__PURE__*/_interopNamespace(monaco);

  const EMBEDDED_AGENT_URL_KEY = "extensions.embedded-agent.agentUrl";
  const EmbeddedAgentPreferencesSchema = {
    "title": "\u5185\u5D4C\u667A\u80FD\u4F53",
    "properties": {
      [EMBEDDED_AGENT_URL_KEY]: {
        "type": "string",
        "default": "https://yuanqi.tencent.com/agent/m5fSqCnzYVca",
        "title": "\u667A\u80FD\u4F53\u5730\u5740",
        "description": "\u7B2C\u4E09\u65B9\u667A\u80FD\u4F53\u5E73\u53F0\u53D1\u5E03\u7684\u670D\u52A1\u5730\u5740"
      }
    }
  };

  var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

  var css = ".icon-embedded-agent{\r\n  background-image: url(data:image/png;base64,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);\r\n}";
  n(css,{});

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
  var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
  let EmbeddedAgentWidget = class extends widgets.Widget {
    constructor(shellLayout, preferenceService) {
      super();
      this.shellLayout = shellLayout;
      this.preferenceService = preferenceService;
      this.logger = logger.getLogger("EmbeddedAgentPlugin");
      this.title.label = "\u667A\u80FD\u4F53";
      this.node.className = "magic-embedded-aAgent";
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
        iconClass: "icon icon-embedded-agent",
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
  __decorateClass$2([
    inversify.postConstruct()
  ], EmbeddedAgentWidget.prototype, "init", 1);
  EmbeddedAgentWidget = __decorateClass$2([
    inversify.injectable(),
    __decorateParam(0, inversify.inject(shell.ApplicationShellLayout)),
    __decorateParam(1, inversify.inject(preferences.PreferenceService))
  ], EmbeddedAgentWidget);

  const PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE = "extensions.ai-features.codeCompletion.automaticCodeCompletion";
  const PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY = "extensions.ai-features.codeCompletion.debounceDelay";
  const PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS = "extensions.ai-features.codeCompletion.excludedFileExtensions";
  const PREF_AI_INLINE_COMPLETION_MAX_CONTEXT_LINES = "extensions.ai-features.codeCompletion.maxContextLines";
  const PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS = "extensions.ai-features.codeCompletion.stripBackticks";
  const PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY = "extensions.ai-features.codeCompletion.cacheCapacity";
  const AI_CORE_PREFERENCES_TITLE = "\u4EE3\u7801\u667A\u80FD\u8865\u5168";
  const AICodeCompletionPreferencesSchema = {
    title: AI_CORE_PREFERENCES_TITLE,
    properties: {
      [PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE]: {
        title: AI_CORE_PREFERENCES_TITLE,
        type: "boolean",
        description: "\u5728\u7F16\u8F91\u8FC7\u7A0B\u4E2D\uFF0C\u53EF\u5728\uFF08Monaco\uFF09\u7F16\u8F91\u5668\u4E2D\u81EA\u52A8\u89E6\u53D1\u5185\u8054\u8865\u5168\u3002",
        default: false
      },
      [PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY]: {
        title: "\u9632\u6296\u5EF6\u8FDF",
        type: "number",
        description: "\u5728\u7F16\u8F91\u5668\u4E2D\u68C0\u6D4B\u5230\u66F4\u6539\u540E\uFF0C\u63A7\u5236\u89E6\u53D1\u8865\u5168\u529F\u80FD\u524D\u7684\u5EF6\u8FDF\u65F6\u95F4\uFF08\u4EE5\u6BEB\u79D2\u4E3A\u5355\u4F4D\uFF09\u3002\u9700\u8981\u542F\u7528\u201C\u4EE3\u7801\u667A\u80FD\u8865\u5168\u201D\u529F\u80FD\u3002\u8F93\u51650\u53EF\u7981\u7528\u53BB\u6296\u5EF6\u8FDF\u3002",
        default: 300
      },
      [PREF_AI_INLINE_COMPLETION_MAX_CONTEXT_LINES]: {
        title: "\u6700\u5927\u4E0A\u4E0B\u6587\u884C\u6570",
        type: "number",
        description: "\u7528\u4F5C\u4E0A\u4E0B\u6587\u7684\u6700\u5927\u884C\u6570\uFF0C\u5206\u5E03\u5728\u5149\u6807\u4F4D\u7F6E\u524D\u540E\u7684\u884C\u4E2D\uFF08\u524D\u7F00\u548C\u540E\u7F00\uFF09\u3002\u5C06\u5176\u8BBE\u7F6E\u4E3A-1\uFF0C\u8868\u793A\u4F7F\u7528\u6574\u4E2A\u6587\u4EF6\u4F5C\u4E3A\u4E0A\u4E0B\u6587\uFF0C\u4E0D\u53D7\u884C\u6570\u9650\u5236\uFF1B\u8BBE\u7F6E\u4E3A0\uFF0C\u5219\u4EC5\u4F7F\u7528\u5F53\u524D\u884C\u3002",
        default: -1,
        minimum: -1
      },
      [PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS]: {
        title: "\u79FB\u9664\u884C\u5185\u8865\u5168\u7684\u53CD\u5F15\u53F7",
        type: "boolean",
        description: "\u4ECE\u67D0\u4E9B\u5927\u578B\u8BED\u8A00\u6A21\u578B\uFF08LLM\uFF09\u8FD4\u56DE\u7684\u4EE3\u7801\u4E2D\u79FB\u9664\u5468\u56F4\u7684\u53CD\u5F15\u53F7\u3002\u5982\u679C\u68C0\u6D4B\u5230\u53CD\u5F15\u53F7\uFF0C\u5219\u5220\u9664\u95ED\u5408\u53CD\u5F15\u53F7\u540E\u7684\u6240\u6709\u5185\u5BB9\uFF0C\u53CD\u5F15\u53F7\u4E5F\u88AB\u79FB\u9664\u3002\u6B64\u8BBE\u7F6E\u6709\u52A9\u4E8E\u786E\u4FDD\u5F53\u8BED\u8A00\u6A21\u578B\u4F7F\u7528\u7C7B\u4F3CMarkdown\u7684\u683C\u5F0F\u65F6\uFF0C\u8FD4\u56DE\u7684\u662F\u7EAF\u4EE3\u7801\u3002",
        default: true
      },
      [PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY]: {
        title: "\u4EE3\u7801\u5B8C\u6210\u7F13\u5B58\u5BB9\u91CF",
        type: "number",
        description: "\u7F13\u5B58\u4E2D\u53EF\u5B58\u50A8\u7684\u4EE3\u7801\u8865\u5168\u6761\u76EE\u7684\u6700\u5927\u6570\u91CF\u3002\u6570\u91CF\u8D8A\u591A\uFF0C\u6027\u80FD\u8D8A\u597D\uFF0C\u4F46\u4F1A\u5360\u7528\u66F4\u591A\u5185\u5B58\u3002\u6700\u5C0F\u503C\u4E3A10\uFF0C\u5EFA\u8BAE\u8303\u56F4\u572850\u81F3200\u4E4B\u95F4\u3002",
        default: 100,
        minimum: 10
      }
    }
  };

  class InlineCompletionDebouncer {
    debounce(callback, debounceDelay) {
      return new Promise((resolve, reject) => {
        if (this.timeoutId) {
          window.clearTimeout(this.timeoutId);
        }
        this.timeoutId = window.setTimeout(() => {
          callback().then(resolve).catch(reject);
          this.timeoutId = void 0;
        }, debounceDelay);
      });
    }
  }

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
  let CodeCompletionCache = class {
    constructor() {
      this.maxSize = 100;
      this.cache = new Map();
    }
    generateKey(filePath, model, position) {
      const lineNumber = position.lineNumber;
      const prefixRange = new monaco__namespace.Range(1, 1, position.lineNumber, position.column);
      const prefix = model.getValueInRange(prefixRange);
      const lastLine = model.getLineCount();
      const lastColumn = model.getLineMaxColumn(lastLine);
      const suffixRange = new monaco__namespace.Range(position.lineNumber, position.column, lastLine, lastColumn);
      const suffix = model.getValueInRange(suffixRange);
      const key = JSON.stringify({
        filePath,
        lineNumber,
        prefixHash: CodeCompletionCache.hashString(prefix),
        suffixHash: CodeCompletionCache.hashString(suffix)
      });
      return key;
    }
    static hashString(str) {
      let hash = 2166136261;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = hash * 16777619 >>> 0;
      }
      return hash.toString(16);
    }
    get(key) {
      const entry = this.cache.get(key);
      if (entry) {
        entry.lastAccessed = Date.now();
        return entry.value;
      }
      return void 0;
    }
    put(key, value) {
      if (this.cache.size >= this.maxSize) {
        this.removeLeastRecentlyUsed();
      }
      this.cache.set(key, {
        value,
        lastAccessed: Date.now()
      });
    }
    clear() {
      this.cache.clear();
    }
    removeLeastRecentlyUsed() {
      let oldestKey;
      let oldestTime = Infinity;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestKey = key;
          oldestTime = entry.lastAccessed;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    setMaxSize(size) {
      this.maxSize = size;
      while (this.cache.size > this.maxSize) {
        this.removeLeastRecentlyUsed();
      }
    }
  };
  CodeCompletionCache = __decorateClass$1([
    inversify.injectable()
  ], CodeCompletionCache);

  function extractContextInfo(fullText, position) {
    const lines = fullText.split("\n");
    const currentLine = lines[position.lineNumber - 1];
    const previousLines = lines.slice(0, position.lineNumber - 1);
    const nextLines = lines.slice(position.lineNumber);
    const variables = [];
    const functions = [];
    const regex = /(let|const|var)\s+(\w+)|function\s+(\w+)/g;
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      if (match[2])
        variables.push(match[2]);
      if (match[3])
        functions.push(match[3]);
    }
    return {
      currentLine,
      previousLines,
      nextLines,
      variables,
      functions,
      fullText
    };
  }
  function extractImportedItems(fullText, isCurrentLine) {
    const baseRegex = /import\s+([\w.]+|["']([^"']+)["'])/;
    const importRegex = isCurrentLine ? new RegExp(baseRegex.source, "g") : new RegExp(baseRegex.source + "\\s+as\\s+(\\w+)", "g");
    const importedItems = [];
    let match;
    while ((match = importRegex.exec(fullText)) !== null) {
      const fullPath = match[1].replace(/["']/g, "");
      const lastPart = fullPath.split(".").pop().split("/").pop();
      let itemName = lastPart;
      if (isCurrentLine && match[3]) {
        itemName = match[3];
      }
      importedItems.push(itemName);
    }
    return importedItems;
  }
  function generateImportSuggestions(importedItems, textUntilPosition, position) {
    const suggestions = [];
    importedItems.forEach((item) => {
      if (item.toLowerCase().startsWith(textUntilPosition.toLowerCase())) {
        suggestions.push({
          insertText: item,
          range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
        });
      }
    });
    return suggestions;
  }
  function generateSuggestions(contextInfo, textUntilPosition, position) {
    const { currentLine, variables, functions } = contextInfo;
    if (!currentLine || currentLine === "")
      return [];
    const suggestions = [];
    if (currentLine.startsWith("import") && currentLine.includes("as")) {
      const item = extractImportedItems(currentLine, true);
      const alias = item[0];
      if (alias) {
        suggestions.push({
          insertText: alias,
          label: alias,
          kind: monaco__namespace.languages.CompletionItemKind.Variable,
          sortText: "0"
        });
      }
    }
    if (currentLine.trim().startsWith("log")) {
      suggestions.push({
        insertText: 'log.info("\u6253\u5370\u65E5\u5FD7\u8F93\u51FA...");',
        range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
      });
    }
    if ((currentLine.startsWith("var") || currentLine.startsWith("const") || currentLine.startsWith("let")) && currentLine.includes("= () ") && !currentLine.includes("=>")) {
      const insertText = "=> {\n	\n}";
      suggestions.push({
        insertText,
        range: new monaco__namespace.Range(position.lineNumber, position.column, position.lineNumber, position.column)
      });
    }
    if (currentLine.trim().startsWith("if")) {
      suggestions.push({
        insertText: "if (condition) {\n	\n}",
        range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
      });
    }
    if (currentLine.trim().startsWith("for")) {
      suggestions.push({
        insertText: "for (item in collection) {\n	\n}",
        range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
      });
    }
    if (currentLine.trim().startsWith("try")) {
      suggestions.push({
        insertText: "try {\r\n	\r\n} catch (e) {\r\n	\r\n}",
        range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
      });
    }
    if (currentLine.trim().endsWith("each")) {
      suggestions.push({
        insertText: `(item => {
	
})`,
        range: new monaco__namespace.Range(position.lineNumber, position.column, position.lineNumber, position.column)
      });
    }
    functions.forEach((func) => {
      if (func.toLowerCase().startsWith(textUntilPosition.toLowerCase())) {
        suggestions.push({
          insertText: func,
          range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
        });
      }
    });
    if (currentLine && currentLine.length > 1) {
      const keywords = ["const", "var", "let", "if", "else", "for", "db", "return"];
      keywords.forEach((keyword) => {
        if (keyword.toLowerCase().startsWith(textUntilPosition.toLowerCase())) {
          suggestions.push({
            insertText: keyword,
            range: new monaco__namespace.Range(position.lineNumber, 1, position.lineNumber, position.column)
          });
        }
      });
    }
    const importedItems = extractImportedItems(contextInfo.fullText);
    const importSuggestions = generateImportSuggestions(importedItems, textUntilPosition, position);
    if (importSuggestions.length > 0) {
      suggestions.push(...importSuggestions);
    }
    return suggestions;
  }
  const InlineCompletionItemProvider = {
    provideInlineCompletions: (model, position, context, token) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      const fullText = model.getValue();
      const contextInfo = extractContextInfo(fullText, position);
      const suggestions = generateSuggestions(contextInfo, textUntilPosition, position);
      return {
        items: suggestions,
        enableForwardStability: true
      };
    },
    disposeInlineCompletions: () => {
      return void 0;
    }
  };

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
  let AIFrontendApplicationContribution = class {
    constructor() {
      this.completionCache = new CodeCompletionCache();
      this.debouncer = new InlineCompletionDebouncer();
      this.toDispose = new Map();
    }
    onDidInitializeLayout(app) {
      this.preferenceService.ready.then(() => {
        this.handlePreferences();
      });
    }
    handlePreferences() {
      const handler = () => this.handleInlineCompletions();
      this.toDispose.set("inlineCompletions", handler());
      this.debounceDelay = this.preferenceService.get(PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY, 300);
      const cacheCapacity = this.preferenceService.get(PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY, 100);
      this.completionCache.setMaxSize(cacheCapacity);
      this.preferenceService.onDidPreferenceChanged((event) => {
        if (event.key === PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE || event.key === PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS) {
          this.toDispose.get("inlineCompletions")?.dispose();
          this.toDispose.set("inlineCompletions", handler());
        }
        if (event.key === PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY) {
          this.debounceDelay = event.newValue;
        }
        if (event.key === PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY) {
          this.completionCache.setMaxSize(event.newValue);
        }
      });
    }
    handleInlineCompletions() {
      const automatic = this.preferenceService.get(PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE, false);
      if (!automatic) {
        return common.Disposable.NULL;
      }
      return monaco__namespace.languages.registerInlineCompletionsProvider({ scheme: "file" }, InlineCompletionItemProvider);
    }
  };
  __decorateClass([
    inversify.inject(preferences.PreferenceService)
  ], AIFrontendApplicationContribution.prototype, "preferenceService", 2);
  AIFrontendApplicationContribution = __decorateClass([
    inversify.injectable()
  ], AIFrontendApplicationContribution);

  const AIAgentModule = new inversify.ContainerModule((bind) => {
    bind(EmbeddedAgentWidget).toSelf().inSingletonScope();
    bind(AIFrontendApplicationContribution).toSelf().inSingletonScope();
    bind(core.FrontendApplicationContribution).to(AIFrontendApplicationContribution);
    bind(commands.CommandContribution).toService(EmbeddedAgentWidget);
    bind(preferences.PreferenceContribution).toConstantValue({ schema: EmbeddedAgentPreferencesSchema });
    bind(preferences.PreferenceContribution).toConstantValue({ schema: AICodeCompletionPreferencesSchema });
  });
  plugin.regContainerModule(AIAgentModule);

}));
//# sourceMappingURL=index.js.map
