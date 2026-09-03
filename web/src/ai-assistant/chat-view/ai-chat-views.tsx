import React, { useState, useRef, useEffect, useCallback } from "react";
import { ConfigProvider, ThemeConfig, Button, Flex, Tag, Select, GetRef, Progress, Divider } from "antd";
import type { SelectProps } from 'antd';
import {
  Actions,
  Bubble,
  Prompts,
  Sender,
  Welcome,
  XProvider,
  SenderProps
} from "@ant-design/x";
import { BubbleListRef } from '@ant-design/x/es/bubble';
import { PlusOutlined, ToolOutlined} from '@ant-design/icons';
import { nls, ContributionProvider, HoverService, OpenerService } from '@MagicIdea/core';
import { MarkdownString } from '@MagicIdea/core/common/markdown-rendering';
import {
    GenericCapabilitySelections, ParsedCapability
} from '@MagicIdea/ai-core';
import { 
  ChatModel, ChatAgent, ChatResponseContent, ChatSession, ParsedChatRequestAgentPart, 
  ParsedChatRequestFunctionPart, ParsedChatRequestVariablePart, ChatMode,
} from '@MagicIdea/ai-chat/common';
import { FileContextInfo, ReceivingAgentType } from './ai-chat-types';
import { TreeNode, CompositeTreeNode } from './tree-node';
import { RequestNode, ResponseNode, isRequestNode, isResponseNode } from './chat-view-widget';
import { ProgressMessage } from './chat-progress-message';
import { ChatResponsePartRenderer } from '../chat-response-part-renderer';
import { MarkdownRender } from '../chat-response-renderer/components/markdown-part-renderer-view'
import { CHAT_CONTEXT_WINDOW_SIZE, formatTokenCount, buildBarTooltip, getLatestTokenUsage, getUsageColorClass } from '../chat-token-usage-indicator-util';
import { CapabilityChip, CapabilityChipsRow } from './chat-capabilities-panel';
import { AvailableGenericCapabilities } from '../generic-capabilities-service';
import { GenericCapabilitiesSection } from './generic-capabilities-section';

import "./ai-chat-views.less";

/**
 * Props for the CapabilitiesBar component.
 */
interface CapabilitiesBarProps {
  isOpen: boolean;
  capabilities: ParsedCapability[];
  overrides: Map<string, boolean>;
  onCapabilityChange: (fragmentId: string, enabled: boolean) => void;
  genericCapabilities: GenericCapabilitySelections;
  onGenericCapabilityChange: (type: keyof GenericCapabilitySelections, ids: string[]) => void;
  onResetGenericCapabilities: () => void;
  availableCapabilities: AvailableGenericCapabilities;
  disabledCapabilities: GenericCapabilitySelections;
  disabled?: boolean;
  hoverService: HoverService;
  hasUnsavedChanges: boolean;
  onSaveToSettings: () => void;
}

/**
 * Combined capabilities bar that shows:
 * - Collapsed state: horizontal scrollable row of capability chips
 * - Expanded state: full panel with capabilities and generic capabilities
 */
