import { injectable, inject } from "inversify";
import { check } from '@tauri-apps/plugin-updater';
import { getVersion, getName } from '@tauri-apps/api/app';
import { window as appWindow } from '@tauri-apps/api';
import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./common";
import { CommandRegistry } from "@lumino/commands";
import { MenuContribution, MenuModelRegistry } from './common/menu';
import { CommonMenus } from "./common-menus";
import { OS, isOSX, isWindows, EOL } from './common/os';
import { EnvVariablesServer } from './common/env-variables';
import { KeybindingRegistry } from "./keybinding/keybinding-registry";
import { UndoRedoHandlerService } from "./undo-redo/undo-redo-handler"; // 之前实现的撤销/重做服务
import { FrontendApplication } from './frontend-application';
import { FrontendApplicationContribution } from "./frontend-application-contribution";
import { CommandContribution } from "./commands";
import { KeybindingContribution } from './keybinding'
import { ApplicationShellLayout } from "./shell";
import { CommonCommands } from "./common-commands";
import { PreferenceService } from "./preferences";
import { SaveableService } from "./saveable-service";
import { FormatType, Saveable, AutoSaveMode } from './saveable';
import { CurrentWidgetCommandAdapter } from "./shell/current-widget-command-adapter";
import { SHELL_TABBAR_CONTEXT_CLOSE } from './shell/tab-bars';
import { SelectionService } from "./selection-service";
import { NotificationService } from "./notification/notification-service";
import { MagicApiServerService } from "./magic-api";
import { Dialog } from "./dialogs";

// 辅助函数：格式化字节数为友好格式
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const MAGIC_IDEA_SOURCE = 'Magic IDEA';

export const CLASSNAME_OS_MAC = 'mac';
export const CLASSNAME_OS_WINDOWS = 'windows';
export const CLASSNAME_OS_LINUX = 'linux';

