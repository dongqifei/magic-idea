import { AbstractStreamParsingChatAgent } from '@MagicIdea/ai-chat/common';
import { LanguageModelRequirement } from '@MagicIdea/ai-core';
import { injectable } from 'inversify';
import { nls } from '@MagicIdea/core';
import { askSystemVariants } from './common/ask-prompt-template';

@injectable()
export class AskAgent extends AbstractStreamParsingChatAgent {

    // 智能体唯一标识（必须唯一）
    id = 'Ask';
    name = '智能问答';

    // 模型配置
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';

    // 智能体描述
    override description = nls.localize('theia/ai/chat/askAgent/description',
    '通用 AI 问答助手，可回答技术问题、提供代码解释、排查错误并辅助完成编程任务。支持工作区上下文，直接提问即可获得清晰、准确的回答。');

    // 无特殊模板 → 通用对话直接留空数组
    override prompts = [askSystemVariants];

    // 无系统提示词 → 使用底层默认通用提示词
    protected override systemPromptId: string | undefined = askSystemVariants.id;

    // 图标：使用 codicon 通用问答图标（可自行更换）
    override iconClass: string = 'codicon codicon-comment-discussion';
}