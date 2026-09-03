import { inject, injectable, postConstruct, named, optional } from "inversify";
import { createElement } from "react";
import { Message } from "@lumino/messaging";
import { CommandRegistry } from "@lumino/commands";
import { ThemeConfig, theme } from "antd";
import * as monaco from "monaco-editor";
import {
  LabelProvider,
  ContributionProvider,
  HoverService,
  OpenerService,
  Widget,
} from "@MagicIdea/core";
import { getLogger } from "@MagicIdea/core/logger";
import URI from "@MagicIdea/core/common/uri";
import { ReactWidget } from "@MagicIdea/core/widgets/react-widget";
import { DisposableCollection, Disposable, nls } from "@MagicIdea/core/common";
import { PreferenceService } from "@MagicIdea/core/preferences";
import { ApplicationShellLayout } from "@MagicIdea/core/shell/application-shell";
import { EditorManager, EditorWidget } from "@MagicIdea/editor";
import { ActivityHandle } from "@MagicIdea/core/nav-activity/nav-activity-type";
import { ThemeChangedEvent, ThemeService } from "@MagicIdea/core/theme";
import { FileSystemService } from "@MagicIdea/core/filesystem/file-system-types";
import { QuickInputService } from "@MagicIdea/core/quick-input";
import { AIChatPanel } from "./chat-view/ai-chat-views";
import { FileContextInfo, ReceivingAgentType } from "./chat-view/ai-chat-types";
import { CommandContribution } from "@MagicIdea/core/commands";
import {
  LanguageModel,
  LanguageModelService,
  AISettingsService,
  ReasoningSettings,
} from "@MagicIdea/ai-core/common";
import { ParsedChatRequest } from "@MagicIdea/ai-chat/common/parsed-chat-request";
import {
  GenericCapabilitySelections,
  LanguageModelRegistry,
  ReasoningSupport,
  AIVariableResolutionRequest,
  ParsedCapability,
  AgentService,
} from "@MagicIdea/ai-core";
import { NotificationService } from "@MagicIdea/core/notification";
import { ConfirmDialog, Dialog } from "@MagicIdea/core/browser/dialogs";
import { AI_CHAT_NEW_CHAT_WINDOW_COMMAND, AI_CHAT_SHOW_CHATS_COMMAND } from './chat-view-commands';
import {
    CHAT_VIEW_TOKEN_USAGE_ENABLED,
    CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED,
    CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE,
    CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT
} from './ai-assistant-preferences';
import {
    CHAT_CONTEXT_WINDOW_SIZE,
    computeSessionTokenUsage,
    decideTokenUsageWarning,
} from './chat-token-usage-indicator-util';
import {
  ChatRequestParser,
  ChatService,
  ChatAgentService,
  ChatRequestModel,
  ChatResponseModel,
  ChatHierarchyBranch,
  EditableChatRequestModel,
  ChatAgent,
  ChatModel,
  ChatSession,
  ChatRequest,
  ChatAgentLocation,
  MutableChatModel,
} from "@MagicIdea/ai-chat/common";
import {
  ChatSessionIndex,
  ChatSessionMetadata,
  ChatResponseContent,
  isActiveSessionChangedEvent,
} from "@MagicIdea/ai-chat/common";
import {
  AvailableGenericCapabilities,
  GenericCapabilitiesService,
} from "./generic-capabilities-service";
import { ChatCapabilitiesService } from "./chat-capabilities-service";
import { RequestNode, ResponseNode } from "./chat-view/chat-view-widget";
import { ChatResponsePartRenderer } from "./chat-response-part-renderer";
import { TreeNode, CompositeTreeNode } from "./chat-view/tree-node";
import { ChatPetWidget } from './chat-pet/chat-pet-widget';

type Query = (
  query: string,
  mode?: string,
  capabilityOverrides?: Record<string, boolean>,
  genericCapabilitySelections?: GenericCapabilitySelections,
) => Promise<void>;

// 格式化时间
const formatTimeRelative = (timestamp: string | number | Date) => {
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = now - date;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < week) return `${Math.floor(diff / day)}天前`;
  if (diff < month) return `${Math.floor(diff / week)}周前`;
  if (diff < year) return `${Math.floor(diff / month)}个月前`;
  return `${Math.floor(diff / year)}年前`;
};

@injectable()
export class AIChatWidget extends ReactWidget implements CommandContribution {
  private readonly logger = getLogger(AIChatWidget.name);

  public static ID = 'chat-view-widget';
  static LABEL = nls.localize('theia/ai/chat/view/label', '智能助手');

  private disposables = new DisposableCollection();
  private aiChatPanel: ActivityHandle;
  private editorWidget: EditorWidget | undefined;

  private models: string[] = [];

  private loading: boolean = false;
  private currentFile: FileContextInfo | null = null;
  private currentModel: string = "";

  private modelOptions: Array<{ value: string; label: string }> = [];

  private antdTheme?: ThemeConfig;

  private editorDisposables = new DisposableCollection();

  protected prevModels: string[] = [];
  protected useAutoDiscovery = false;

  protected chatSession: ChatSession;

  private chatSessionIndex: ChatSessionIndex = {};

  protected hasPersistedSessions = false;

  protected onDisposeForChatModel = new DisposableCollection();
  protected _chatModel: ChatModel;

  protected _pinnedAgent: ChatAgent | undefined;
  set pinnedAgent(pinnedAgent: ChatAgent | undefined) {
    this._pinnedAgent = pinnedAgent;
    this.scheduleUpdateReceivingAgent();
    this.update();
  }

  protected tokenUsageEnabled = false;
  /** Sessions we have already notified for the current warning cycle (re-armed when usage drops below the threshold). */
  protected readonly notifiedSessions = new Set<string>();

  protected chatModelId: string;

  protected treeModel: CompositeTreeNode | undefined;

  protected isEnabled = false;

  protected updateReceivingAgentTimeout: number | undefined;
  protected forceCapabilitiesRefresh = false;
  protected receivingAgent: ReceivingAgentType | undefined;

  protected agents: ChatAgent[] = [];

  protected capabilitiesOpen = false;

  /**
   * Tracks the default enabled state for each capability.
   * This is initialized from the agent's capabilities and used to display the initial chip state.
   */
  protected capabilityDefaults: ParsedCapability[] = [];

