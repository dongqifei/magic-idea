import { PreferenceSchema } from "@capital/core/preferences";

export const EMBEDDED_AGENT_URL_KEY = "extensions.embedded-agent.agentUrl";

export const EmbeddedAgentPreferencesSchema: PreferenceSchema = {
  "title": "内嵌智能体",
  "properties": {
    [EMBEDDED_AGENT_URL_KEY]: {
      "type": "string",
      "default": "https://yuanqi.tencent.com/agent/m5fSqCnzYVca",
      "title": "智能体地址",
      "description": "第三方智能体平台发布的服务地址"
    }
  }
};

