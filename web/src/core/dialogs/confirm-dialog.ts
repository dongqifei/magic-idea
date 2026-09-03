import { Dialog, DialogButton } from './dialog';

export type ConfirmResult = true | false;

export class ConfirmDialog extends Dialog<ConfirmResult> {

  constructor(content: string | React.ReactNode | HTMLElement) {
    const buttons: DialogButton<ConfirmResult>[] = [
      {
        label: '确定',
        className: 'magic-idea-dialog-ok',
        primary: true,
        callback: () => {
          return true;
        }
      },
      {
        label: '取消',
        className: 'magic-idea-dialog-cancel',
        callback: () => {
          return false;
        }
      },
    ];

    super({
      title: '系统提示',
      buttons,
      width: 400,
      modal: true
    });

    this.renderContent(content);
  }

  static async openConfirm(content: string | React.ReactNode | HTMLElement): Promise<ConfirmResult> {
    const dialog = new ConfirmDialog(content);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<ConfirmResult>(dialog);
    return result || false;
  }
}