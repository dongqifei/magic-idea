import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import {
  LanguageModelAliasRegistry,
  LanguageModelAlias,
} from "@MagicIdea/ai-core/common/language-model-alias";
import {
  FrontendLanguageModelRegistry,
  LanguageModel,
  LanguageModelRegistry,
  LanguageModelRequirement,
} from "@MagicIdea/ai-core/common/language-model";
import { nls } from "@MagicIdea/core/common/nls";
import { AgentService, AISettingsService } from "@MagicIdea/ai-core";
import { AIListDetailConfigurationWidget } from "./base/ai-list-detail-configuration-widget";
import { ModelAliasesDetailView } from "./model-aliases-configuration-views";

@injectable()
export class ModelAliasesConfigurationWidget extends AIListDetailConfigurationWidget<LanguageModelAlias> {
  static readonly ID = "ai-model-aliases-configuration-widget";
  static readonly LABEL = nls.localize(
    "theia/ai/core/modelAliasesConfiguration/label",
    "模型别名",
  );

  @inject(LanguageModelAliasRegistry)
  protected readonly languageModelAliasRegistry: LanguageModelAliasRegistry;
  @inject(LanguageModelRegistry)
  protected readonly languageModelRegistry: FrontendLanguageModelRegistry;
  @inject(AISettingsService)
  protected readonly aiSettingsService: AISettingsService;
  @inject(AgentService)
  protected readonly agentService: AgentService;

  protected languageModels: LanguageModel[] = [];
  protected matchingAgentIdsForAliasMap: Map<string, string[]> = new Map();
  protected resolvedModelForAlias: Map<string, LanguageModel | undefined> =
    new Map();

  @postConstruct()
  protected init(): void {
    this.id = ModelAliasesConfigurationWidget.ID;
    this.title.label = ModelAliasesConfigurationWidget.LABEL;
    this.title.closable = false;

    Promise.all([this.loadItems(), this.loadLanguageModels()]).then(() =>
      this.update(),
    );

    this.languageModelAliasRegistry.ready.then(() =>
      this.toDispose.push(
        this.languageModelAliasRegistry.onDidChange(async () => {
          await this.loadItems();
          this.update();
        }),
      ),
    );

    this.toDispose.pushAll([
      this.languageModelRegistry.onChange(async () => {
        await this.loadItems();
        await this.loadLanguageModels();
        this.update();
      }),
      this.aiSettingsService.onDidChange(async () => {
        await this.loadMatchingAgentIdsForAllAliases();
        this.update();
      }),
    ]);
  }

  protected override async loadItems(): Promise<void> {
    await this.languageModelAliasRegistry.ready;
    this.items = this.languageModelAliasRegistry
      .getAliases()
      .sort((a, b) => a.id.localeCompare(b.id));

    // Set initial selection
    if (this.items.length > 0 && !this.selectedItem) {
      this.selectedItem = this.items[0];
    }

    await this.loadMatchingAgentIdsForAllAliases();

    // Resolve evaluated models for each alias
    this.resolvedModelForAlias = new Map();
    for (const alias of this.items) {
      const model = await this.languageModelRegistry.getReadyLanguageModel(
        alias.id,
      );
      this.resolvedModelForAlias.set(alias.id, model);
    }
  }

  protected async loadLanguageModels(): Promise<void> {
    this.languageModels = await this.languageModelRegistry.getLanguageModels();
  }

  protected async loadMatchingAgentIdsForAllAliases(): Promise<void> {
    const agents = this.agentService.getAllAgents();
    const aliasMap: Map<string, string[]> = new Map();
    for (const alias of this.items) {
      const matchingAgentIds: string[] = [];
      for (const agent of agents) {
        const requirementSetting =
          await this.aiSettingsService.getAgentSettings(agent.id);
        if (requirementSetting?.languageModelRequirements) {
          if (
            requirementSetting?.languageModelRequirements?.find(
              (e) => e.identifier === alias.id,
            )
          ) {
            matchingAgentIds.push(agent.id);
          }
        } else {
          if (
            agent.languageModelRequirements.some(
              (req: LanguageModelRequirement) => req.identifier === alias.id,
            )
          ) {
            matchingAgentIds.push(agent.id);
          }
        }
      }
      aliasMap.set(alias.id, matchingAgentIds);
    }
    this.matchingAgentIdsForAliasMap = aliasMap;
  }

  protected override getItemId(item: LanguageModelAlias): string {
    return item.id;
  }

  protected override getItemLabel(item: LanguageModelAlias): string {
    return item.id;
  }

  protected override getEmptySelectionMessage(): string {
    return nls.localize(
      "theia/ai/core/modelAliasesConfiguration/selectAlias",
      "请选择一个模型别名。",
    );
  }

  protected handleAliasSelectedModelIdChange = (
    alias: LanguageModelAlias,
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    const newModelId = event.target.value || undefined;
    const updatedAlias: LanguageModelAlias = {
      ...alias,
      selectedModelId: newModelId,
    };
    this.languageModelAliasRegistry.ready.then(() => {
      this.languageModelAliasRegistry.addAlias(updatedAlias);
    });
    this.handleItemSelect(updatedAlias);
  };
  
  protected override renderItemDetail(
    alias: LanguageModelAlias,
  ): React.ReactNode {
    const availableModelIds = this.languageModels.map((m) => m.id);
    const selectedModelId = alias.selectedModelId ?? "";
    const isInvalidModel =
      !!selectedModelId &&
      !availableModelIds.includes(alias.selectedModelId ?? "");
    const agentIds = this.matchingAgentIdsForAliasMap.get(alias.id) || [];
    const agents = this.agentService
      .getAllAgents()
      .filter((agent) => agentIds.includes(agent.id));
    const resolvedModel = this.resolvedModelForAlias.get(alias.id);

    return React.createElement(ModelAliasesDetailView, {
      alias,
      languageModels: this.languageModels,
      isInvalidModel,
      agents,
      resolvedModel,
      onModelChange: this.handleAliasSelectedModelIdChange,
    });
  }
}
