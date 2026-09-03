import { inject, injectable, named, postConstruct } from 'inversify';
import { ConfirmDialog } from '@MagicIdea/core/browser';
import { CommandRegistry} from '@MagicIdea/core/commands';
import { CommandContribution } from "@MagicIdea/core/commands";
import { FrontendApplication, FrontendApplicationContribution, MaybePromise, Widget } from '@MagicIdea/core';
import { EditorManager } from '@MagicIdea/editor/editor-manager';
import { AIChatWidget } from './ai-assistant-chat-widget';
import { AbstractViewContribution } from '@MagicIdea/core/shell/view-contribution';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@MagicIdea/core/shell/tab-bar-toolbar';
import { ChatPetWidget } from './chat-pet/chat-pet-widget';

@injectable()
export class AIChatContribution implements FrontendApplicationContribution, TabBarToolbarContribution, CommandContribution {
  
  @inject(ChatPetWidget)
  protected chatPetWidget: ChatPetWidget;

  constructor(){
  }

  @postConstruct()
  initialize(): void {

  }

  async onStart(app: FrontendApplication): Promise<void> {
    const container = await app.getHost();
    Widget.attach(this.chatPetWidget, container);
  }

  registerCommands(registry: CommandRegistry): void {

  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
  
  }
}