/**
 * 偏好设置组件
 */
import { inject, injectable } from "inversify";
import { createElement } from "react";
import { Widget } from "@lumino/widgets";
import { CommandRegistry } from "@lumino/commands";
import { KeybindingRegistry } from "@MagicIdea/core/keybinding";
import { Dialog, DialogResult } from "@MagicIdea/core/dialogs/dialog";
import { PreferenceService } from "@MagicIdea/core/preferences/preference-service";
import { PreferenceTreeGenerator } from "./utils/preference-tree-generator";
import { PreferenceView } from "./preference-view";

class PreferenceDialog extends Dialog<DialogResult> { 

  constructor(content: React.ReactNode) {
    super({
      title: '设置',
      buttons: [
        Dialog.okButton({
          label: '应用',
        }),
        Dialog.cancelButton(),
      ],
      width: 860,
      modal: true,
    });
    // 渲染内容
    this.renderContent(content);
  }
}

@injectable()
export class PreferenceWidget extends Widget {

  private changedValues = new Map<string, any>();

  constructor(
    @inject(CommandRegistry) private commandRegistry: CommandRegistry,
    @inject(KeybindingRegistry) private keybindingRegistry: KeybindingRegistry,
    @inject(PreferenceService) private preferenceService: PreferenceService,
    @inject(PreferenceTreeGenerator) private treeGenerator: PreferenceTreeGenerator,
  ) {
    super();
    this.id = "preference-widget";
    this.title.label = "设置";
    this.addClass("preference-widget");

    this.commandRegistry.addCommand("editor:settings", {
      label: "设置",
      iconClass: "codicon codicon-settings-gear",
      execute: async () => {
        const result = await Dialog.open(new PreferenceDialog(this.render()));
        if(result && result === 'ok'){
          for (const [key, value] of this.changedValues) {
            await this.preferenceService.set(key, value);
          }
        }else{
          this.resetChangedValues();
        }
      }
    });

    this.keybindingRegistry.registerKeybinding({
      command: "editor:settings",
      keybinding: "ctrl+,"
    });
  }

  protected handleChangedValues(changedValues: Record<string, any>): void {
    for (const [key, value] of Object.entries(changedValues)) {
      this.changedValues.set(key, value);
    }
  }

  protected resetChangedValues(): void {
    this.changedValues.clear();
  }

  private render(): React.ReactNode { 
    return createElement(PreferenceView, {
      preferenceService: this.preferenceService,
      treeGenerator: this.treeGenerator,
      onValuesChanged: (changedValues) => {
        this.handleChangedValues(changedValues);
      },
    });
  }
}