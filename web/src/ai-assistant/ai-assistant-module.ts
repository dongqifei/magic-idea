import { interfaces } from 'inversify';
import { PreferenceContribution } from '@MagicIdea/core/preferences/preference-contribution';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@MagicIdea/core';
import { TabBarToolbarContribution } from '@MagicIdea/core/shell/tab-bar-toolbar';
import { bindRootContributionProvider } from '@MagicIdea/core';
import { CommandContribution } from '@MagicIdea/core/commands';
import { AIChatWidget } from "./ai-assistant-chat-widget";
import { AIChatContribution } from './ai-assistant-contribution';
import { AIAssistantPreferencesSchema } from "./ai-assistant-preferences";
import { ChatResponsePartRenderer } from "./chat-response-part-renderer";
import { ChangeSetActionRenderer, ChangeSetActionService } from './change-set-actions/change-set-action-service';
import { ChangeSetAcceptAction } from './change-set-actions/change-set-accept-action';
import {
    CodePartRenderer,
    CodePartRendererAction,
    CommandPartRenderer,
    CopyToClipboardButtonAction,
    ErrorPartRenderer,
    // HorizontalLayoutPartRenderer,
    InsertCodeAtCursorButtonAction,
    MarkdownPartRenderer,
    ToolCallPartRenderer,
    NotAvailableToolCallRenderer,
    ThinkingPartRenderer,
    QuestionPartRenderer,
    ProgressPartRenderer,
    // DelegationToolRenderer,
    TextPartRenderer,
} from './chat-response-renderer';
import { ChatCapabilitiesService, ChatCapabilitiesServiceImpl } from './chat-capabilities-service';
import { GenericCapabilitiesContribution, GenericCapabilitiesService, GenericCapabilitiesServiceImpl } from './generic-capabilities-service';
import { ChatPetWidget } from './chat-pet/chat-pet-widget';

import './style/index.css';
import './style/tool-call-rendering.css';

export const bindAIAssistantModule = (bind: interfaces.Bind) => {

    bindRootContributionProvider(bind, ChatResponsePartRenderer);
    bindRootContributionProvider(bind, ChangeSetActionRenderer);

    bind<ChatPetWidget>(ChatPetWidget).to(ChatPetWidget).inSingletonScope();
    bind<AIChatWidget>(AIChatWidget).to(AIChatWidget).inSingletonScope();
    bind(CommandContribution).toService(AIChatWidget)
    // let chatViewWidget: AIChatWidget | undefined;
    // bind(WidgetFactory).toDynamicValue(context => ({
    //     id: AIChatWidget.ID,
    //     createWidget: () => {
    //         if (chatViewWidget?.isDisposed !== false) {
    //             chatViewWidget = context.container.get<AIChatWidget>(AIChatWidget);
    //         }
    //         return chatViewWidget;
    //     }
    // })).inSingletonScope();

    bind<AIChatContribution>(AIChatContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(AIChatContribution);
    bind(FrontendApplicationContribution).toService(AIChatContribution);
    bind(TabBarToolbarContribution).toService(AIChatContribution);

    bind(ChatResponsePartRenderer).to(ErrorPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(CommandPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(CodePartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(NotAvailableToolCallRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(ThinkingPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(ToolCallPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(MarkdownPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(QuestionPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(ProgressPartRenderer).inSingletonScope();
    bind(ChatResponsePartRenderer).to(TextPartRenderer).inSingletonScope();

    bindRootContributionProvider(bind, CodePartRendererAction);
    // bind(CodePartRendererAction).to(InsertCodeAtCursorButtonAction).inSingletonScope();
    bind(CodePartRendererAction).to(CopyToClipboardButtonAction).inSingletonScope();

    bind(ChangeSetActionService).toSelf().inSingletonScope();
    bind(ChangeSetAcceptAction).toSelf().inSingletonScope();
    bind(ChangeSetActionRenderer).toService(ChangeSetAcceptAction);


    bind(ChatCapabilitiesServiceImpl).toSelf().inSingletonScope();
    bind(ChatCapabilitiesService).toService(ChatCapabilitiesServiceImpl);

    bindRootContributionProvider(bind, GenericCapabilitiesContribution);
    bind(GenericCapabilitiesServiceImpl).toSelf().inSingletonScope();
    bind(GenericCapabilitiesService).toService(GenericCapabilitiesServiceImpl);

    // 绑定ai助手偏好配置
    bind(PreferenceContribution).toConstantValue({ schema: AIAssistantPreferencesSchema });
}