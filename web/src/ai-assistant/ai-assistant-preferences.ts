import { PreferenceSchema } from "@MagicIdea/core/preferences/preference-types";
import { nls } from '@MagicIdea/core/common/nls';

export const CHAT_VIEW_TOKEN_USAGE_ENABLED = 'ai-assistant.chat.tokenUsageIndicator.enabled';
export const CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED = 'ai-assistant.chat.tokenUsageWarning.enabled';
export const CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE = 'ai-assistant.chat.tokenUsageWarning.defaultThresholdPercentage';

export const CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT = 80;

export const AIAssistantPreferencesSchema: PreferenceSchema = {
  title: '智能助手',
  properties: {
    [CHAT_VIEW_TOKEN_USAGE_ENABLED]: {
        type: 'boolean',
        default: true,
        title: "是否显示令牌使用指示器",
        description: nls.localize(
            'theia/ai/chat-ui/tokenUsageIndicatorEnabled',
            '控制是否在聊天视图中显示实验性的令牌使用指示器。此功能尚处于实验阶段,根据模型和提供商的不同,令牌计数可能不准确。'
        ),
    },
    [CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED]: {
        type: 'boolean',
        default: false,
        title: "是否启用令牌使用量警告",
        description: nls.localize(
            'theia/ai/chat-ui/tokenUsageWarningEnabled',
            '控制当聊天会话的令牌使用量超过配置的阈值时是否显示通知。需要语言模型提供商报告令牌使用情况。'
        ),
    },
    [CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE]: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        title: "令牌使用量警告阈值百分比",
        default: CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT,
        description: nls.localize(
            'theia/ai/chat-ui/tokenUsageWarningThresholdPercentage',
            '触发令牌使用警告时,模型上下文窗口所占的比例。当前基于预设的 256k 上下文窗口进行计算;一旦获得实际的模型上下文大小,将改用该值。'
        ),
    }
  }
};