  /**
   * Tracks user's generic capability selections from the dropdowns.
   */
  protected genericCapabilitySelections: GenericCapabilitySelections = {};
  /**
   * Available generic capabilities from all sources.
   */
  protected availableGenericCapabilities: AvailableGenericCapabilities = {
    skills: [],
    mcpFunctions: [],
    functions: [],
    promptFragments: [],
    agentDelegation: [],
    variables: [],
  };

  /**
   * Generic capabilities that are already used in the agent's prompt (should be disabled).
   */
  protected disabledGenericCapabilities: GenericCapabilitySelections = {};
  /**
   * Tracks user's explicit capability overrides for the current chat input session.
   * Only contains capabilities the user has explicitly changed from their defaults.
   * These overrides are not persisted but reset when the receiving agent changes or a new chat is started.
   * Or restored when an existing chat session can provide a previous capability override from the last request.
   */
  protected userCapabilityOverrides: Map<string, boolean> = new Map();
  /**
   * Stores the saved capability overrides loaded from settings.
   * Used to compare against current selections to detect unsaved changes.
   */
  protected savedCapabilityOverrides: Record<string, boolean> | undefined;
  /**
   * Stores the saved generic capability selections loaded from settings.
   * Used to compare against current selections to detect unsaved changes.
   */
  protected savedGenericCapabilitySelections:
    | GenericCapabilitySelections
    | undefined;

  /** Saved reasoning selection for the receiving agent (loaded from {@link AISettingsService}); kept in sync with the persisted value. */
  protected savedReasoning?: ReasoningSettings;

  protected _onQuery: Query;
  /** Suppresses capability updates while a query is in flight to prevent race conditions */
  protected queryInFlight = false;
  set onQuery(query: Query) {
    this._onQuery = async (
      prompt: string,
      mode?: string,
      capabilityOverrides?: Record<string, boolean>,
      genericCapabilitySelections?: GenericCapabilitySelections,
    ) => {
      this.queryInFlight = true;
      try {
        await query(
          prompt,
          mode,
          capabilityOverrides,
          genericCapabilitySelections,
        );
      } finally {
        this.queryInFlight = false;
      }
    };
  }

  // ==============================================
  // ✅ 全局上下文：存在面板里，不随会话丢失
  // ==============================================
  private globalContextVariables: AIVariableResolutionRequest[] = [];

  @inject(ChatRequestParser)
  protected chatRequestParser: ChatRequestParser;

  @inject(ChatPetWidget)
  protected chatPetWidget: ChatPetWidget;

  constructor(
    @inject(ApplicationShellLayout)
    protected shellLayout: ApplicationShellLayout,
    @inject(CommandRegistry) private commands: CommandRegistry,
    @inject(EditorManager) private editorManager: EditorManager,
    @inject(QuickInputService) private quickInputService: QuickInputService,
    @inject(ThemeService) private themeService: ThemeService,
    @inject(PreferenceService) protected preferenceService: PreferenceService,
    @inject(OpenerService) protected readonly openerService: OpenerService,
    @inject(FileSystemService) private fileSystemService: FileSystemService,
    @inject(NotificationService)
    private notificationService: NotificationService,
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
    @inject(LanguageModelRegistry)
    private languageModelRegistry: LanguageModelRegistry,
    @inject(LanguageModelService)
    protected languageModelService: LanguageModelService,
    @inject(ChatService) protected readonly chatService: ChatService,
    @inject(ChatAgentService)
    protected readonly chatAgentService: ChatAgentService,
    @inject(AgentService)
    protected readonly agentService: AgentService,
    @inject(ChatCapabilitiesService)
    protected readonly capabilitiesService: ChatCapabilitiesService,

    @inject(GenericCapabilitiesService)
    @optional()
    protected readonly genericCapabilitiesService:
      | GenericCapabilitiesService
      | undefined,
    @inject(HoverService)
    protected readonly hoverService: HoverService,
    @inject(AISettingsService)
    protected readonly aiSettingsService: AISettingsService,
    @inject(ContributionProvider)
    @named(ChatResponsePartRenderer)
    protected readonly chatResponsePartRenderers: ContributionProvider<
      ChatResponsePartRenderer<ChatResponseContent>
    >,
  ) {
    super();
    this.id = "magic-chat-widget";
    this.title.label = "AI助手";

    this.aiChatPanel = this.registerPanel();

    this.commands.addCommand("view:magic-ai-assistant", {
      label: "AI助手",
      execute: () => this.aiChatPanel.open(),
    });

    this.languageModelRegistry.onChange((e) => {
      this.updateModels(e.models);
    });

    this.disposables.push(
      this.editorManager.onCurrentEditorChanged((editor) => {
        this.editorWidget = editor;
        this.updateCurrentFileFromEditor();
      }),
    );

    const currentTheme = this.themeService.getCurrentTheme();
    if (currentTheme) {
      this.updateAntdTheme({ oldTheme: undefined, newTheme: currentTheme });
    }

    this.disposables.push(
      this.themeService.onDidChangeTheme((event) => {
        this.updateAntdTheme(event);
        this.update();
      }),
    );

    // this.preferenceService.ready.then(()=>{
    //   this.agents = this.chatAgentService.getAgents();
    //   this.update();
    // })
    // this.chatAgentService.onDidChangeAgents(async () => {
    //   this.agents = this.chatAgentService.getAgents();
    //   console.log('agents', this.agents);
    //   this.update();
    // })
    this.agentService.onDidChangeAgents(() => {
      this.agents = this.chatAgentService.getAgents();
      this.update();
    });
  }

