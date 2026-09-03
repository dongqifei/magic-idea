import { PreferenceSchema } from "@MagicIdea/core/preferences/preference-types";

export const PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE = 'ai-assistant.codeCompletion.automaticCodeCompletion';
export const PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY = 'ai-assistant.codeCompletion.debounceDelay';
export const PREF_AI_INLINE_COMPLETION_EXCLUDED_EXTENSIONS = 'ai-assistant.codeCompletion.excludedFileExtensions';
export const PREF_AI_INLINE_COMPLETION_MAX_CONTEXT_LINES = 'ai-assistant.codeCompletion.maxContextLines';
export const PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS = 'ai-assistant.codeCompletion.stripBackticks';
export const PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY = 'ai-assistant.codeCompletion.cacheCapacity';

export const AICodeCompletionPreferencesSchema: PreferenceSchema = {
  title: '智能助手',
  properties: {
    [PREF_AI_INLINE_COMPLETION_AUTOMATIC_ENABLE]: {
      title: '代码智能补全',
      type: 'boolean',
      description: '在编辑过程中，可在编辑器中自动触发内联补全。',
      default: false
    },
    [PREF_AI_INLINE_COMPLETION_DEBOUNCE_DELAY]: {
      title: '防抖延迟',
      type: 'number',
      description: '在编辑器中检测到更改后，控制触发补全功能前的延迟时间（以毫秒为单位）。需要启用“代码智能补全”功能。输入0可禁用去抖延迟。',
      default: 500
    },
    [PREF_AI_INLINE_COMPLETION_MAX_CONTEXT_LINES]: {
      title: '最大上下文行数',
      type: 'number',
      description: '用作上下文的最大行数，分布在光标位置前后的行中（前缀和后缀）。将其设置为-1，表示使用整个文件作为上下文，不受行数限制；设置为0，则仅使用当前行。',
      default: -1,
      minimum: -1
    },
    [PREF_AI_INLINE_COMPLETION_STRIP_BACKTICKS]: {
      title: '移除行内补全的反引号',
      type: 'boolean',
      description: '从某些大型语言模型（LLM）返回的代码中移除周围的反引号。如果检测到反引号，则删除闭合反引号后的所有内容，反引号也被移除。此设置有助于确保当语言模型使用类似Markdown的格式时，返回的是纯代码。',
      default: true
    },
    [PREF_AI_INLINE_COMPLETION_CACHE_CAPACITY]: {
      title: '代码完成缓存容量',
      type: 'number',
      description: '缓存中可存储的代码补全条目的最大数量。数量越多，性能越好，但会占用更多内存。最小值为10，建议范围在50至200之间。',
      default: 100,
      minimum: 10
    }
  }
};