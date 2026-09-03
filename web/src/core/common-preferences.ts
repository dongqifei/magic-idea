import { PreferenceSchema } from "@MagicIdea/core/preferences/preference-types";

export const CommonPreferencesSchema: PreferenceSchema = {
  title: "系统公共配置",
  properties: {
    "files.autoSave": {
      title: "自动保存",
      type: "string",
      default: "off",
      description: "当打开的文件被修改时，自动保存文件。",
      enum: ["off", "afterDelay"],
      overridable: true,
    },
    "files.autoSaveDelay": {
      title: "自动保存延时",
      type: "number",
      default: 1000,
      minimum: 0,
      description: "当自动保存为afterDelay时，自动保存的延迟时间。",
    },
  },
};