  set chatModel(chatModel: ChatModel) {
    this.onDisposeForChatModel.dispose();
    this.onDisposeForChatModel = new DisposableCollection();
    // Register mapping from editor URI to model ID for hover provider lookups
    // this.onDisposeForChatModel.push(
    //     this.pendingImageRegistry.registerEditorMapping(this.getResourceUri().toString(), chatModel.id)
    // );

    // Reset capabilities panel state for each session switch
    this.capabilitiesOpen = false;
    // Force capabilities refresh on next agent update, even if the same agent is resolved
    this.forceCapabilitiesRefresh = true;

    // Restore capability overrides and generic selections from the last request in this session (if any)
    this.userCapabilityOverrides =
      this.getLastCapabilityOverridesFromModel(chatModel);
    this.genericCapabilitySelections =
      this.getLastGenericCapabilitySelectionsFromModel(chatModel);

    this.onDisposeForChatModel.push(
      chatModel.onDidChange((event) => {
        if (event.kind === "responseChanged") {
          this.chatPetWidget.updatePetInfo(chatModel);
          this.evaluateTokenUsageWarning(chatModel);
        }
        if (event.kind === "addVariable") {
          // Validate files added via any path (including LLM tool calls)
          // Get the current variables and validate any new file variables
          // const variables = chatModel.context.getVariables();
          // variables.forEach(variable => {
          //     if (variable.variable.name === 'file' && variable.arg) {
          //         const pathKey = variable.arg; // Use the original path as the key
          //         // Revalidate the file each time someone (User or LLM) adds it to the context,
          //         // as the state may change over time.
          //         if (this.validationService) {
          //             this.validationService.validateFile(pathKey).then(result => {
          //                 this.fileValidationState.set(pathKey, result);
          //                 this.update();
          //             });
          //         }
          //     }
          // });
          // this.update();
        } else if (
          event.kind === "removeVariable" ||
          event.kind === "addRequest" ||
          event.kind === "changeHierarchyBranch"
        ) {
          this.update();
        }
      }),
    );
    this._chatModel = chatModel;
    // Evaluate the warning on attach. `notifiedSessions` lives on this widget
    // instance, so the warning fires at most once per (widget lifetime × session):
    // - Within the same widget, switching between sessions that have already been
    //   notified does not re-notify.
    // - Closing and reopening the chat view creates a fresh widget with an empty
    //   Set, so sessions still above the threshold will be warned about again the
    //   first time they are shown after reopen — once per session. Accepted as a
    //   rare corner case; promoting the state to the ChatSession would avoid it
    //   but isn't worth the coupling today.
    this.evaluateTokenUsageWarning(chatModel);
    this.scheduleUpdateReceivingAgent();
    this.update();
  }

  @postConstruct()
  protected init(): void {
    this.chatSession = this.chatService.createSession();
    this.treeModel = {
      id: "root",
      parent: undefined,
      children: [],
    } as CompositeTreeNode;

    this.chatModel = this.chatSession.model;
    this.pinnedAgent = this.chatSession.pinnedAgent;
    this.trackChatModel(this.chatSession.model);

    this.onQuery = this.handleSend.bind(this);

    this.initListeners();
    this.loadSessions();

    this.toDispose.push(
      Disposable.create(() => {
        if (this.updateReceivingAgentTimeout !== undefined) {
          clearTimeout(this.updateReceivingAgentTimeout);
          this.updateReceivingAgentTimeout = undefined;
        }
      }),
    );

    this.setEnabled(true);

    this.tokenUsageEnabled = this.preferenceService?.get<boolean>(CHAT_VIEW_TOKEN_USAGE_ENABLED, false) ?? false;
    if (this.preferenceService) {
      this.toDispose.push(
        this.preferenceService.onDidPreferenceChanged((change) => {
          if (change.key === CHAT_VIEW_TOKEN_USAGE_ENABLED) {
            this.tokenUsageEnabled =
              this.preferenceService?.get<boolean>(
                CHAT_VIEW_TOKEN_USAGE_ENABLED,
                false,
              ) ?? false;
            this.update();
          } else if (
            change.key === CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE
          ) {
            // Threshold changed: clear notified sessions so users are warned again
            // at the new threshold (e.g. after raising it from the warning's
            // "Open Settings" action), and re-evaluate the current session so the
            // warning appears immediately if it's still above the new threshold.
            this.notifiedSessions.clear();
            if (this._chatModel) {
              this.evaluateTokenUsageWarning(this._chatModel);
            }
            // Re-render so the indicator's color bands reflect the new threshold.
            this.update();
          } else if (
            change.key === CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED &&
            this._chatModel
          ) {
            // If the user just enabled warnings for a session already above threshold,
            // evaluate now so they get an immediate notification instead of waiting for
            // the next response.
            this.evaluateTokenUsageWarning(this._chatModel);
          }
        }),
      );
    }

    // Listen for prompt fragment changes to refresh capabilities
    this.toDispose.push(
      this.capabilitiesService.onDidChangeCapabilities(() => {
        this.refreshCapabilities();
      }),
    );

    // Refresh reasoning capability if the language model registry changes (model added/removed/alias re-resolved).
    this.toDispose.push(
      this.languageModelRegistry.onChange(() => {
        if (this.receivingAgent) {
          this.updateReasoningSupport(this.receivingAgent.agentId);
        }
      }),
    );

    // Listen for generic capabilities changes
    if (this.genericCapabilitiesService) {
      this.updateAvailableGenericCapabilities();
      this.toDispose.push(
        this.genericCapabilitiesService.onDidChangeAvailableCapabilities(() => {
          this.updateAvailableGenericCapabilities();
        }),
      );
    }
  }

  protected async updateAvailableGenericCapabilities(): Promise<void> {
    if (!this.genericCapabilitiesService) {
      return;
    }

    const mcpFunctions =
      await this.genericCapabilitiesService.getAvailableMCPFunctions();

    this.availableGenericCapabilities = {
      skills: this.genericCapabilitiesService.getAvailableSkills(),
      mcpFunctions,
      functions: this.genericCapabilitiesService.getAvailableFunctions(),
      promptFragments:
        this.genericCapabilitiesService.getAvailablePromptFragments(),
      agentDelegation: this.genericCapabilitiesService.getAvailableAgents(
        this.receivingAgent?.agentId,
      ),
      variables: this.genericCapabilitiesService.getAvailableVariables(),
    };

    this.update();
  }

  protected isTokenUsageWarningEnabled(): boolean {
    return this.preferenceService?.get<boolean>(CHAT_VIEW_TOKEN_USAGE_WARNING_ENABLED, false) ?? false;
  }

  protected getPreferenceDefaultAgent(): ChatAgent | undefined {
    return this.chatAgentService.getPreferenceDefaultAgent();
  }

  protected evaluateTokenUsageWarning(chatModel: ChatModel): void {
    if (!this.isTokenUsageWarningEnabled()) {
      return;
    }
    // `responseChanged` fires on every streaming tick, but providers typically
    // only set `tokenUsage` at completion. Skip in-progress responses so we do
    // the walk + decision once per response rather than per chunk.
    const lastRequest = chatModel.getRequests().at(-1);
    if (lastRequest && !lastRequest.response.isComplete) {
      return;
    }

    // 计算当前会话的token使用情况
    const decision = decideTokenUsageWarning({
      totalTokens: computeSessionTokenUsage(chatModel),
      threshold: this.getTokenUsageWarningThreshold(),
      alreadyNotified: this.notifiedSessions.has(chatModel.id)
    });
    if (decision === 'reset') {
      this.notifiedSessions.delete(chatModel.id);
    } else if (decision === 'notify') {
      this.notifiedSessions.add(chatModel.id);
      this.showTokenUsageWarning();
    }
  }

