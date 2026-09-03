import { inject, injectable, postConstruct, named, optional } from "inversify";
import React, { createElement } from "react";
import { ReactWidget, DisposableCollection, IDisposable, Widget } from "@MagicIdea/core";
import { 
  ChatModel, ChatAgent, ChatResponseContent, ChatSession, ParsedChatRequestAgentPart, 
  ParsedChatRequestFunctionPart, ParsedChatRequestVariablePart, ChatMode,
  ChatResponseModel, ThinkingChatResponseContent, ToolCallChatResponseContent
} from '@MagicIdea/ai-chat/common';
import ChatPetViews, { PetStatus } from './chat-pet-views';

@injectable()
export class ChatPetWidget extends ReactWidget {
  
  // 1. 初始化默认值
  protected _status: PetStatus = 'idle' as PetStatus;
  protected _title: string = '';
  protected _content: string = '';

  protected onDisposeForChatModel = new DisposableCollection();
  
  updatePetInfo(chatModel: ChatModel): void {
    if(!chatModel){
      return
    }
    const requests = chatModel.getRequests();
    if (!requests || requests.length === 0) {
      this.resetPetState();
      this.update();
      return;
    }
    
    const lastRequest = requests.at(-1);
    if (!lastRequest?.response) {
      return;
    }

    this.updatePetStatus(lastRequest.response);
    this.update();
  }

  // 4. 提取重置状态的辅助方法
  private resetPetState(): void {
    this.setPetMessage({ status: 'idle', title: '等待任务...', content: '请发送消息以唤醒我' });
  }

  private setPetMessage(msg: { status: PetStatus, title: string; content: string; } | null): void {
    if (msg) {
      this._status = msg.status;
      this._title = msg.title;
      this._content = msg.content;
    } else {
      this._status = 'idle';
      this._title = '';
      this._content = '';
    }
  }

  protected updatePetStatus(response: ChatResponseModel): void {
    if (!response) {
      this.resetPetState();
      return;
    }

    if (response.isError) {
      this.setPetMessage({
         status: 'error',
        title: '出现了问题',
        content: response.errorObject?.message || '发生了异常，请重试。',
      });
      return;
    }

    if (response.isWaitingForInput) {
      this.setPetMessage({
        status: 'waiting',
        title: '等待你的输入',
        content: '需要你确认或提供更多信息才能继续',
      });
      return;
    }

    const progressMsg = response.progressMessages?.at(-1);
    if (progressMsg?.status === 'inProgress') {
      this.setPetMessage({
        status: 'thinking',
        title: '正在执行任务',
        content: '正在分析你的问题，请稍等...',
      });
      return;
    }

    const responseContent = response.response?.content;
    const latestContent = Array.isArray(responseContent) ? responseContent.at(-1) : undefined;

    if (!response.isComplete) {
      if (ThinkingChatResponseContent.is(latestContent)) {
        this.setPetMessage({
          status: 'thinking',
          title: '脑细胞疯狂燃烧中',
          content: '让我捋一捋，这个问题有点意思...',
        });
      } else if (ToolCallChatResponseContent.is(latestContent)) {
        const toolName = (latestContent as any)?.name;
        this.setPetMessage({
          status: 'tool',
          title: '偷偷摇人中',
          content: toolName 
            ? `已呼叫「${toolName}」前来助阵！` 
            : '正在翻箱倒柜找工具，马上给你变出答案✨',
        });
      } else {
        this.setPetMessage({
          status: 'responding',
          title: '疯狂码字中',
          content: '别急别急，好饭不怕晚，我正在使劲敲键盘...',
        });
      }
      return;
    }

    this.setPetMessage({
      status: 'done',
      title: '搞定！收工！',
      content: '回答完毕～ 随时等你丢新问题过来轰炸我 😎',
    });
  }
  
  protected render(): React.ReactNode {
    return createElement(ChatPetViews, {
      status: this._status,
      title: this._title,
      content: this._content
    });
  }
}