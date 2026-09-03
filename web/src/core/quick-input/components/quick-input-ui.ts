import { injectable } from "inversify";
import { QuickInputUI, QuickPickOptions, QuickPickItem, InputBoxOptions } from "../quick-input-types";
import { QuickPickWidget } from "../quick-pick-widget";
import { InputBoxWidget } from "../quick-input-box-widget";
import { Widget } from "@lumino/widgets";
import "./quick-input-style.css"

// 遮罩层
function createMask(onEsc: () => void): HTMLElement {
  const mask = document.createElement('div');
  mask.classList.add('quick-input-mask');
  mask.onclick = () => {
    onEsc();
  }; // 禁止冒泡
  document.addEventListener('keydown', function escHandler(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onEsc();
      document.removeEventListener('keydown', escHandler, true);
    }
  }, true);
  return mask;
}

@injectable()
export class QuickInputUILumino implements QuickInputUI {
  private currentWidget: Widget | undefined;
  private mask: HTMLElement | undefined;
  private host: HTMLElement;

  constructor(
  ) {
    this.host = document.body;
  }

  async showQuickPick(options: QuickPickOptions): Promise<QuickPickItem | QuickPickItem[] | undefined> {
    return new Promise(resolve => {
      this.cleanup();
      this.mask = createMask(() => {
        options.onDidHide?.();
        this.hide();
        resolve(undefined);
      });
      this.host.appendChild(this.mask);

      const widget = new QuickPickWidget(options, (result) => {
        this.hide();
        resolve(result);
      });
      Object.assign(widget.node.style, {
        position: "fixed", zIndex: 10001,
        left: "50%", top: "6px", transform: "translate(-50%, 0)",
        background: "var(--magic-idea-editor-background)", borderRadius: "8px", border: '1px solid var(--magic-idea-input-border)', boxShadow: "0 2px 8px var(--magic-idea-shadow)",
        minWidth: "600px", padding: "0", outline: "none"
      });
      this.host.appendChild(widget.node);
      this.currentWidget = widget;
    });
  }

  async showInputBox(options: InputBoxOptions): Promise<string | undefined> {
    return new Promise(resolve => {
      this.cleanup();
      this.mask = createMask(() => {
        options.onDidHide?.();
        this.hide();
        resolve(undefined);
      });
      this.host.appendChild(this.mask);

      const widget = new InputBoxWidget(options, (result) => {
        this.hide();
        resolve(result);
      });
      Object.assign(widget.node.style, {
        position: "fixed", zIndex: 10001,
        left: "50%", top: "6px", transform: "translate(-50%, 0)",
        background: "var(--magic-idea-editor-background)", borderRadius: "8px", border: '1px solid var(--magic-idea-input-border)', boxShadow: "0 2px 16px var(--magic-idea-shadow)",
        minWidth: "600px", padding: "8px", outline: "none"
      });
      this.host.appendChild(widget.node);
      this.currentWidget = widget;
    });
  }

  hide(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.currentWidget && this.currentWidget.node.parentElement) {
      this.currentWidget.node.parentElement.removeChild(this.currentWidget.node);
    }
    if (this.mask && this.mask.parentElement) {
      this.mask.parentElement.removeChild(this.mask);
    }
    this.currentWidget?.dispose();
    this.currentWidget = undefined;
    this.mask = undefined;
  }
}