import { interfaces } from 'inversify'
import 'monaco-editor/esm/nls.messages.zh-cn.js';
import { initAppContainer } from '@MagicIdea/core'
import { LogManager } from "@MagicIdea/core/logger/logger-manager";
import { LogLevel } from "@MagicIdea/core/logger/logger-types";
import { ConsoleAppender } from "@MagicIdea/core/logger/console-appender";

import { bindEditorModule } from './editor/editor-frontend-module';

import { bindMarkerModule } from "./markers/marker-module";
import { MarkerWidget } from "./markers/marker-widget";
import { bindAIAssistantModule } from "./ai-assistant/ai-assistant-module";
import { bindCodeCompletionAgentModule } from "./ai-code-completion/ai-code-completion-frontend-module";
import { AIChatWidget } from "./ai-assistant/ai-assistant-chat-widget";
import { bindAICoreModule } from './ai-core/ai-core-frontend-module';
import { bindAIChatModule } from './ai-chat/ai-chat-frontend-module';
import { bingAIIdeModule } from "./ai-ide/frontend-module";
import { bindApiTreeModule } from "./magic-api/magic-api-tree-module";
import { MagicApiExplorerWidget } from "./magic-api/magic-api-explorer-widget";
import { bindAnthropicModule } from './ai-anthropic/anthropic-frontend-module';
import { bindOpenAIModule } from "./ai-openai/openai-frontend-module";
import { bindGitHubCopilotModule } from './ai-copilot/copilot-frontend-module';
import { bindMcpServerModule } from './ai-mcp/mcp-frontend-module';
import { bindPropertyModule } from "./property/property-module";
import { PropertyManager } from "./property/property-manager";

import { bindPreferencesFrontendModule } from "./preferences/preference-frontend-module";
import { PreferenceWidget } from "./preferences/preference-widget"

import { ConsoleWidget, bindConsoleModule } from "./console/console-widget";
import { RunDebugResultWidget, RunDebugConsoleWidget, bindRunDebugModule } from "./run-debug";
import { SearchWidget, bindSearchModule } from "./search/search-widget";
import { TimelineWidget, bindTimelineModule } from "./timeline/timeline-frontend-module";
import { ExtensionWidget, bindExtensionModule } from "./extension/extension-widget";
import { MonacoBreakpointIntegrator } from './editor/monaco-breakpoint-integrator';

import '@MagicIdea/core/styles/index.less';

// 1. 全局Log配置
LogManager.getInstance().configure({
  level: LogLevel.INFO, // 全局日志级别：DEBUG及以上级别会输出
  appenders: [
    new ConsoleAppender("%d{yyyy-MM-dd HH:mm:ss.SSS} %p [%c] - %m %ex"), // 自定义格式
  ],
});

// 2. 初始化应用容器，并传入自定义的依赖绑定逻辑
initAppContainer((bind: interfaces.Bind, unbind: any, isBound: any, rebind: any) => {
  bindEditorModule(bind, rebind, isBound, rebind);
  // 绑定接口管理器模块依赖
  bindApiTreeModule(bind);
  // 绑定标记模块依赖
  bindMarkerModule(bind);
  // 绑定属性模块依赖
  bindPropertyModule(bind);
  // 绑定偏好模块接口依赖
  bindPreferencesFrontendModule(bind);
  // 绑定AI核心模块依赖
  bindAICoreModule(bind);
  bindAIChatModule(bind);
  // 绑定AI智能聊天模块依赖
  bindAIAssistantModule(bind);
  // 绑定AI代码补全模块依赖
  bindCodeCompletionAgentModule(bind);
  bingAIIdeModule(bind);
  // 绑定控制台模块依赖
  bindConsoleModule(bind);
  bindRunDebugModule(bind);
  bindSearchModule(bind);
  bindTimelineModule(bind);
  bindExtensionModule(bind);
  bindAnthropicModule(bind);
  bindOpenAIModule(bind);
  bindGitHubCopilotModule(bind);
  bindMcpServerModule(bind);
}).then((container) => {
  // 主动 get 一次，触发实例创建和 init 执行
  container.get(PreferenceWidget);
  // 左侧面板
  container.get(MagicApiExplorerWidget);
  container.get(SearchWidget);
  container.get(TimelineWidget);
  container.get(ExtensionWidget);
  // 底部面板
  container.get(ConsoleWidget);
  container.get(MarkerWidget);
  container.get(PropertyManager);
  container.get(RunDebugConsoleWidget);
  container.get(RunDebugResultWidget);
  // 右侧面板
  container.get(AIChatWidget);

  container.get(MonacoBreakpointIntegrator)
})
