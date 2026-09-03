import { inject, injectable } from "inversify";
import URI from "@MagicIdea/core/common/uri";
import { FileSystemService } from "../core/filesystem/file-system-types";
import { CommandRegistry } from "@lumino/commands";
import { ApplicationShellLayout } from '../core/shell/application-shell';
import { ActivityHandle } from "../core/nav-activity/nav-activity-type";
import { KeybindingRegistry } from "../core/keybinding";
import { MagicApiTreeService } from "@MagicIdea/magic-api/magic-api-tree-types";
import { EditorManager, EditorWidget } from "@MagicIdea/editor";
import { PropertyEditorService } from "./property-service";
import PropertyContentFrom from "./property-content";
import { ReactWidget } from "../core/widgets/react-widget";
import { createElement } from "react";

import "./property-editor.css"

export class PropertyEditorWidget extends ReactWidget {

  private initialResourceUri: URI | undefined;
  private fsService: FileSystemService;
  private propertyEditorService: PropertyEditorService;

  private loadingElement: HTMLDivElement;

  constructor(initialResourceUri: URI | undefined, fsService: FileSystemService, propertyEditorService: PropertyEditorService) {
    super();
    this.id = 'property-editor-widget';
    this.title.label = '属性配置面板';
    this.fsService = fsService;
    this.propertyEditorService = propertyEditorService;
    this.initialResourceUri = initialResourceUri;

    const loading = document.createElement("div");
    loading.className = "magic-progress-container progress-ten";
    loading.style.width = "100%";
    loading.style.zIndex = "6";
    loading.style.top="0";
    loading.style.display="none";
    this.loadingElement = loading;
    this.node.appendChild(loading); 
  }

  updateResourceUri(resourceUri: URI | undefined): void {
    this.initialResourceUri = resourceUri;
    this.update();
  }
  
  protected render(): React.ReactNode {
    if(!this.initialResourceUri){
      return createElement("div", { className: "property-empty" }, "当前未选择资源文件");
    }
    return createElement(PropertyContentFrom, {
      fsService: this.fsService,
      propertyEditorService: this.propertyEditorService,
      initialResourceUri: this.initialResourceUri,
    });
  }


  hideLoading() {
    this.loadingElement.style.display = "none";
  }
  
  showLoading() {
    this.loadingElement.style.display = "block";
  }

  get resourceUri(): URI | undefined {
    return this.initialResourceUri; // 属性面板只有一个子组件，即 PropertyWidget
  }

  set resourceUri(uri: URI | undefined) {
    this.initialResourceUri = uri;
  }
}

// 属性面板管理器
@injectable()
export class PropertyManager {
  private propertyActivity: ActivityHandle;
  private propertyPanel: PropertyEditorWidget;

  constructor(
    @inject(ApplicationShellLayout) private shellLayout: ApplicationShellLayout,
    @inject(KeybindingRegistry) private keybindings: KeybindingRegistry,
    @inject(FileSystemService) private fsService: FileSystemService,
    @inject(PropertyEditorService) private propertyEditorService: PropertyEditorService,
    @inject(CommandRegistry) private commands: CommandRegistry,
    @inject(MagicApiTreeService) private magicApiTreeService: MagicApiTreeService,
    @inject(EditorManager) private editorManager: EditorManager,
  ) {
    this.propertyPanel = new PropertyEditorWidget(
      undefined,
      this.fsService,
      this.propertyEditorService,
    );
    this.propertyActivity = this.registerPropertyActivity();

    this.initCommands();
    this.listenToEditorEvents();
  }

  // 初始化全局命令（打开当前编辑器的属性面板）
  private initCommands(): void {
    this.commands.addCommand("view:property-config", {
      label: "属性配置",
      execute: () => this.propertyActivity.open(),
    });

    this.keybindings.registerKeybinding({
      command: "view:property-config",
      keybinding: "ctrl+shift+y",
    });
  }

  // 监听编辑器相关事件
  private listenToEditorEvents(): void {
    // 处理api文件夹选中事件
    // this.magicApiTreeService.onDidChangeSelection(async (e)=>{
    //   if(!e){
    //     this.propertyPanel.updateResourceUri(undefined);
    //     return;
    //   }
    //   if(e.parentId || e.id === '0'){
    //     // console.log(e)
    //     if(e.type === 'api'){
    //       // console.log('api', e)
    //     }
    //   } else {
    //     this.propertyPanel.updateResourceUri(e?.uri);
    //   }
    // })
    this.editorManager.onCurrentEditorChanged(e=>{
      this.propertyPanel.updateResourceUri(e?.getResourceUri());
    })
  }
  
  private registerPropertyActivity(): ActivityHandle {
    const activityManager = this.shellLayout.activityManager;
    return activityManager.registerActivity({
      id: 'property',
      title: '属性配置',
      iconClass: 'codicon codicon-settings',
      priority: 100,
      location: 'left-bottom',
      factory: () => {
        return this.propertyPanel;
      },
    });
  }

  dispose(): void {
    this.propertyPanel.dispose();
  }
}