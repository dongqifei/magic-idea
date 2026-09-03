import { Dialog, DialogButton } from '@MagicIdea/core/dialogs';

export type InstallRemoteExtensionResult = string;

export class InstallRemoteExtensionDialog extends Dialog<InstallRemoteExtensionResult> {
  constructor(content: HTMLTextAreaElement) {
    const buttons: DialogButton<InstallRemoteExtensionResult>[] = [
      {
        label: '安装',
        className: 'magic-idea-dialog-ok',
        primary: true,
        callback: () => {
          const data = content.value;
          return data;
        }
      },
      {
        label: '取消',
        className: 'magic-idea-dialog-cancel',
        callback: () => {
          return '';
        }
      },
    ];

    super({
      title: '安装远程扩展...',
      buttons,
      width: 600,
      modal: true
    });
    this.renderContent(content);
  }

  static async openConfirm(content: HTMLTextAreaElement): Promise<InstallRemoteExtensionResult> {
    const dialog = new InstallRemoteExtensionDialog(content);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<InstallRemoteExtensionResult>(dialog);
    return result || '';
  }
}