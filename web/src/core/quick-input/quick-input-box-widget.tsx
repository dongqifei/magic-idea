import { Widget } from "@lumino/widgets";
import { InputBoxOptions } from "./quick-input-types";

export class InputBoxWidget extends Widget {
  private options: InputBoxOptions;
  private resolve: (value: string | undefined) => void;
  private input!: HTMLInputElement;
  private focusInputTimer: number | null = null;

  constructor(options: InputBoxOptions, resolve: (value: string | undefined) => void) {
    super();
    this.options = options;
    this.resolve = resolve;
    this.node.classList.add('input-box-widget');
    this.render();
    this.focusInput();
    this.preventFocusLoss();
  }

  // 清理资源
  public dispose(): void {
    this.clearFocusInputTimer();
    document.removeEventListener('mousedown', this.globalMouseDown, true);
    super.dispose();
  }

  private focusInput() {
    if(this.focusInputTimer !== null){
      return;
    }
    this.focusInputTimer = window.setTimeout(() => {
      if (this.input) this.input.focus();
    }, 0);
  }

  private preventFocusLoss() {
    document.addEventListener('mousedown', this.globalMouseDown, true);
    this.node.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.options.onDidHide?.();
        this.clearFocusInputTimer();
        document.removeEventListener('mousedown', this.globalMouseDown, true);
        this.resolve(undefined);
      }
    });
  }

  // 清除输入框聚焦计时器
  private clearFocusInputTimer(): void { 
    if (this.focusInputTimer) {
      clearTimeout(this.focusInputTimer);
      this.focusInputTimer = null;
    }
  }

  private globalMouseDown = (e: MouseEvent) => {
    if (!this.node.contains(e.target as Node)) {
      e.preventDefault();
      this.focusInput();
    }
  };

  private render(): void {
    this.node.innerHTML = '';
    if(this.options.prompt) {
      const label = document.createElement('div');
      label.className = 'input-label-box';
      label.innerText = this.options.prompt ?? '';
      this.node.appendChild(label);
    }
    this.input = document.createElement('input');
    this.input.value = this.options.value ?? '';
    this.input.placeholder = this.options.placeholder ?? '';
    if (this.options.password) this.input.type = "password";
    this.input.className = 'input-box-core';
    this.input.oninput = () => {
      this.options.onDidChangeValue?.(this.input.value);
    };
    this.input.onkeydown = (e) => this.keyboardHandler(e);

    this.node.appendChild(this.input);

    // 提示：输入后按Enter确认，Esc关闭
    const labelTip = document.createElement('div');
    labelTip.className = 'input-label-box-tip';
    labelTip.innerText = this.options.labelTips || "按'Enter'键确认或按'Escape'键取消。";
    this.node.appendChild(labelTip);
  }

  private keyboardHandler(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const msg = this.options.validateInput?.(this.input.value);
      if (msg) {
        this.input.setCustomValidity(msg);
        this.input.reportValidity();
      } else {
        this.options.onDidAccept?.(this.input.value);
        this.options.onDidHide?.();
        this.clearFocusInputTimer();
        document.removeEventListener('mousedown', this.globalMouseDown, true);
        this.resolve(this.input.value);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.options.onDidHide?.();
      this.clearFocusInputTimer();
      document.removeEventListener('mousedown', this.globalMouseDown, true);
      this.resolve(undefined);
      e.preventDefault();
    }
  }
}