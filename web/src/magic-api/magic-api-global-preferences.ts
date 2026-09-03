import { PreferenceSchema } from "@MagicIdea/core/preferences/preference-types";

export const GLOBAL_REQUEST_CONFIG_PREFERENCE_ID = 'global.request.config';

export const MagicApiGlobalPreferencesSchema: PreferenceSchema = {
  "title": "全局配置（Magic API）",
  "properties": {
    // 全局请求参数配置
    [GLOBAL_REQUEST_CONFIG_PREFERENCE_ID]: {
      type: 'object',
      title: '全局参数',
      properties: {
        params: {
          type: 'array',
          title: '请求参数',
          description: '可添加多行，配置 key 和 value',
          items: {
            type: 'object',
            required: ['key', 'value'],
            properties: {
              key: {
                type: 'string',
                title: '参数名（Key）',
                minLength: 1,
              },
              value: {
                type: 'string',
                title: '参数值（Value）',
                minLength: 1,
              }
            }
          }
        },
        headers: {
          type: 'array',
          title: '请求Header',
          description: '可添加多行，配置 key 和 value',
          items: {
            type: 'object',
            required: ['key', 'value'],
            properties: {
              key: {
                type: 'string',
                title: '参数名（Key）',
                minLength: 1,
              },
              value: {
                type: 'string',
                title: '参数值（Value）',
                minLength: 1,
              }
            }
          }
        }
      }
    }
  }
};