@injectable()
export class CommonFrontendContribution
  implements
    FrontendApplicationContribution,
    CommandContribution,
    KeybindingContribution,
    MenuContribution
{
  static readonly AUTOSAVE_PREFERENCE: string = "files.autoSave";
  static readonly AUTOSAVE_DELAY_PREFERENCE: string = "files.autoSaveDelay";

  // 注入撤销/重做处理器服务
  @inject(UndoRedoHandlerService)
  private readonly undoRedoHandlerService: UndoRedoHandlerService;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(SaveableService)
  protected readonly saveResourceService: SaveableService;

  @inject(ApplicationShellLayout) 
  protected readonly shell: ApplicationShellLayout;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(SelectionService)
  protected readonly selectionService: SelectionService;

  @inject(NotificationService) 
  private notificationService: NotificationService;

  @inject(EnvVariablesServer)
  protected readonly environments: EnvVariablesServer;

  @inject(MagicApiServerService)
  protected readonly magicApiServerService: MagicApiServerService;

  async configure(app: FrontendApplication): Promise<void> {
    // FIXME: This request blocks valuable startup time (~200ms).
    // const configDirUri = await this.environments.getConfigDirUri();
    // console.debug('configDirUri', configDirUri);
    // this.contextKeyService.createKey<boolean>('isLinux', OS.type() === OS.Type.Linux);
    // this.contextKeyService.createKey<boolean>('isMac', OS.type() === OS.Type.OSX);
    // this.contextKeyService.createKey<boolean>('isWindows', OS.type() === OS.Type.Windows);
    // this.contextKeyService.createKey<boolean>('isWeb', !isTauri());
    this.setOsClass();
  }

  protected setOsClass(): void {
    if (isOSX) {
        document.body.classList.add(CLASSNAME_OS_MAC);
    } else if (isWindows) {
        document.body.classList.add(CLASSNAME_OS_WINDOWS);
    } else {
        document.body.classList.add(CLASSNAME_OS_LINUX);
    }
  }

  // ========================================
  // 实现 FrontendApplicationContribution：应用生命周期
  // ========================================
  onStart(): void {
    // 初始化自动保存模式
    this.preferenceService.ready.then(() => { 
      this.initializeAutoSaveMode();
      // 延迟3秒启动检查更新
      setTimeout(()=>{
        this.checkVersionUpdate(true);
      }, 3000)
    });
    // 监听配置文件修改
    this.preferenceService.onDidPreferenceChanged((e) => {
      if (e.key === CommonFrontendContribution.AUTOSAVE_PREFERENCE) {
        this.saveResourceService.autoSave =
          this.preferenceService.get(
            CommonFrontendContribution.AUTOSAVE_PREFERENCE,
          ) ?? "off";
      } else if (
        e.key === CommonFrontendContribution.AUTOSAVE_DELAY_PREFERENCE
      ) {
        this.saveResourceService.autoSaveDelay =
          this.preferenceService.get(
            CommonFrontendContribution.AUTOSAVE_DELAY_PREFERENCE,
          ) ?? 1000;
      }
    });
  }

  protected initializeAutoSaveMode(): void {
    this.saveResourceService.autoSave =
      this.preferenceService.get<AutoSaveMode>(
        CommonFrontendContribution.AUTOSAVE_PREFERENCE,
      ) ?? "off";
    this.saveResourceService.autoSaveDelay =
      this.preferenceService.get<number>(
        CommonFrontendContribution.AUTOSAVE_DELAY_PREFERENCE,
      ) ?? 1000;
  }

  protected isAutoSaveOn(): boolean {
    const autoSave = this.preferenceService.get(
      CommonFrontendContribution.AUTOSAVE_PREFERENCE,
    );
    return autoSave !== "off";
  }

  protected async toggleAutoSave(): Promise<void> {
    this.preferenceService.set(
      CommonFrontendContribution.AUTOSAVE_PREFERENCE,
      this.isAutoSaveOn() ? "off" : "afterDelay",
    );
  }

  // ========================================
  // 1. 实现 CommandContribution：注册命令
  // ========================================
  registerCommands(registry: CommandRegistry): void {
    registry.addCommand(CommonCommands.NEW_PROJECT.id, {
      label: CommonCommands.NEW_PROJECT.label,
      execute: () => {
        this.magicApiServerService.createProject();
      }
    })
    registry.addCommand(CommonCommands.OPEN_PROJECT.id, {
      label: CommonCommands.OPEN_PROJECT.label,
      execute: () => {
        this.magicApiServerService.openRecentlyProject();
      }
    })
    registry.addCommand(CommonCommands.SAVE.id, {
      label: CommonCommands.SAVE.label,
      execute: () => {
        const widget = this.shell.currentWidget;
        this.saveResourceService.save(widget, { formatType: FormatType.ON });
      }
    })
    registry.addCommand(CommonCommands.SAVE_ALL.id, {
      label: CommonCommands.SAVE_ALL.label,
      execute: () => this.shell.saveAll({ formatType: FormatType.ON })
    })

    registry.addCommand(CommonCommands.AUTO_SAVE.id, {
      isToggled: () => this.isAutoSaveOn(),
      label: CommonCommands.AUTO_SAVE.label,
      execute: () => this.toggleAutoSave(),
    });
    // 注册「撤销」命令
    registry.addCommand(CommonCommands.UNDO.id, {
      execute: () => this.undoRedoHandlerService.undo(), // 执行撤销逻辑
      label: CommonCommands.UNDO.label, // 菜单显示文本
      // 可选：动态禁用命令（无可撤销操作时灰色）
      isEnabled: () => true, // 实际项目可通过 undoRedoService.canUndo() 判断
    });
    // 注册「重做」命令
    registry.addCommand(CommonCommands.REDO.id, {
      execute: () => this.undoRedoHandlerService.redo(), // 执行重做逻辑
      label: CommonCommands.REDO.label,
      isEnabled: () => true, // 实际项目可通过 undoRedoService.canRedo() 判断
    });

    // 关闭标签页
    registry.addCommand(CommonCommands.CLOSE_TAB.id, new CurrentWidgetCommandAdapter(this.shell, {
      isEnabled: args => Boolean(args.title?.closable),
      label: CommonCommands.CLOSE_TAB.label,
      execute: (args) => args.tabBar && this.shell.closeTabs(args.tabBar, candidate => candidate === args.title),
    }));
    registry.addCommand(CommonCommands.CLOSE_OTHER_TABS.id, new CurrentWidgetCommandAdapter(this.shell, {
      label: CommonCommands.CLOSE_OTHER_TABS.label,
      isEnabled: (args) => Boolean(args.tabBar?.titles.some(candidate => candidate !== args.title && candidate.closable)),
      execute: (args) => {
        args.tabBar && this.shell.closeTabs(args.tabBar, candidate => candidate !== args.title && candidate.closable)
      }
    }));
    registry.addCommand(CommonCommands.CLOSE_SAVED_TABS.id, new CurrentWidgetCommandAdapter(this.shell, {
      label: CommonCommands.CLOSE_SAVED_TABS.label,
      isEnabled: (args) => Boolean(args.tabBar?.titles.some(candidate => candidate.closable && !Saveable.isDirty(candidate.owner))),
      execute: (args) => args.tabBar && this.shell.closeTabs(args.tabBar, candidate => candidate.closable && !Saveable.isDirty(candidate.owner)),
    }));
    registry.addCommand(CommonCommands.CLOSE_RIGHT_TABS.id, new CurrentWidgetCommandAdapter(this.shell, {
      label: CommonCommands.CLOSE_RIGHT_TABS.label,
      isEnabled: (args) => {
          let targetSeen = false;
          return Boolean(args.tabBar?.titles.some(candidate => {
              if (targetSeen && candidate.closable) { return true; };
              if (candidate === args.title) { targetSeen = true; };
          }));
      },
      isVisible: (args) => {
          const area = (args.tabBar && this.shell.getAreaFor(args.tabBar)) ?? this.shell.currentTabArea;
          return area !== undefined && area !== 'left' && area !== 'right';
      },
      execute: (args) => {
          if (args.tabBar) {
              let targetSeen = false;
              this.shell.closeTabs(args.tabBar, candidate => {
                  if (targetSeen && candidate.closable) { return true; };
                  if (candidate === args.title) { targetSeen = true; };
                  return false;
              });
          }
      }
    }));
    registry.addCommand(CommonCommands.CLOSE_ALL_TABS.id, new CurrentWidgetCommandAdapter(this.shell, {
      label: CommonCommands.CLOSE_ALL_TABS.label,
      isEnabled: (args) => Boolean(args.tabBar?.titles.some(title => title.closable)),
      execute: (args) => args.tabBar && this.shell.closeTabs(args.tabBar, candidate => candidate.closable),
    }));

    // 欢迎
    registry.addCommand("help:welcome", {
      label: "欢迎",
      caption: "欢迎",
      execute: () => {
        alert("welcome");
      },
    });

    // 帮助文档
    registry.addCommand("help:documentation", {
      label: "文档说明",
      execute: () => {
        window.open("https://magic-idea.org/docs/", "_blank");
      },
    });
    registry.addCommand("help:open_devtools", {
      label: "开发者工具",
      execute: () => {
        invoke("open_devtools");
      },
    });

    // 检测更新
    registry.addCommand("help:check-update", {
      label: "检查更新...",
      execute: async () => {
        this.checkVersionUpdate(false);
      }
    });
    // 关于
    registry.addCommand("help:about", {
      label: "关于",
      iconClass: "codicon-info",
      execute: async () => {
        const aboutDialog = new Dialog({
          title: "关于",
          width: 550,
          buttons: [
            { label: '确定', className: 'magic-idea-dialog-ok', callback: () => 'cancel' },
          ],
        })
        const messageContainer = document.createElement('div');
        messageContainer.className = 'magic-about-container';

        let version = "latest";
        let appName = MAGIC_IDEA_SOURCE;

        if(isTauri()){
          version = await getVersion();
          appName = await getName();
        }
        
        messageContainer.innerHTML = `
          <ul class="magic-list">
            <li>
              <div class="list-label">
                版本
              </div>
              <div class="list-content">
                <span>${appName}（${version}）</span>
              </div>
            </li>
            
            <li>
              <div class="list-label">
                版权
              </div>
              <div class="list-content">
                <span class="copyright">Copyright © 2026 ${MAGIC_IDEA_SOURCE}. All rights reserved.</span>
              </div>
            </li>
            
            <li>
              <div class="list-label">
                GitHub
              </div>
              <div class="list-content">
                <a href="https://github.com/dongqifei/magic-idea" 
                  class="github-link" 
                  target="_blank"
                  rel="noopener noreferrer">
                  <img src="https://img.shields.io/github/stars/dongqifei/magic-idea?style=social" 
                    alt="GitHub Stars" 
                    class="github-badge">
                </a>
                <a href="https://gitee.com/dongqifei/magic-idea"
                class="github-link" 
                target="_blank"
                rel="noopener noreferrer">
                  <img src="https://gitee.com/dongqifei/magic-idea/badge/star.svg?theme=gvp" 
                    alt="Gitee Stars" 
                    class="github-badge"></img>
                </a>
              </div>
            </li>
            
            <li>
              <div class="list-label">
                交流群
              </div>
              <div class="list-content">
                <img src="img/wxcode.png" 
                    alt="微信群二维码" 
                    class="wx-qrcode">
                <span class="wx-group-text">备注：加群，邀您加入群聊</span>
              </div>
            </li>
          </ul>
        `;

        // 如果要添加到页面中
        document.body.appendChild(messageContainer);
        aboutDialog.renderContent(messageContainer);
        Dialog.open(aboutDialog);
      },
    });
    // 退出
    registry.addCommand("editor:exit", {
      label: "退出",
      execute: () => {
        if(isTauri()){
          const tauriWindow = appWindow.getCurrentWindow();
          tauriWindow.close();
        }else{
          window.close();
        }
      },
    });

  }

  // ========================================
  // 2. 实现 KeybindingContribution：绑定快捷键
  // ========================================
  registerKeybindings(keybindings: KeybindingRegistry): void {
    // 撤销：Ctrl+Z（Windows/Linux）、Cmd+Z（Mac）
    keybindings.registerKeybinding({
      command: CommonCommands.UNDO.id,
      keybinding: "ctrl+z",
      // when: '!editorReadonly' // 仅当编辑器可编辑时生效
    });

    // 重做：Ctrl+Y（Windows/Linux）、Cmd+Shift+Z（Mac）
    keybindings.registerKeybinding({
      command: CommonCommands.REDO.id,
      keybinding: "ctrl+y",
      // when: '!editorReadonly'
    });

    keybindings.registerKeybinding({
      command: CommonCommands.SAVE.id,
      keybinding: "ctrl+s",
    });
    keybindings.registerKeybinding({
      command: CommonCommands.SAVE_ALL.id,
      keybinding: "ctrl+alt+s",
    });
  }

  // ========================================
  // 实现 MenuContribution：注册菜单
  // ========================================
  registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(CommonMenus.FILE, '文件');
    registry.registerSubmenu(CommonMenus.EDIT, '编辑');
    registry.registerSubmenu(CommonMenus.VIEW, '查看');
    registry.registerSubmenu(CommonMenus.PREFERENCES, '首选项');
    registry.registerSubmenu(CommonMenus.HELP, '帮助');

    registry.registerMenuAction(CommonMenus.FILE_NEW, {
      commandId: CommonCommands.NEW_PROJECT.id
    });
    registry.registerMenuAction(CommonMenus.FILE_OPEN, {
      commandId: CommonCommands.OPEN_PROJECT.id
    });
    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: CommonCommands.SAVE.id
    });
    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: CommonCommands.SAVE_ALL.id
    });
    registry.registerMenuAction(CommonMenus.FILE_AUTOSAVE, {
      commandId: CommonCommands.AUTO_SAVE.id
    });
    registry.registerMenuAction(CommonMenus.FILE_CLOSE, {
      commandId: "editor:exit"
    });

    registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
      commandId: CommonCommands.UNDO.id,
      order: '0'
    });
    registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
      commandId: CommonCommands.REDO.id,
      order: '1'
    });
    registry.registerMenuAction(CommonMenus.EDIT_FIND, {
      commandId: "view:search-file",
      label: "在文件中查找...",
      order: '2'
    });

    registry.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
      commandId: "editor.action.quickCommand",
      order: '1'
    });
    registry.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
      commandId: "view.open-view",
      order: '2'
    });
    registry.registerMenuAction(CommonMenus.VIEW_LEFT, {
      commandId: "view:magic-api-explorer",
      order: '3'
    });
    registry.registerMenuAction(CommonMenus.VIEW_LEFT, {
      commandId: "view:search-file",
      order: '4'
    });
    registry.registerMenuAction(CommonMenus.VIEW_LEFT, {
      commandId: "view:extensions",
      order: '5'
    });
    registry.registerMenuAction(CommonMenus.VIEW_RIGHT, {
      commandId: "view:magic-chat",
      order: '6'
    });
    registry.registerMenuAction(CommonMenus.VIEW_BOTTOM, {
      commandId: "view:run",
      order: '7'
    });
    registry.registerMenuAction(CommonMenus.VIEW_BOTTOM, {
      commandId: "view:debug",
      order: '8'
    });
    registry.registerMenuAction(CommonMenus.VIEW_BOTTOM, {
      commandId: "view:problems",
      order: '9'
    });
    registry.registerMenuAction(CommonMenus.VIEW_BOTTOM, {
      commandId: "view:logs-output",
      order: '10'
    });
    registry.registerMenuAction(CommonMenus.VIEW_BOTTOM, {
      commandId: "view:property-config",
      order: '11'
    });

    registry.registerMenuAction(CommonMenus.PREFERENCES, {
      commandId: "editor.action.quickCommand",
      order: '1'
    });
    registry.registerMenuAction(CommonMenus.PREFERENCES, {
      commandId: "editor:settings",
      order: '2'
    });
    registry.registerMenuAction(CommonMenus.PREFERENCES, {
      commandId: "editor.theme.setting",
      order: '3'
    });

    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
      commandId: CommonCommands.CLOSE_TAB.id,
      label: '关闭',
      order: '0'
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
      commandId: CommonCommands.CLOSE_OTHER_TABS.id,
      label: '关闭其它',
      order: '1'
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
      commandId: CommonCommands.CLOSE_RIGHT_TABS.id,
      order: '2'
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
      commandId: CommonCommands.CLOSE_SAVED_TABS.id,
      label: '关闭已保存',
      order: '3',
    });
    registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
      commandId: CommonCommands.CLOSE_ALL_TABS.id,
      label: '全部关闭',
      order: '4'
    });

    // 桌面应用加载检查更新
    if(isTauri()){
      registry.registerMenuAction(CommonMenus.HELP_DEVTOOLS, {
        commandId: 'help:open_devtools',
      });
      registry.registerMenuAction(CommonMenus.HELP_UPDATE, {
        commandId: 'help:check-update',
      });
    }

    registry.registerMenuAction(CommonMenus.HELP_ABOUT, {
      commandId: 'help:about',
    });
  }

  // ========================================
  // 5. 实现 ColorContribution：主题颜色（可选）
  // ========================================
  // registerColors(): void {
  //     // 如需扩展主题颜色，可在此注册（如菜单高亮色）
  // }

  /**
   * 新版本检查
   */
  private async checkVersionUpdate(auto: boolean): Promise<void>{
    if(!isTauri()){
      return;
    }
    // 检查更新
    const update = await check();
    if(!update){
      !auto && this.notificationService.info("当前已是最新版本", { source: MAGIC_IDEA_SOURCE })
      return;
    }
    console.log(
      `found update ${update.version} from ${update.date} with notes ${update.body}`
    );
    this.notificationService.warn(`发现新版本: v${update.currentVersion} -> v${update.version}`, {
      actions: [
        {
          label: "立即更新",
          type: "primary",
          callback: async() => {
            // 1. 定义全局取消状态
            let isCancelled = false;
            // 显示进度通知
            const progress = await this.notificationService.showProgress({
              message: '开始更新...',
              source: MAGIC_IDEA_SOURCE
            }, async () => {
              isCancelled = true;
            });
            try {
              let downloaded = 0;
              let contentLength = 0;
              // alternatively we could also call update.download() and update.install() separately
              await update.download((event) => {
                // 如果已取消，直接返回，不再处理任何事件
                if (isCancelled) {
                  return; // 虽然下载还在后台进行，但 UI 已停止更新
                }
                let messageText = '下载中...';
                switch (event.event) {
                  case 'Started': {
                    contentLength = event.data.contentLength || 0;
                    // 转换为友好格式
                    const sizeStr = formatBytes(contentLength);
                    messageText = `开始下载 (${sizeStr})`;
                    break;
                  }
                  case 'Progress': {
                    const chunkLength = event.data.chunkLength || 0;
                    downloaded += chunkLength;
                    if (contentLength > 0) {
                      // 有总大小，显示进度百分比
                      const percent = Math.round((downloaded / contentLength) * 100);
                      const downloadedStr = formatBytes(downloaded);
                      const totalStr = formatBytes(contentLength);
                      messageText = `下载进度: ${percent}% (${downloadedStr}/${totalStr})`;
                    } else {
                      // 无总大小，只显示已下载量
                      const downloadedStr = formatBytes(downloaded);
                      messageText = `已下载: ${downloadedStr}`;
                    }
                    break;
                  }
                  case 'Finished':
                    messageText = '下载完成，准备安装...';
                    break;
                }
                
                // 更新进度
                if (progress) {
                  progress.report({ message: messageText });
                }
              });
              // 下载结束后，检查是否被取消
              if (isCancelled) {
                // 这里可以删除已下载的临时文件（如果 Tauri 没有自动清理）
                // 注意：Tauri 通常会在应用退出时清理未完成的更新包
                return;
              }
              this.notificationService.success("是否立即安装", {
                timeout: 0,
                source: MAGIC_IDEA_SOURCE,
                actions: [
                  {
                    label: "安装",
                    type: "primary",
                    callback: async () => {
                      await update.install();
                    },
                  },
                  {
                    label: "取消",
                    type: "secondary",
                    callback: async () => {
                      await update.close();
                    },
                  },
                ],
              });
            } catch(e){
              console.log("更新失败：", e)
            } finally {
              progress.cancel();
            }
          },
        },
        {
          label: "稍后提醒",
          callback: () => {},
        },
      ],
      source: MAGIC_IDEA_SOURCE,
      timeout: 0, // 不自动关闭
    });
  }
}
