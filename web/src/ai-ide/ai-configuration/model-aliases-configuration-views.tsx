import * as React from "react";
import {
  LanguageModelAlias,
} from "@MagicIdea/ai-core/common/language-model-alias";
import {
  LanguageModel,
} from "@MagicIdea/ai-core/common/language-model";
import { nls } from "@MagicIdea/core/common/nls";
import { Agent } from "@MagicIdea/ai-core";
import { ConfigurationSection } from "./components/configuration-section";

export interface ModelAliasesDetailViewProps {
    alias: LanguageModelAlias;
    languageModels: LanguageModel[];
    isInvalidModel: boolean;
    agents: Agent[];
    resolvedModel: LanguageModel | undefined;
    onModelChange: (alias: LanguageModelAlias, event: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * 纯 UI 组件：模型别名详情面板
 * 全部使用 React.createElement 实现
 */
export function ModelAliasesDetailView(
  props: ModelAliasesDetailViewProps,
): React.ReactNode {
  const {
    alias,
    languageModels,
    isInvalidModel,
    agents,
    resolvedModel,
    onModelChange,
  } = props;

  const selectedModelId = alias.selectedModelId ?? '';

  return (
    <div>
      <div className="settings-section-title settings-section-category-title">
        {alias.id}
      </div>

      {alias.description && (
        <div className="ai-alias-detail-description">{alias.description}</div>
      )}

      <ConfigurationSection
        title={nls.localize(
          "theia/ai/core/modelAliasesConfiguration/selectedModelId",
          "选定模型",
        )}
        className="ai-alias-selected-model-section"
      >
        <select
          className={`theia-select form-control template-variant-selector ${isInvalidModel ? "error" : ""}`}
          value={isInvalidModel ? "invalid" : selectedModelId}
          onChange={(event) => onModelChange(alias, event)}
        >
          {isInvalidModel && (
            <option value="invalid" disabled>
              {nls.localize(
                "theia/ai/core/modelAliasesConfiguration/unavailableModel",
                "所选模型已不再可用",
              )}
            </option>
          )}
          <option value="" className="ai-language-model-item-ready">
            {nls.localize(
              "theia/ai/core/modelAliasesConfiguration/defaultList",
              "[默认列表]",
            )}
          </option>
          {[...languageModels]
            .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id))
            .map((model) => {
              const isNotReady = model.status.status !== "ready";
              return (
                <option
                  key={model.id}
                  value={model.id}
                  className={
                    isNotReady
                      ? "ai-language-model-item-not-ready"
                      : "ai-language-model-item-ready"
                  }
                  title={
                    isNotReady && model.status.message
                      ? model.status.message
                      : undefined
                  }
                >
                  {model.name ?? model.id} {isNotReady ? "✗" : "✓"}
                </option>
              );
            })}
        </select>
      </ConfigurationSection>

      {alias.selectedModelId === undefined && (
        <>
          <ConfigurationSection
            title={nls.localize(
              "theia/ai/core/modelAliasesConfiguration/priorityList",
              "优先级列表",
            )}
            className="ai-alias-defaults-section"
          >
            <ol>
              {alias.defaultModelIds.map((modelId) => {
                const model = languageModels.find((m) => m.id === modelId);
                const isReady = model?.status.status === "ready";
                return (
                  <li key={modelId}>
                    {isReady ? (
                      <span
                        className={
                          modelId === resolvedModel?.id
                            ? "ai-alias-priority-item-resolved"
                            : "ai-alias-priority-item-ready"
                        }
                      >
                        {modelId}{" "}
                        <span
                          className="ai-model-status-ready"
                          title={nls.localize(
                            "theia/ai/core/modelAliasesConfiguration/modelReadyTooltip",
                            "准备就绪",
                          )}
                        >
                          ✓
                        </span>
                      </span>
                    ) : (
                      <span className="ai-model-default-not-ready">
                        {modelId}{" "}
                        <span
                          className="ai-model-status-not-ready"
                          title={nls.localize(
                            "theia/ai/core/modelAliasesConfiguration/modelNotReadyTooltip",
                            "尚未准备就绪",
                          )}
                        >
                          ✗
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </ConfigurationSection>

          <ConfigurationSection
            title={nls.localize(
              "theia/ai/core/modelAliasesConfiguration/evaluatesTo",
              "评估为",
            )}
            className="ai-alias-evaluates-to-section"
          >
            {resolvedModel ? (
              <span className="ai-alias-evaluates-to-value">
                {resolvedModel.name ?? resolvedModel.id}
                {resolvedModel.status.status === "ready" ? (
                  <span
                    className="ai-model-status-ready"
                    title={nls.localize(
                      "theia/ai/core/modelAliasesConfiguration/modelReadyTooltip",
                      "准备就绪",
                    )}
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    className="ai-model-status-not-ready"
                    title={
                      resolvedModel.status.message ||
                      nls.localize(
                        "theia/ai/core/modelAliasesConfiguration/modelNotReadyTooltip",
                        "尚未准备就绪",
                      )
                    }
                  >
                    ✗
                  </span>
                )}
              </span>
            ) : (
              <span className="ai-alias-evaluates-to-unresolved">
                {nls.localize(
                  "theia/ai/core/modelAliasesConfiguration/noResolvedModel",
                  "此别名暂无可用模型。",
                )}
              </span>
            )}
          </ConfigurationSection>
        </>
      )}

      <ConfigurationSection
        title={nls.localize(
          "theia/ai/core/modelAliasesConfiguration/agents",
          "使用此别名的Agent",
        )}
        className="ai-alias-agents-section"
      >
        <ul>
          {agents.length > 0 ? (
            agents.map((agent) => (
              <li key={agent.id}>
                <span>{agent.name}</span>
                {agent.id !== agent.name && (
                  <span className="ai-alias-agent-id"> ({agent.id})</span>
                )}
              </li>
            ))
          ) : (
            <span>
              {nls.localize(
                "theia/ai/core/modelAliasesConfiguration/noAgents",
                "没有Agent使用此别名。",
              )}
            </span>
          )}
        </ul>
      </ConfigurationSection>
    </div>
  );
}
