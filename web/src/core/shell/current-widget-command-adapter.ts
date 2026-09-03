import { CommandRegistry } from "@lumino/commands";
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { Title, Widget, TabBar } from "@lumino/widgets";
import { ApplicationShellLayout } from ".";

export interface TabBarContextMenuCommandHandler extends CommandRegistry.ICommandOptions {
  execute: (args: ReadonlyPartialJSONObject) => void;
  isEnabled?: (args: ReadonlyPartialJSONObject) => boolean;
  isVisible?: (args: ReadonlyPartialJSONObject) => boolean;
  isToggled?: (args: ReadonlyPartialJSONObject) => boolean;
}

export class CurrentWidgetCommandAdapter
  implements CommandRegistry.ICommandOptions
{
  private shell: ApplicationShellLayout;
  
  execute: CommandRegistry.CommandFunc<any>;
  isEnabled?: CommandRegistry.CommandFunc<boolean>;
  isVisible?: CommandRegistry.CommandFunc<boolean>;
  isToggled?: CommandRegistry.CommandFunc<boolean>;
  label?: string | CommandRegistry.CommandFunc<string>;
  iconClass?: string | CommandRegistry.CommandFunc<string>;
  iconLabel?: string | CommandRegistry.CommandFunc<string>;

  constructor(shell: ApplicationShellLayout, handler: TabBarContextMenuCommandHandler) {
    this.shell = shell;
    
    this.execute = (args: ReadonlyPartialJSONObject) => {
      handler.execute(this.createTransformedArgs(args));
    }
    
    if (handler.isEnabled) {
      this.isEnabled = (args: ReadonlyPartialJSONObject) => 
        !!handler.isEnabled?.(this.createTransformedArgs(args));
    }
    if (handler.isVisible) {
      this.isVisible = (args: ReadonlyPartialJSONObject) => 
        !!handler.isVisible?.(this.createTransformedArgs(args));
    }
    if (handler.isToggled) {
      this.isToggled = (args: ReadonlyPartialJSONObject) => 
        !!handler.isToggled?.(this.createTransformedArgs(args));
    }
    
    // 复制其他属性
    this.label = handler.label;
    this.iconClass = handler.iconClass;
    this.iconLabel = handler.iconLabel;
  }

  private createTransformedArgs(args: ReadonlyPartialJSONObject): ReadonlyPartialJSONObject {
    const transformed = this.transformArguments(this.shell, args);
    return {
      ...args, // 保留原始参数
      title: transformed[0],
      tabBar: transformed[1],
      event: transformed[2]
    };
  }

  protected transformArguments(
    shell: ApplicationShellLayout,
    event: ReadonlyPartialJSONObject,
  ): [Title<Widget> | undefined, TabBar<Widget> | undefined, ReadonlyPartialJSONObject] {
    const tabBar = shell.findTabBar(event);
    const title =tabBar && shell.findTitle(tabBar, event);
    return [title, tabBar, event];
  }
}