  protected async showTokenUsageWarning(): Promise<void> {
    const percentage = this.getTokenUsageWarningThresholdPercentage();
    const message = nls.localize(
      'theia/ai/chat-ui/tokenUsageWarningMessage',
      '聊天会话的令牌使用量已达到上下文窗口的{0}%。请考虑开始新会话,以避免达到上限。',
      percentage
    );
    this.notificationService.warn(message, {
      timeout: 0,
      source: 'AI Assistant',
      actions: [
        {
          label: "开始新聊天",
          type: "primary",
          callback: async () => {
            this.commands.execute(AI_CHAT_NEW_CHAT_WINDOW_COMMAND.id);
          },
        }
      ]
    })
  }

  /**
   * Resolve the configured token usage warning threshold as an absolute token count.
   * The preference is stored as a percentage of the context window; this method
   * converts it using the current assumed context window size.
   */
  protected getTokenUsageWarningThreshold(): number {
    const percentage = this.getTokenUsageWarningThresholdPercentage();
    return Math.round((percentage / 100) * CHAT_CONTEXT_WINDOW_SIZE);
  }

  protected getTokenUsageWarningThresholdPercentage(): number {
    const value = this.preferenceService?.get<number>(
        CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE,
        CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT
    );
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 1 || value > 100) {
        return CHAT_VIEW_TOKEN_USAGE_WARNING_THRESHOLD_PERCENTAGE_DEFAULT;
    }
    return value;
  }

  private async loadSessions(): Promise<void> {
    try {
      const persisted = await this.chatService.getPersistedSessions();
      this.chatSessionIndex = persisted;
      this.update();
    } catch (e) {
      console.warn("加载会话失败", e);
    }
  }

  protected initListeners(): void {
    this.toDispose.pushAll([
      this.chatService.onSessionEvent((event) => {
        if (!isActiveSessionChangedEvent(event)) {
          return;
        }
        const session = event.sessionId
          ? this.chatService.getSession(event.sessionId)
          : this.chatService.createSession();
        if (session) {
          this.chatSession = session;
          this.trackChatModel(this.chatSession.model);
          this.chatModel = this.chatSession.model;
          this.pinnedAgent = this.chatSession.pinnedAgent;

          // ==============================================
          // ✅ 切换会话时：自动同步全局上下文
          // ==============================================
          this.syncGlobalContextToCurrentChatModel();
        } else {
          console.warn(`Session with ${event.sessionId} not found.`);
        }
      }),
    ]);
  }

  protected scheduleUpdateReceivingAgent(): void {
    if (this.queryInFlight) {
      // Don't update capabilities while a query is being sent — the editor is being
      // cleared and the async sendRequest hasn't set session.pinnedAgent yet,
      // which would cause a stale resolution to the default agent.
      return;
    }
    if (this.updateReceivingAgentTimeout !== undefined) {
      clearTimeout(this.updateReceivingAgentTimeout);
    }
    this.updateReceivingAgentTimeout = window.setTimeout(() => {
      this.updateReceivingAgent();
      this.updateReceivingAgentTimeout = undefined;
    }, 200);
  }

  protected async updateReceivingAgent(): Promise<void> {
    if (!this._chatModel) {
      if (this.receivingAgent !== undefined) {
        this.receivingAgent = undefined;
        this.update();
      }
      return;
    }

    try {
      const request = { text: "" };
      const resolvedContext = { variables: [] };
      const parsedRequest = await this.chatRequestParser.parseChatRequest(
        request,
        this._chatModel.location,
        resolvedContext,
      );
      const session = this.chatService
        .getSessions()
        .find((s) => s.model.id === this._chatModel.id);
      if (session) {
        const resolvedAgent = this.resolveAgentFromParsedRequest(
          parsedRequest,
          session,
        );
        // Prefer the widget's pinned agent over the resolved agent, because
        // chatService.getAgent() may return the default preference agent
        // instead of the session's pinned agent (e.g. after sending a message
        // when the input is empty).
        const agent = this._pinnedAgent ?? resolvedAgent;
        await this.updateAgentState(agent);
      } else if (this.receivingAgent !== undefined) {
        this.receivingAgent = undefined;
        this.update();
      }
    } catch (error) {
      console.warn("Failed to determine receiving agent:", error);
      if (this.receivingAgent !== undefined) {
        this.receivingAgent = undefined;
        this.update();
      }
    }
  }

  /**
   * Resolves the agent to use for the given parsed request.
   * If a session is provided, uses session-based logic including pinned agents.
   * Otherwise, delegates to ChatAgentService.
   */
  protected resolveAgentFromParsedRequest(
    parsedRequest: ParsedChatRequest,
    session?: ChatSession,
  ): ChatAgent | undefined {
    if (session) {
      return this.chatService.getAgent(parsedRequest, session);
    }
    return this.chatAgentService.resolveAgent(parsedRequest);
  }

  protected async updateAgentState(
    agent: ChatAgent | undefined,
  ): Promise<void> {
    const agentId = agent?.id ?? "";
    const previousAgentId = this.receivingAgent?.agentId;

    // Only update and re-render when the agent changes (or on forced refresh after session switch)
    const needsRefresh = this.forceCapabilitiesRefresh;
    this.forceCapabilitiesRefresh = false;
    if (agent && agentId !== previousAgentId) {
      const modes = agent.modes ?? [];
      const defaultMode = modes.find((m) => m.isDefault);
      const hasPreviousRequests = this._chatModel.getRequests().length > 0;
      const restoredModeId = hasPreviousRequests
        ? this.getLastModeIdFromModel(this._chatModel)
        : undefined;
      const initialModeId = restoredModeId ?? defaultMode?.id;
      this.receivingAgent = {
        agentId: agentId,
        modes,
        currentModeId: initialModeId,
      };
      // Only preserve overrides on forced refresh if the session has previous requests
      const shouldPreserveOverrides = needsRefresh && hasPreviousRequests;
      await this.updateCapabilitiesForAgent(
        agentId,
        initialModeId,
        shouldPreserveOverrides,
      );
      this.updateReasoningSupport(agentId);
    } else if (!agent && this.receivingAgent !== undefined) {
      this.receivingAgent = undefined;
      this.capabilityDefaults = [];
      this.userCapabilityOverrides = new Map();
    }
    this.update();
  }

  protected async updateReasoningSupport(
    agentId: string | undefined,
  ): Promise<void> {
    let support: ReasoningSupport | undefined;
    let modelId: string | undefined;
    if (agentId) {
      const agent = this.chatAgentService.getAgent(agentId);
      if (agent) {
        for (const requirement of agent.languageModelRequirements ?? []) {
          try {
            const model = await this.languageModelRegistry.selectLanguageModel({
              agent: agent.id,
              ...requirement,
            });
            if (model?.reasoningSupport) {
              support = model.reasoningSupport;
              modelId = model.id;
              break;
            }
          } catch (error) {
            console.warn(
              "Failed to resolve language model for reasoning support:",
              error,
            );
          }
        }
      }
    }
    // if (support !== this.currentReasoningSupport || modelId !== this.currentLanguageModelId) {
    //   this.currentReasoningSupport = support;
    //   this.currentLanguageModelId = modelId;
    //   this.update();
    // }
  }

  /**
   * Extracts capability overrides from the last request in the chat model.
   * Used to restore user's capability choices when switching sessions or on reload.
   */
  protected getLastCapabilityOverridesFromModel(
    chatModel: ChatModel,
  ): Map<string, boolean> {
    const requests = chatModel.getRequests();
    if (requests.length === 0) {
      return new Map();
    }
    const lastRequest = requests[requests.length - 1];
    const overrides = lastRequest.request.capabilityOverrides;
    if (!overrides) {
      return new Map();
    }
    return new Map(Object.entries(overrides));
  }

  protected getLastModeIdFromModel(chatModel: ChatModel): string | undefined {
    const requests = chatModel.getRequests();
    if (requests.length === 0) {
      return undefined;
    }
    const lastRequest = requests[requests.length - 1];
    return lastRequest.response.promptVariantId;
  }

  protected readonly toDisposeOnChatModelChange = new DisposableCollection();
  public trackChatModel(chatModel: ChatModel): void {
    this.toDisposeOnChatModelChange.dispose();
    this.recreateModelTree(chatModel);

    // chatModel.getRequests().forEach((request) => {
    //   if (!request.response.isComplete) {
    //     // 开始响应...
    //   }
    // });
    this.toDisposeOnChatModelChange.pushAll([
      chatModel.onDidChange((event) => {
        if (event.kind === "enableEdit" || event.kind === "cancelEdit") {
          this.update();
          return;
        } else if (event.kind === "changeHierarchyBranch") {
        }

        this.recreateModelTree(chatModel);

        if (event.kind === "addRequest" && !event.request.response.isComplete) {
          event.request.response.onDidChange(() => {
            // console.log("addRequest =>> response:: ", chatModel);
          });
        }
      }),
    ]);
  }

  public recreateModelTree(chatModel: ChatModel): void {
    if (CompositeTreeNode.is(this.treeModel)) {
      const nodes: TreeNode[] = [];
      this.chatModelId = chatModel.id;
      chatModel.getBranches().forEach((branch) => {
        const request = branch.get();
        nodes.push(this.mapRequestToNode(branch));
        nodes.push(this.mapResponseToNode(request.response));
      });
      this.treeModel.children = nodes;
      this.update();
    }
  }

  protected mapRequestToNode(branch: ChatHierarchyBranch): RequestNode {
    return {
      parent: this.treeModel as CompositeTreeNode,
      get id(): string {
        return this.request.id;
      },
      get request(): ChatRequestModel {
        return branch.get();
      },
      branch,
      sessionId: this.chatModelId,
    };
  }

  protected mapResponseToNode(response: ChatResponseModel): ResponseNode {
    return {
      id: response.id,
      parent: this.treeModel,
      response,
      sessionId: this.chatModelId,
    };
  }

  private createSession(): void {
    this.chatSession = this.chatService.createSession();
    this.chatModel = this.chatSession.model;

    // ==============================================
    // ✅ 新建会话时：自动同步上下文（核心修复）
    // ==============================================
    this.syncGlobalContextToCurrentChatModel();

    this.trackChatModel(this.chatSession.model);
    this.update();
  }

  private async selectSession(sessionId: string): Promise<void> {
    try {
      const session = await this.chatService.getOrRestoreSession(sessionId);
      if (session) {
        this.chatService.setActiveSession(sessionId, { focus: false });
        this.update();
      } else {
        console.warn(`AI Chat navigation: session ${sessionId} not found`);
      }
    } catch (e) {
      console.warn("切换会话失败", e);
    }
  }

  private async deleteSession(sessionId: string): Promise<void> {
    try {
      this.chatService.deleteSession(sessionId);
      const activeSession = this.chatService.getActiveSession();
      try {
        await this.chatService.deleteSession(sessionId);
        this.checkPersistedSessions();
        if (activeSession && activeSession.id === sessionId) {
          this.chatService.createSession(ChatAgentLocation.Panel, {
            focus: true,
          });
        }
      } catch (error) {
        this.logger.error("Failed to delete chat session", error);
      }
      this.update();
    } catch (e) {
      console.warn("删除会话失败", e);
    }
  }

  protected async checkPersistedSessions(): Promise<void> {
    try {
      this.hasPersistedSessions = await this.chatService.hasPersistedSessions();
    } catch (e) {
      this.logger.error("Failed to check persisted AI sessions", e);
      this.hasPersistedSessions = false;
    }
  }

  private updateModels(models: LanguageModel[]): void {
    const aiModels = models
      .filter((m) => m.status.status === "ready")
      .map((m) => m.id);
    this.models = aiModels || [];
    this.modelOptions = this.models.map((m) => ({ value: m, label: m }));
    this.update();
  }

  protected async hasReadyLanguageModels(): Promise<boolean> {
    const models = await this.languageModelRegistry.getLanguageModels();
    return models.some((model) => model.status.status === "ready");
  }

  private async openHistoryWidget(): Promise<void> {
    await this.quickInputService.showQuickPick({
      placeholder: "选择历史会话...",
      items: [...Object.values(this.chatSessionIndex ?? {})]
        .reverse()
        .map((item: ChatSessionMetadata) => ({
          label: item.title,
          iconClass: "codicon codicon-comment",
          description: formatTimeRelative(item.saveDate),
          picked: async () =>
            item.sessionId === (await this.chatService.getActiveSession()?.id),
          execute: async () => {
            this.selectSession(item.sessionId);
          },
          buttons: [
            {
              iconClass: "codicon codicon-trash",
              tooltip: "从历史会话中删除",
              callback: async () => {
                const confirmDialog = new ConfirmDialog({
                  title: "确定要删除此聊天会话？",
                  msg: `此操作不可撤销。`,
                  ok: Dialog.OK,
                  cancel: Dialog.CANCEL,
                });
                const confirmed = await confirmDialog.open();
                if (confirmed) {
                  await this.deleteSession(item.sessionId);
                  // 返回 true 关闭面板，并重新打开
                  setTimeout(() => this.openHistoryWidget(), 100);
                  return true;
                }
                return false;
              },
            },
          ],
        })),
    });
  }

  private registerPanel(): ActivityHandle {
    const activityManager = this.shellLayout.activityManager;
    return activityManager.registerActivity({
      id: "magic-chat",
      title: "智能助手",
      iconClass: "codicon codicon-comment-discussion-sparkle",
      priority: 10,
      location: "right-top",
      toolbarConfig: {
        id: "magic-chat-toolbar",
        showTitle: true,
        items: [
          {
            id: "magic-chat-add-setting-item",
            type: "button",
            commandId: "aiConfiguration:toggle",
          },
          {
            id: "magic-chat-history-toolbar-item",
            type: "button",
            commandId: AI_CHAT_SHOW_CHATS_COMMAND.id,
          },
          {
            id: "magic-chat-add-toolbar-item",
            type: "button",
            commandId: AI_CHAT_NEW_CHAT_WINDOW_COMMAND.id,
          },
        ],
      },
      factory: () => this,
    });
  }

  registerCommands(commands: CommandRegistry): void {
    commands.addCommand(AI_CHAT_SHOW_CHATS_COMMAND.id, {
      label: AI_CHAT_SHOW_CHATS_COMMAND.label,
      iconClass: AI_CHAT_SHOW_CHATS_COMMAND.iconClass,
      execute: () => this.openHistoryWidget(),
    });
    commands.addCommand(AI_CHAT_NEW_CHAT_WINDOW_COMMAND.id, {
      label: AI_CHAT_NEW_CHAT_WINDOW_COMMAND.label,
      iconClass: AI_CHAT_NEW_CHAT_WINDOW_COMMAND.iconClass,
      execute: () => this.createSession(),
    });
  }

  protected handleCapabilityChange = (
    fragmentId: string,
    enabled: boolean,
  ): void => {
    const defaultCapability = this.capabilityDefaults.find(
      (c) => c.fragmentId === fragmentId,
    );
    const sessionOverrides = new Map(this.userCapabilityOverrides);

    if (enabled === defaultCapability?.defaultEnabled) {
      // User set it back to default, remove the override
      sessionOverrides.delete(fragmentId);
    } else {
      // User explicitly changed from default, add as override
      sessionOverrides.set(fragmentId, enabled);
    }

    this.userCapabilityOverrides = sessionOverrides;
    this.update();
  };

  toggleCapabilities(): void {
    this.capabilitiesOpen = !this.capabilitiesOpen;
    this.update();
  }

  /**
   * Extracts generic capability selections from the last request in the chat model.
   * Used to restore user's selections when switching sessions or on reload.
   */
  protected getLastGenericCapabilitySelectionsFromModel(
    chatModel: ChatModel,
  ): GenericCapabilitySelections {
    const requests = chatModel.getRequests();
    if (requests.length === 0) {
      return {};
    }
    const lastRequest = requests[requests.length - 1];
    return lastRequest.request.genericCapabilitySelections ?? {};
  }

  /**
   * Refreshes capabilities for the current receiving agent.
   * Called when prompt fragments change to ensure capabilities reflect the latest template.
   */
  protected async refreshCapabilities(): Promise<void> {
    if (this.receivingAgent) {
      await this.updateCapabilitiesForAgent(
        this.receivingAgent.agentId,
        this.receivingAgent.currentModeId,
      );
    }
  }

  /**
   * Checks if current capability overrides differ from saved settings.
   */
  protected hasCapabilityChangesFromSaved(): boolean {
    const saved = this.savedCapabilityOverrides ?? {};
    const savedKeys = Object.keys(saved);
    const currentKeys = Array.from(this.userCapabilityOverrides.keys());

    if (savedKeys.length !== currentKeys.length) {
      return true;
    }

    return !currentKeys.every(
      (key) => saved[key] === this.userCapabilityOverrides.get(key),
    );
  }

  /**
   * Checks if current generic capability selections differ from saved settings.
   */
  protected hasGenericCapabilityChangesFromSaved(): boolean {
    const saved = this.savedGenericCapabilitySelections ?? {};
    const current = this.genericCapabilitySelections;

    const types: (keyof GenericCapabilitySelections)[] = [
      "skills",
      "mcpFunctions",
      "functions",
      "promptFragments",
      "agentDelegation",
      "variables",
    ];
    for (const type of types) {
      const savedArray = saved[type] ?? [];
      const currentArray = current[type] ?? [];

      if (!this.arraysEqualUnordered(savedArray, currentArray)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compares two string arrays for equality (order-independent).
   */
  protected arraysEqualUnordered(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    const setA = new Set(a);
    const setB = new Set(b);
    if (setA.size !== setB.size) {
      return false;
    }
    for (const item of setB) {
      if (!setA.has(item)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if there are any unsaved changes (capability overrides or generic selections).
   * Reasoning is auto-persisted in {@link handleReasoningChange} and is intentionally excluded.
   */
  public hasAnyChangesFromSaved(): boolean {
    if (this.receivingAgent === undefined) {
      return false;
    }
    return (
      this.hasCapabilityChangesFromSaved() ||
      this.hasGenericCapabilityChangesFromSaved()
    );
  }

  /**
   * Saves current capability selections to settings.
   * Reasoning is auto-persisted via {@link handleReasoningChange} and is not part of this flow.
   */
  public async saveCurrentSelectionsToSettings(): Promise<void> {
    if (!this.receivingAgent) {
      return;
    }

    const agentId = this.receivingAgent.agentId;

    // Convert userCapabilityOverrides Map to Record
    const capabilityOverrides: Record<string, boolean> = {};
    for (const [key, value] of this.userCapabilityOverrides) {
      capabilityOverrides[key] = value;
    }

    try {
      await this.aiSettingsService.updateAgentSettings(agentId, {
        capabilityOverrides:
          Object.keys(capabilityOverrides).length > 0
            ? capabilityOverrides
            : undefined,
        genericCapabilitySelections: GenericCapabilitySelections.hasSelections(
          this.genericCapabilitySelections,
        )
          ? this.genericCapabilitySelections
          : undefined,
      });

      // Update saved state to match current
      this.savedCapabilityOverrides =
        Object.keys(capabilityOverrides).length > 0
          ? { ...capabilityOverrides }
          : undefined;
      this.savedGenericCapabilitySelections =
        GenericCapabilitySelections.hasSelections(
          this.genericCapabilitySelections,
        )
          ? { ...this.genericCapabilitySelections }
          : undefined;

      this.update();
    } catch (error) {
      console.error("Failed to save capability selections to settings:", error);
    }
  }

  protected handleGenericCapabilityChange = (
    type: keyof GenericCapabilitySelections,
    ids: string[],
  ): void => {
    this.genericCapabilitySelections = {
      ...this.genericCapabilitySelections,
      [type]: ids,
    };
    this.update();
  };

  protected handleResetGenericCapabilities = (): void => {
    const saved = this.savedGenericCapabilitySelections ?? {};
    this.genericCapabilitySelections = { ...saved };
    this.update();
  };

  protected async updateCapabilitiesForAgent(
    agentId: string,
    modeId?: string,
    preserveOverrides?: boolean,
  ): Promise<void> {
    const capabilities = await this.capabilitiesService.getCapabilitiesForAgent(
      agentId,
      modeId,
    );
    this.capabilityDefaults = capabilities;
    if (!preserveOverrides) {
      // Load saved settings from preferences
      const agentSettings =
        await this.aiSettingsService.getAgentSettings(agentId);
      const savedOverrides = agentSettings?.capabilityOverrides;
      const savedGenericSelections = agentSettings?.genericCapabilitySelections;
      const savedReasoning = agentSettings?.reasoning;

      // Store saved state for comparison
      this.savedCapabilityOverrides = savedOverrides
        ? { ...savedOverrides }
        : undefined;
      this.savedGenericCapabilitySelections = savedGenericSelections
        ? { ...savedGenericSelections }
        : undefined;
      this.savedReasoning = savedReasoning ? { ...savedReasoning } : undefined;

      // Initialize from saved settings, or empty if none
      this.userCapabilityOverrides = savedOverrides
        ? new Map(Object.entries(savedOverrides))
        : new Map<string, boolean>();
      this.genericCapabilitySelections = savedGenericSelections ?? {};
      // Mirror the saved per-agent reasoning into the chat session so the selector reflects it
      // immediately on session/agent switch.
      this.applyReasoningToSession(savedReasoning);
    }

    // Update disabled generic capabilities (already used in agent prompt)
    this.disabledGenericCapabilities =
      await this.capabilitiesService.getUsedGenericCapabilitiesForAgent(
        agentId,
        modeId,
      );

    this.update();
  }

  /** Updates the active chat session's `commonSettings.reasoning`; pass `undefined` to clear. */
  protected applyReasoningToSession(
    reasoning: ReasoningSettings | undefined,
  ): void {
    const session = this.chatService
      .getSessions()
      .find((s) => s.model.id === this._chatModel?.id);
    if (!session) {
      return;
    }
    const currentSettings = session.model.settings ?? {};
    const currentCommon = currentSettings.commonSettings ?? {};
    if (
      (currentCommon.reasoning?.level ?? undefined) ===
      (reasoning?.level ?? undefined)
    ) {
      return; // no-op when already in sync
    }
    const newCommon: typeof currentCommon = { ...currentCommon };
    if (reasoning) {
      newCommon.reasoning = { ...reasoning };
    } else {
      delete newCommon.reasoning;
    }
    (session.model as MutableChatModel).setSettings({
      ...currentSettings,
      commonSettings: newCommon,
    });
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.update();
  }

  protected render(): React.ReactNode {
    return createElement(AIChatPanel, {
      isEnabled: this.isEnabled,
      chatModel: this._chatModel,
      defaultAgent: this.getPreferenceDefaultAgent(),
      receivingAgent: this.receivingAgent,
      agents: this.agents,
      modelOptions: this.modelOptions,
      activeSession: this.chatService.getActiveSession(),
      currentFile: this.currentFile,
      messages: this.treeModel,
      loading: this.loading,
      antdTheme: this.antdTheme,
      onSend: this._onQuery.bind(this),
      onCancel: () => this.cancelRequest(),
      onEnableFileContext: () => this.enableFileContext(),
      onDisableFileContext: () => this.disableFileContext(),
      onModelChange: (m: string) => {
        this.currentModel = m;
      },
      chatResponsePartRenderers: this.chatResponsePartRenderers,
      openerService: this.openerService,
      hoverService: this.hoverService,
      capabilitiesProps: {
        capabilities: this.capabilityDefaults,
        overrides: this.userCapabilityOverrides,
        onCapabilityChange: this.handleCapabilityChange,
        isOpen: this.capabilitiesOpen,
        onToggle: () => this.toggleCapabilities(),
        // keybindingHint: this.getCapabilitiesKeybindingHint(),
        hasUnsavedChanges: this.hasAnyChangesFromSaved(),
        onSaveToSettings: () => this.saveCurrentSelectionsToSettings(),
      },
      genericCapabilitiesProps: {
        genericCapabilities: this.genericCapabilitySelections,
        onGenericCapabilityChange: this.handleGenericCapabilityChange,
        onResetGenericCapabilities: this.handleResetGenericCapabilities,
        availableCapabilities: this.availableGenericCapabilities,
        disabledCapabilities: this.disabledGenericCapabilities,
        hoverService: this.hoverService,
      },
      tokenUsageEnabled: this.tokenUsageEnabled,
      totalTokens: computeSessionTokenUsage(this._chatModel),
      tokenUsageWarningThreshold: this.getTokenUsageWarningThreshold()
    });
  }

  private updateAntdTheme(themeEvent: ThemeChangedEvent): void {
    const newTheme = themeEvent.newTheme;
    if (!newTheme) return;
    this.antdTheme = {
      token: {
        colorPrimary: newTheme.variables["--magic-idea-primary-color"],
        colorBgContainer: newTheme.variables["--magic-idea-editor-background"],
        colorBgElevated: newTheme.variables["--magic-idea-menu-background"],
        colorText: newTheme.variables["--magic-idea-foreground"],
        colorTextSecondary:
          newTheme.variables["--magic-idea-secondary-foreground"],
        colorBorder: newTheme.variables["--magic-idea-input-border"],
      },
      cssVar: { prefix: "magic-idea", key: newTheme.id },
      algorithm:
        newTheme.monacoTheme === "vs-dark"
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
    };
  }

  private updateCurrentFileFromEditor(): void {
    this.editorDisposables.dispose();

    if (!this.editorWidget) {
      this.currentFile = null;
      this.removeFileContextVariable();
      return;
    }
    try {
      const editor = this.editorWidget.editor.getControl();
      const uri = this.editorWidget.getResourceUri();
      this.setLabels(uri);
      this.updateSelectionStatsBySelection(
        editor,
        editor?.getSelection() || null,
      );

      const selectionDisposable = editor?.onDidChangeCursorSelection(
        (event: any) => {
          this.updateSelectionStatsBySelection(editor, event.selection);
        },
      );

      const lableDisposable = this.labelProvider.onDidChange((event) => {
        const uri: URI | undefined = this.editorWidget?.getResourceUri();
        if (uri && event.affects(uri)) {
          this.setLabels(uri);
        }
      });

      this.editorDisposables.pushAll([lableDisposable, selectionDisposable]);
    } catch (e) {
      console.warn("无法读取编辑器上下文", e);
      this.currentFile = null;
    }
  }

  private setLabels(uri?: URI): void {
    if (!uri) {
      this.currentFile = null;
      return;
    }
    const icon = this.labelProvider.getIcon(uri);
    const iconColor = this.labelProvider.getIconColor(uri);
    const label = this.labelProvider.getName(uri);
    const file = this.fileSystemService.getFileState(uri);
    const model = this.editorWidget?.editor.getControl().getModel();
    const languageId = model?.getLanguageId() || "unknown";
    if (!file) {
      return;
    }
    this.currentFile = {
      ...(this.currentFile || { isContextEnabled: false }),
      icon,
      iconColor,
      name: label,
      languageId,
      uri: file.uri.toString(),
      fileMetaData: file.fileData,
    };
    this.addContext();
    this.update();
  }

  private updateSelectionStatsBySelection(
    editor: monaco.editor.IStandaloneCodeEditor,
    selection: monaco.Range | null,
  ) {
    if (!selection || selection.isEmpty()) {
      this.currentFile = {
        ...this.currentFile,
        selectionLineText: undefined,
        selectionText: undefined,
      };
      this.update();
      return;
    }
    const model = editor.getModel();
    if (!model) return;
    const lineText = `${selection.startLineNumber}-${selection.endLineNumber}`;
    const selectedText = selection ? model?.getValueInRange(selection) : "";
    this.currentFile = {
      ...this.currentFile,
      selectionLineText: lineText,
      selectionText: selectedText,
    };
    this.update();
  }

  private setLoading(flag: boolean) {
    this.loading = flag;
    this.update();
  }

  private enableFileContext() {
    if (!this.currentFile) return;
    this.currentFile.isContextEnabled = true;
    this.addContext();
    this.update();
  }

  private disableFileContext() {
    if (!this.currentFile) return;
    this.currentFile.isContextEnabled = false;
    this.removeFileContextVariable();
    this.update();
  }

  // ==============================================
  // ✅ 添加上下文：存入全局变量，再同步到模型
  // ==============================================
  addContext(): void {
    if (!this.currentFile || !this.currentFile.isContextEnabled) return;

    this.removeFileContextVariable();

    const variable: AIVariableResolutionRequest = {
      variable: { id: "file", name: "file", description: "当前上下文文件" },
      arg: this.currentFile.uri,
    };

    // 存入全局
    this.globalContextVariables.push(variable);
    // 同步到当前模型
    this.syncGlobalContextToCurrentChatModel();
  }

  // ==============================================
  // ✅ 移除文件上下文
  // ==============================================
  removeFileContextVariable(): void {
    this.globalContextVariables = this.globalContextVariables.filter(
      (v) => v.variable.id !== "file",
    );
    this.syncGlobalContextToCurrentChatModel();
  }

  // ==============================================
  // ✅ 核心：全局上下文 → 当前会话模型
  // ==============================================
  private syncGlobalContextToCurrentChatModel(): void {
    if (!this._chatModel) return;

    this._chatModel.context.clear();
    this.globalContextVariables.forEach((v) => {
      this._chatModel.context.addVariables(v);
    });
  }

  getAllVariablesForRequest(): AIVariableResolutionRequest[] {
    return [...this.globalContextVariables];
  }

  protected deleteContextElement(index: number): void {
    this.globalContextVariables.splice(index, 1);
    this.syncGlobalContextToCurrentChatModel();
  }

  private cancelRequest() {
    const currentRequest = this._chatModel.getRequests().at(-1);
    if (
      currentRequest &&
      !EditableChatRequestModel.isEditing(currentRequest) &&
      ChatRequestModel.isInProgress(currentRequest)
    ) {
      this.chatService.cancelRequest(this.chatSession.id, currentRequest.id);
      this.setLoading(false);
    }
  }

  private async handleSend(
    query: string | ChatRequest,
    modeId?: string,
    capabilityOverrides?: Record<string, boolean>,
    genericCapabilitySelections?: GenericCapabilitySelections,
  ) {
    if (!query || this.loading) return;
    try {
      const chatRequest: ChatRequest = !query
        ? { text: "" }
        : typeof query === "string"
          ? {
              text: query,
              modeId: modeId || this.currentModel,
              capabilityOverrides,
              genericCapabilitySelections,
            }
          : { ...query, capabilityOverrides, genericCapabilitySelections };
      if (chatRequest.text.length === 0) {
        return;
      }
      this.setLoading(true);

      const allVariables = this.getAllVariablesForRequest();
      const requestWithVariables: ChatRequest =
        allVariables.length > 0
          ? { ...chatRequest, variables: allVariables }
          : chatRequest;

      let requestProgress;
      try {
        requestProgress = await this.chatService.sendRequest(
          this.chatSession.id,
          requestWithVariables,
        );
      } finally {
      }

      requestProgress?.responseCompleted
        .then((responseModel) => {
          if (responseModel.isError) {
            this.notificationService.error(
              responseModel.errorObject?.message ?? "AI 服务调用出错",
            );
          }
        })
        .finally(() => {
          this.pinnedAgent = this.chatSession.pinnedAgent;
          this.setLoading(false);
        });

      if (!requestProgress) {
        this.notificationService.error("无法发送请求");
        return;
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this.update();
  }

  dispose(): void {
    super.dispose();
    this.disposables.dispose();
  }
}
