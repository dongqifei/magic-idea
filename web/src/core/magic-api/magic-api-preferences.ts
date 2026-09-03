import { PreferenceSchema } from "@MagicIdea/core/preferences/preference-types";

export const DEFAULT_SERVER_URL: string = "https://magic-api.ssssssss.org.cn";
export const DEFAULT_WEB_PATH: string = "/magic/web";
export const DEFAULT_PROXY_ENABLE: boolean = false;

export const SERVER_URL_PREF = 'magic-api.serverUrl';
export const WEB_PATH_PREF = 'magic-api.webPath';
export const PROXY_ENABLE_PREF = 'magic-api.proxyEnable';

export const MagicApiPreferencesSchema: PreferenceSchema = {
  "title": "Magic API",
  "properties": {
    [SERVER_URL_PREF]: {
      "type": "string",
      "default": DEFAULT_SERVER_URL,
      "title": "服务地址",
      "description": "Magic API服务实例URL"
    },
    [WEB_PATH_PREF]: {
      "type": "string",
      "default": DEFAULT_WEB_PATH,
      "title": "Web路径",
      "description": "Magic API服务的Web路径"
    },
    // 是否启用代理
    [PROXY_ENABLE_PREF]: {
      "type": "boolean",
      "default": DEFAULT_PROXY_ENABLE,
      "title": "是否启用代理",
      "description": "启用 Node 代理以转发 Magic API 请求，规避浏览器 CORS 拦截；关闭后切换为直连模式，需自行确保目标接口支持跨域"
    }
  }
};
