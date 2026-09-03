import { inject, injectable } from "inversify";
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from "@MagicIdea/core/shell/tab-bar-toolbar";
import { FrontendApplication, codicon, nls } from "@MagicIdea/core";
import { AIViewContribution } from "@MagicIdea/ai-core/ai-view-contribution";
import { AIConfigurationContainerWidget } from "./ai-configuration-widget";

export const AI_CONFIGURATION_TOGGLE_COMMAND_ID = "aiConfiguration:toggle";
export const OPEN_AI_CONFIG_VIEW = {
  id: "aiConfiguration:open",
  label: "Open AI Configuration view",
};

@injectable()
export class AIAgentConfigurationViewContribution
  extends AIViewContribution<AIConfigurationContainerWidget>
  implements TabBarToolbarContribution
{
  constructor() {
    super({
      widgetId: AIConfigurationContainerWidget.ID,
      widgetName: AIConfigurationContainerWidget.LABEL,
      defaultWidgetOptions: {
        area: "main",
        rank: 100,
      },
      toggleCommandId: AI_CONFIGURATION_TOGGLE_COMMAND_ID,
      iconClass: codicon('gear'),
    });
  }

  async initializeLayout(_app: FrontendApplication): Promise<void> {
    await this.openView();
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: "chat-view." + OPEN_AI_CONFIG_VIEW.id,
      command: OPEN_AI_CONFIG_VIEW.id,
      tooltip: nls.localize(
        "theia/ai-ide/open-ai-configuration-tooltip",
        "Open AI Configuration",
      ),
      group: "ai-settings",
      priority: 2,
    });
  }
}
