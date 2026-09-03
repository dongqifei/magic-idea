import { injectable } from "inversify";

export interface PreferenceLayout {
  id: string;
  label: string;
  children?: PreferenceLayout[];
  settings?: string[];
}

export const COMMONLY_USED_SECTION_PREFIX = "commonly-used";

export const COMMONLY_USED_LAYOUT = {
  id: COMMONLY_USED_SECTION_PREFIX,
  label: "常用设置",
  settings: [
    "editor.fontSize",
    "editor.fontFamily",
    "editor.tabSize",
    "editor.wordWrap",
    "editor.lineNumbers",
  ],
};

export const DEFAULT_LAYOUT: PreferenceLayout[] = [
  {
    id: "editor",
    label: "文本编辑器",
    settings: ["editor.*"],
    children: [
      {
        id: "editor.cursor",
        label: "光标",
        settings: ["editor.cursor*"],
      },
      {
        id: "editor.font",
        label: "字体",
        settings: ["editor.font*"],
      },
      {
        id: "editor.minimap",
        label: "小地图",
        settings: ["editor.minimap.*"],
      },
      {
        id: "editor.format",
        label: "格式化",
        settings: ["editor.format*"],
      },
      {
        id: "editor.files",
        label: "文件",
        settings: ["files*"],
      },
    ],
  },
  // {
  //   id: "keymap",
  //   label: "快捷键",
  //   settings: ["keymap.*"],
  // },
  {
    id: "workbench",
    label: "工作台",
    settings: ["workbench.*"]
  },
  // {
  //   id: "magic-api",
  //   label: "代理服务器",
  //   settings: ["magic-api.*"],
  // },
  {
    id: "global",
    label: "全局参数",
    settings: ["global.*"]
  },
  {
    id: "ai-assistant",
    label: "AI 功能",
    settings: ["ai-assistant.*"],
    children: [
      {
        id: "ai-assistant.ide",
        label: "智能体",
        settings: ["ai-assistant.ide*"],
      },
      {
        id: "ai-assistant.anthropic",
        label: "Anthropic",
        settings: ["ai-assistant.anthropic*"],
      },
      {
        id: "ai-assistant.openAi",
        label: "OpenAI",
        settings: ["ai-assistant.openAi*"],
      },
      {
        id: "ai-assistant.copilot",
        label: "Github Copilot",
        settings: ["ai-assistant.copilot*"],
      },
      {
        id: "ai-assistant.chat",
        label: "聊天",
        settings: ["ai-assistant.chat*"],
      },
      // {
      //   id: "ai-assistant.pet",
      //   label: "宠物",
      //   settings: ["ai-assistant.pet*"],
      // },
      {
        id: "ai-assistant.codeCompletion",
        label: "代码补全",
        settings: ["ai-assistant.codeCompletion*"],
      },
      {
        id: "ai-assistant.mcp",
        label: "MCP",
        settings: ["ai-assistant.mcp*"],
      },
      {
        id: "ai-assistant.agentSettings",
        label: "智能体配置",
        settings: ["ai-assistant.agentSettings*"],
      },
    ]
  },
  // {
  //   id: "collaboration",
  //   label: "多人协作",
  //   settings: ["collaboration.*"],
  // },
  {
    id: "extensions",
    label: "扩展",
    settings: ["extensions.*"],
  },
];

@injectable()
export class PreferenceLayoutProvider {
  getLayout(): PreferenceLayout[] {
    return DEFAULT_LAYOUT;
  }

  getCommonlyUsedLayout(): PreferenceLayout {
    return COMMONLY_USED_LAYOUT;
  }

  hasCategory(id: string): boolean {
    return [...this.getLayout(), this.getCommonlyUsedLayout()].some(
      (e) => e.id === id
    );
  }

  getLayoutForPreference(preferenceId: string): PreferenceLayout | undefined {
    const layout = this.getLayout();
    for (const section of layout) {
      const item = this.findItemInSection(section, preferenceId);
      if (item) {
        return item;
      }
    }
    return undefined;
  }

  protected findItemInSection(
    section: PreferenceLayout,
    preferenceId: string
  ): PreferenceLayout | undefined {
    // First check whether any of its children match the preferenceId.
    if (section.children) {
      for (const child of section.children) {
        const item = this.findItemInSection(child, preferenceId);
        if (item) {
          return item;
        }
      }
    }
    // Then check whether the section itself matches the preferenceId.
    if (section.settings) {
      for (const setting of section.settings) {
        if (this.matchesSetting(preferenceId, setting)) {
          return section;
        }
      }
    }
    return undefined;
  }

  protected matchesSetting(preferenceId: string, setting: string): boolean {
    if (setting.includes("*")) {
      return this.createRegExp(setting).test(preferenceId);
    }
    return preferenceId === setting;
  }

  protected createRegExp(setting: string): RegExp {
    return new RegExp(
      `^${setting.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`
    );
  }
}