const CapabilitiesBar: React.FunctionComponent<CapabilitiesBarProps> = ({
  isOpen,
  capabilities,
  overrides,
  onCapabilityChange,
  genericCapabilities,
  onGenericCapabilityChange,
  onResetGenericCapabilities,
  availableCapabilities,
  disabledCapabilities,
  disabled,
  hoverService,
  hasUnsavedChanges,
  onSaveToSettings,
}) => {
  if (isOpen) {
    // Expanded state: full panel with save button
    const hasCapabilities = capabilities.length > 0;
    const saveLabel = nls.localizeByDefault("保存");
    const saveTitle = nls.localize(
      "theia/ai/chat-ui/saveCurrentSelectionsToSettings",
      "保存功能设置",
    );
    return (
      <div className="theia-ChatInput-CapabilitiesPanel">
        {hasCapabilities && (
          <>
            <div className="theia-ChatInput-CapabilitiesPanel-Left">
              <CapabilityChipsRow
                capabilities={capabilities}
                overrides={overrides}
                onCapabilityChange={onCapabilityChange}
                disabled={disabled}
                hoverService={hoverService}
              />
            </div>
            <div className="theia-ChatInput-CapabilitiesPanel-Divider" />
          </>
        )}
        <div className="theia-ChatInput-CapabilitiesPanel-Right">
          <GenericCapabilitiesSection
            genericCapabilities={genericCapabilities}
            onGenericCapabilityChange={onGenericCapabilityChange}
            onResetGenericCapabilities={onResetGenericCapabilities}
            availableCapabilities={availableCapabilities}
            disabledCapabilities={disabledCapabilities}
            disabled={disabled}
            hoverService={hoverService}
          />
        </div>
        <div className="theia-ChatInput-CapabilitiesPanel-SaveButton">
          <button
            className="theia-button"
            disabled={!hasUnsavedChanges || disabled}
            title={saveTitle}
            onClick={onSaveToSettings}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    );
  }

  // Collapsed state: horizontal scrollable row of capability chips
  if (capabilities.length === 0) {
    return undefined;
  }
  return (
    <div className="theia-capabilities-collapsed-bar">
      <div className="theia-capabilities-collapsed-scrollbar">
        {capabilities.map((capability) => {
          const isChecked =
            overrides.get(capability.fragmentId) ?? capability.defaultEnabled;
          return (
            <CapabilityChip
              key={capability.fragmentId}
              fragmentId={capability.fragmentId}
              name={capability.name}
              description={capability.description}
              checked={isChecked}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onToggle={onCapabilityChange}
              onFocus={() => {}}
              hoverService={hoverService}
            />
          );
        })}
      </div>
    </div>
  );
};

interface AIChatPanelProps {
  isEnabled?: boolean;
  chatModel: ChatModel;
  defaultAgent: ChatAgent | undefined,
  receivingAgent: ReceivingAgentType | undefined;
  agents: ChatAgent[];
  modelOptions: SelectProps['options'];
  activeSession?: ChatSession;
  currentFile: FileContextInfo | null | undefined;
  messages: CompositeTreeNode | undefined;
  loading: boolean;
  antdTheme?: ThemeConfig;
  onSend: (query: string, mode?: string, capabilityOverrides?: Record<string, boolean>, genericCapabilitySelections?: GenericCapabilitySelections) => Promise<void>;
  onCancel: () => void;
  onEnableFileContext: () => void;
  onDisableFileContext: () => void;
  onModelChange: (model: string) => void;
  chatResponsePartRenderers: ContributionProvider<ChatResponsePartRenderer<ChatResponseContent>>;
  openerService: OpenerService;
  hoverService: HoverService;
  capabilitiesProps: {
    capabilities: ParsedCapability[];
    overrides: Map<string, boolean>;
    onCapabilityChange: (fragmentId: string, enabled: boolean) => void;
    isOpen: boolean;
    onToggle: () => void;
    keybindingHint?: string;
    hasUnsavedChanges: boolean;
    onSaveToSettings: () => void;
  };
  genericCapabilitiesProps: {
    genericCapabilities: GenericCapabilitySelections;
    onGenericCapabilityChange: (type: keyof GenericCapabilitySelections, ids: string[]) => void;
    onResetGenericCapabilities: () => void;
    availableCapabilities: AvailableGenericCapabilities;
    disabledCapabilities: GenericCapabilitySelections;
    hoverService: HoverService;
  };
  tokenUsageEnabled?: boolean;
  totalTokens: number;
  tokenUsageWarningThreshold: number;
}

const MOCK_QUESTIONS = [
  "如何在 magicscript 中进行数据库查询？",
  "magicscript 的导入语法是怎样的？",
  "怎样在 magicscript 中进行条件判断？",
];

// ====================== 定义智能体属性结构 ======================
interface AgentInfoItem {
  label: string;
  skill: SenderProps['skill'];
  slotConfig: SenderProps['slotConfig'];
  models: Array<{ label: string; value: string, isDefault: boolean }>;
  description: string;
}

/**
 * Returns an onMouseEnter handler that shows a hover tooltip via HoverService.
 */
function hoverHandler(
  hoverService: HoverService,
  content: string | MarkdownString,
  position: "top" | "bottom" = "bottom",
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    hoverService.requestHover({
      content,
      target: e.currentTarget as HTMLElement,
      position,
    });
  };
}

const AgentInfo: Record<string, AgentInfoItem> = {};

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isEnabled,
  chatModel,
  defaultAgent,
  receivingAgent,
  agents,
  activeSession,
  currentFile,
  messages,
  loading,
  antdTheme,
  onSend,
  onCancel,
  onEnableFileContext,
  onDisableFileContext,
  onModelChange,
  chatResponsePartRenderers,
  openerService,
  hoverService,
  capabilitiesProps,
  genericCapabilitiesProps,
  tokenUsageEnabled,
  totalTokens,
  tokenUsageWarningThreshold
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [activeAgentKey, setActiveAgentKey] = useState<string>(defaultAgent?.id || '');
  const [currentAgentInfo, setCurrentAgentInfo] = useState<AgentInfoItem | null>(null);
  const listRef = useRef<BubbleListRef>(null);
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [activeModelKey, setActiveModelKey] = useState<string | undefined>();

  // ====================== 从 agents 构建 AgentInfo ======================
  useEffect(() => {
    if (!agents || agents.length === 0) {
      setActiveAgentKey('');
      setCurrentAgentInfo(null);
      return;
    }

    // 清空重建
    Object.keys(AgentInfo).forEach(key => delete AgentInfo[key]);

    agents.forEach(agent => {
      const agentId = agent.id;
      const agentName = agent.name || agentId;
      const agentDesc = agent.description || '暂无描述';
      const agentModes = agent.modes || [];

      // 构造模型列表
      const modelOptions = agentModes.map((mode: ChatMode) => ({
        label: mode.name,
        value: mode.id,
        isDefault: mode.isDefault || false
      }));

      // 存入全局 AgentInfo
      AgentInfo[agentId] = {
        label: agentName,
        description: agentDesc,
        skill: {
          value: `@${agentId}`,
          title: agentName,
          closable: true,
        },
        slotConfig: [],
        models: modelOptions,
      };
    });

    // 初始化当前选中的智能体
    const initAgentId = receivingAgent?.agentId || defaultAgent?.id || agents[0]?.id;
    
    if (AgentInfo[initAgentId]) {
      setActiveAgentKey(initAgentId);
      setCurrentAgentInfo(AgentInfo[initAgentId]);
    } else {
      //  fallback 第一个
      const firstAgent = agents[0]?.id;
      if (firstAgent) {
        setActiveAgentKey(firstAgent);
        setCurrentAgentInfo(AgentInfo[firstAgent]);
      }
    }
  }, [agents, receivingAgent, defaultAgent]);

  // 切换智能体
  const handleAgentChange = (val: string) => {
    setActiveAgentKey(val);
    setCurrentAgentInfo(AgentInfo[val] || null);
  };

  // 监听用户是否滚上去
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= 50;
    setIsUserScrolledUp(!isNearBottom);
  }, []);

  // 安全滚动到底
  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  // Convert capability overrides map to a plain record - always send all capability states
  const getCapabilityOverridesRecord = React.useCallback((): Record<string, boolean> | undefined => {
    if (capabilitiesProps.overrides.size === 0) {
        return undefined;
    }
    const record: Record<string, boolean> = {};
    for (const [key, value] of capabilitiesProps.overrides) {
        record[key] = value;
    }
    return record;
  }, [capabilitiesProps.overrides]);

  // Get generic capability selections if any are set
  const getGenericCapabilitySelections = React.useCallback((): GenericCapabilitySelections | undefined => {
    const selections = genericCapabilitiesProps.genericCapabilities;
    return GenericCapabilitySelections.hasSelections(selections) ? selections : undefined;
  }, [genericCapabilitiesProps.genericCapabilities]);

  // 发送消息
  const handleSend = React.useCallback((value: any, _: any, skill: any) => {
    let effectiveValue = value;
    if (!effectiveValue || effectiveValue.trim().length === 0) {
      return;
    }
    const query = skill?.value ? `${skill.value} ${effectiveValue}` : effectiveValue;
    const capabilityOverrides = getCapabilityOverridesRecord();
    const genericCapabilitySelections = getGenericCapabilitySelections();
    onSend(query, activeModelKey, capabilityOverrides, genericCapabilitySelections);
    senderRef.current?.clear?.();
    setIsUserScrolledUp(false);
    scrollToBottom();
  }, [activeModelKey, onSend, getCapabilityOverridesRecord, getGenericCapabilitySelections]);

  // 自动滚动
  useEffect(() => {
    if (isUserScrolledUp) return;
    scrollToBottom();
  }, [messages, loading, isUserScrolledUp]);

  useEffect(() => {
    if (isUserScrolledUp || !loading) return;
    const id = setInterval(scrollToBottom, 50);
    return () => clearInterval(id);
  }, [loading, isUserScrolledUp]);

  useEffect(() => {
    setIsUserScrolledUp(false);
    scrollToBottom();
  }, [activeSession]);

  const getChatResponsePartRenderer = (content: ChatResponseContent, node: ResponseNode) => {
    const renderer = chatResponsePartRenderers.getContributions().reduce<[number, ChatResponsePartRenderer<ChatResponseContent> | undefined]>(
      (prev, current) => {
        const prio = current.canHandle(content);
        if (prio > prev[0]) {
          return [prio, current];
        }
        return prev;
      },
      [-1, undefined])[1];
    if (!renderer) {
      console.error('No renderer found for content', content);
      return <div>错误：找不到渲染器</div>;
    }
    return renderer.render(content, node);
  }

  const renderContent = (node: TreeNode) => {
    if (isRequestNode(node)) {
      const parts = node.request.message.parts;
      return (
        <div className="theia-RequestNode">
          {parts.map((part) => {
            if (part instanceof ParsedChatRequestAgentPart || part instanceof ParsedChatRequestVariablePart || part instanceof ParsedChatRequestFunctionPart) {
              return (<></>);
            }
            return (
              <MarkdownRender response={part.text} openerService={openerService} />
            );
          })}
        </div>
      );
    }
    if (isResponseNode(node)) {
      return (
        <div className={'theia-ResponseNode'}>
          {!node.response.isComplete
            && node.response.response.content.length === 0
            && node.response.progressMessages
              .filter(c => c.show === 'untilFirstContent')
              .map((c, i) =>
                <ProgressMessage {...c} key={`${node.id}-progress-untilFirstContent-${i}`} />
              )
          }
          {node.response.response.content.map((c, i) =>
            <div className='theia-ResponseNode-Content' key={`${node.id}-content-${i}`}>{getChatResponsePartRenderer(c, node)}</div>
          )}
          {!node.response.isComplete
            && node.response.progressMessages
              .filter(c => c.show === 'whileIncomplete')
              .map((c, i) =>
                <ProgressMessage {...c} key={`${node.id}-progress-whileIncomplete-${i}`} />
              )
          }
          {node.response.progressMessages
            .filter(c => c.show === 'forever')
            .map((c, i) =>
              <ProgressMessage {...c} key={`${node.id}-progress-afterComplete-${i}`} />
            )
          }
        </div>
      );
    };
  };

  const renderNode = useCallback((node: TreeNode) => {
    return <React.Fragment key={node.id}>
      <div
        className='theia-ChatNode'
        role='article'
      >
        {renderContent(node)}
      </div>
    </React.Fragment>
  }, [renderContent]);

  // ====================== 构造 Select 选项 ======================
  const agentSelectList = React.useMemo(() => {
    return agents.map(ag => ({
      value: ag.id,
      label: ag.name,
      desc: ag.description || '',
    }));
  }, [agents]);

  const currentModelOptions = React.useMemo(() => {
    if (!currentAgentInfo?.models || currentAgentInfo.models.length === 0) {
      return [];
    }
    return currentAgentInfo.models;
  }, [currentAgentInfo]);

  // 使用独立的 useEffect 处理副作用
  useEffect(() => {
    if (!currentAgentInfo?.models || currentAgentInfo.models.length === 0) {
      onModelChange('');
      setActiveModelKey('');
      return;
    }

    const models = currentAgentInfo.models;
    const defaultModel = models.find(m => m.isDefault === true);
    const targetModel = defaultModel ?? models[0];
    const currentModelId = receivingAgent?.currentModeId ?? targetModel.value;

    setActiveModelKey(currentModelId);
    onModelChange(currentModelId);
  }, [currentAgentInfo, receivingAgent?.currentModeId, onModelChange]);

  const capabilitiesLabel = nls.localize('theia/ai/chat-ui/toggleCapabilitiesConfig', '配置工具...');
  const capabilitiesTitle = capabilitiesProps.keybindingHint
      ? `${capabilitiesLabel} (${capabilitiesProps.keybindingHint})`
      : capabilitiesLabel;

  const showTokenUsage = tokenUsageEnabled && totalTokens > 0;
  // const tokenColorClass = showTokenUsage ? getUsageColorClass(totalTokens, tokenUsageWarningThreshold) : '';
  // const tokenIsWarningOrError = tokenColorClass === 'token-usage-yellow' || tokenColorClass === 'token-usage-red';
  const tokenTooltip = showTokenUsage ? buildBarTooltip(getLatestTokenUsage(chatModel), totalTokens, tokenUsageWarningThreshold) : undefined; 
  const percentage = Math.round((totalTokens / CHAT_CONTEXT_WINDOW_SIZE) * 100);
  
  // 是的打开工具配置
  const [toolOpen, setToolOpen] = React.useState(false);

  const getHeaderNode = () => {
    if(toolOpen) {
      return <Sender.Header
          className="chat-tools"
          title="配置工具"
          open={toolOpen}
          onOpenChange={setToolOpen}
        >
        <CapabilitiesBar
          isOpen={toolOpen}
          capabilities={capabilitiesProps.capabilities}
          overrides={capabilitiesProps.overrides}
          onCapabilityChange={capabilitiesProps.onCapabilityChange}
          genericCapabilities={genericCapabilitiesProps.genericCapabilities}
          onGenericCapabilityChange={genericCapabilitiesProps.onGenericCapabilityChange}
          onResetGenericCapabilities={genericCapabilitiesProps.onResetGenericCapabilities}
          availableCapabilities={genericCapabilitiesProps.availableCapabilities}
          disabledCapabilities={genericCapabilitiesProps.disabledCapabilities}
          disabled={!isEnabled}
          hoverService={hoverService}
          hasUnsavedChanges={capabilitiesProps.hasUnsavedChanges}
          onSaveToSettings={capabilitiesProps.onSaveToSettings}
      />
      </Sender.Header>
    } else { 
      return (
        <div className="ant-sender-header chat-contexts">
          <Flex align="center" wrap gap={4}>
            <Button
              size="small"
              type="default"
              icon={<PlusOutlined />}
              onClick={onEnableFileContext}
              onMouseEnter={hoverHandler(hoverService, "添加当前文件为上下文", 'top') }
              disabled={!currentFile || currentFile.isContextEnabled}
            />
            {currentFile?.isContextEnabled ? (
              <Tag
                className="chat-context-file"
                variant="outlined"
                closable
                onClose={onDisableFileContext}
              >
                {currentFile.icon && (
                  <span
                    className="magic-resource-icon"
                    style={{ color: currentFile.iconColor }}
                  >
                    {currentFile.icon}
                  </span>
                )}
                {currentFile.name}
                {currentFile.selectionLineText && (
                  <span style={{ marginLeft: 4 }}>行 {currentFile.selectionLineText}</span>
                )}
              </Tag>
            ) : (
              <span className="chat-context-placeholder">添加上下文</span>
            )}
          </Flex>
        </div>
      )
    }
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <XProvider
        theme={{
          token: { controlHeight: 32, paddingXS: 4, colorBorder: 'var(--magic-idea-input-border)' }
        }}
      >
        <div className="magic-chat" style={{ display: 'flex', height: '100%', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {/* 消息容器 */}
              <div
                ref={messagesContainerRef}
                className="magic-chat-messages"
                style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                tabIndex={-1}
                onScroll={handleScroll}
              >
                {messages && messages.children?.length > 0 ? (
                  <Bubble.List
                    ref={listRef}
                    style={{ paddingInline: 12, paddingBottom: 12 }}
                    items={messages.children?.map((node: TreeNode) => ({
                      key: node.id,
                      content: renderNode(node),
                      role: isRequestNode(node) ? "user" : "assistant",
                      footer: (
                        <>
                          <Actions items={[
                            {
                              key: 'copy',
                              label: 'copy',
                              actionRender: () => {
                                const getCopyText = (node: TreeNode)=>{
                                  if (isRequestNode(node)) {
                                    return node.request.request.text ?? '';
                                  } else if (isResponseNode(node)) {
                                    return node.response.response.asDisplayString();
                                  }
                                }
                                const text = getCopyText(node);
                                return <Actions.Copy text={text} />;
                              },
                            }
                          ]} 
                          />
                          {
                            tokenUsageEnabled && isResponseNode(node) && node.response.tokenUsage && (
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'end',
                                fontSize: '12px',
                                color: 'var(--magic-idea-secondary-foreground)',
                                marginLeft: '6px',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                {/* 从 node 中取出 token 数据 */}
                                <span>输入：{formatTokenCount(node.response.tokenUsage.inputTokens) ?? 0}</span>
                                <span>输出：{formatTokenCount(node.response.tokenUsage.outputTokens) ?? 0}</span>

                                {/* 缓存相关 token（有值才显示） */}
                                {node.response.tokenUsage.cacheCreationInputTokens != null && (
                                  <span>写入缓存：{formatTokenCount(node.response.tokenUsage.cacheCreationInputTokens)}</span>
                                )}
                                {node.response.tokenUsage.cacheReadInputTokens != null && (
                                  <span>读取缓存：{formatTokenCount(node.response.tokenUsage.cacheReadInputTokens)}</span>
                                )}
                                {/* 总消耗 */}
                                <span>
                                  总计：{formatTokenCount((node.response.tokenUsage.inputTokens ?? 0) + (node.response.tokenUsage.outputTokens ?? 0) +
                                    (node.response.tokenUsage.cacheCreationInputTokens ?? 0) +
                                    (node.response.tokenUsage.cacheReadInputTokens ?? 0))} Tokens
                                </span>
                              </div>
                            )
                          }
                        </>
                      )
                    }))}
                    role={{
                      assistant: { placement: "start" },
                      user: { placement: "end" },
                    }}
                  />
                ) : (
                  <>
                    <Welcome
                      style={{ margin: 16, padding: "12px 0px" }}
                      variant="borderless"
                      title="嗨，你好，我是你的智能编码助手。"
                      description="我擅长处理关于 MaigcScript 语言编程问题，专为你排忧解难。"
                    />
                    <Prompts
                      vertical
                      title="我可以帮忙："
                      items={MOCK_QUESTIONS.map(i => ({ key: i, description: i }))}
                      onItemClick={(info) => {
                      const query = info?.data?.description as string;
                      if (query) {
                        handleSend(query, undefined, undefined);// 直接发送
                      }
                    }}
                      style={{ marginInline: 16 }}
                    />
                  </>
                )}
              </div>
              <div className="interactive-input-part">
                <Sender
                  className="magic-chat-sender"
                  loading={loading}
                  ref={senderRef}
                  placeholder="询问 MagicChat 关于你的代码问题"
                  onSubmit={handleSend}
                  suffix={false}
                  onCancel={onCancel}
                  header={getHeaderNode()}
                  footer={(actionNode) => (
                    <Flex justify="space-between" align="center">
                      <Flex gap="small" align="center">
                        {/* 智能体选择器 */}
                        <Select
                          variant="borderless"
                          value={activeAgentKey}
                          onChange={handleAgentChange}
                          placement="topLeft"
                          popupMatchSelectWidth={280}
                          title=""
                          options={agentSelectList}
                          onMouseEnter={hoverHandler(hoverService, "选择智能体", 'bottom')}
                          optionRender={(option) => {
                            const handleOptionMouseEnter = (e: React.MouseEvent) => {
                              // 向上找到 antd 生成的选项 dom 节点
                              const itemEl = (e.currentTarget as HTMLElement).closest('.ant-select-item');
                              if (itemEl) {
                                itemEl.removeAttribute('title');
                              }
                              // 保留你的自定义 hover
                              hoverHandler(hoverService, option.data.desc, 'bottom')(e);
                            };
                            return (
                              <Flex 
                                justify="space-between"
                                onMouseEnter={handleOptionMouseEnter}
                                align="center"
                              >
                                <span>{option.data.label}</span>
                                <span
                                  style={{
                                    whiteSpace: "nowrap",
                                    color: 'var(--magic-idea-description-foreground)',
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "65%",
                                  }}
                                >
                                  {option.data.desc}
                                </span>
                              </Flex>
                            )
                          }}
                          popupRender={(menu) => (
                            <>
                              {menu}
                            </>
                          )}
                        />
                        {/* 选择代理模式 */}
                        {currentModelOptions && currentModelOptions.length> 0 && (
                          <Select
                            variant="borderless"
                            placeholder="切换代理模式"
                            value={activeModelKey}
                            onChange={(value)=>{
                              setActiveModelKey(value);
                              onModelChange(value);
                            }}
                            placement="topRight"
                            popupMatchSelectWidth={240}
                            options={currentModelOptions}
                          />
                        )}
                        <Button 
                          type="text" 
                          size="small" 
                          className={`chat-tool-option${toolOpen ? ' toggled' : ''}`}
                          icon={<ToolOutlined />} 
                          onMouseEnter={hoverHandler(hoverService, capabilitiesTitle, 'bottom')}
                          onClick={() => {
                            setToolOpen(!toolOpen);
                          }}
                        >
                          {capabilitiesProps.hasUnsavedChanges && (
                            <span className="theia-capabilities-unsaved-indicator" />
                          )}
                        </Button>
                      </Flex>
                      <Flex align="center">
                        {showTokenUsage && (
                          <>
                            <Button 
                              type="text" 
                              size="small" 
                              style={{marginRight: 6}}
                              {...(tokenTooltip && { onMouseEnter: hoverHandler(hoverService, tokenTooltip, 'bottom') })}
                            >
                              <Progress
                                type="circle"
                                percent={percentage}
                                size={18}
                                showInfo={false}
                              />
                            </Button>
                          </>
                        )}
                        {actionNode}
                      </Flex>
                    </Flex>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </XProvider>
    </ConfigProvider>
  );
};