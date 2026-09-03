import { Widget, Panel } from '@lumino/widgets';
import { Signal, ISignal } from '@lumino/signaling';
import { createRoot, Root } from 'react-dom/client';

export enum DialogMode {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

export interface DialogButton<T> {
  label: string;
  className?: string;
  callback?: () => T;
  primary?: boolean;
}

export interface DialogIcon {
  // 图标类型：可以是图标类名、svg 字符串或 img 标签
  type: 'class' | 'svg' | 'img';
  // 图标内容
  content: string;
  // 可选的样式类名
  className?: string;
}

export interface DialogOptions<T> {
  title?: string;
  // 标题左侧图标
  titleIcon?: DialogIcon;
  // 是否显示关闭按钮
  showCloseButton?: boolean;
  mode?: DialogMode;
  buttons?: DialogButton<T>[];
  width?: number | string;
  height?: number | string;
  modal?: boolean;
  // 关闭按钮点击回调
  onCloseButtonClick?: () => void;
}

export type DialogResult = 'ok' | 'cancel';

export class Dialog<T = void> extends Widget {
  private static readonly DIALOG_ZINDEX = 10001;
  private static readonly BACKDROP_ZINDEX = 10000;

  private _onClose = new Signal<this, T | undefined>(this);
  get onClose(): ISignal<this, T | undefined> {
    return this._onClose;
  }

  private panel = new Panel();
  private titleBarWidget = new Widget(); // 标题栏容器（包含图标、标题、关闭按钮）
  private titleIconWidget = new Widget(); // 标题图标
  private titleWidget = new Widget(); // 标题文本
  private closeButtonWidget = new Widget(); // 关闭按钮
  private contentWidget: Widget = new Widget();
  private buttonsPanel = new Panel();
  private backdrop = new Widget();
  private result?: T;

  protected reactRoot?: Root;

  protected options: DialogOptions<T>;

  constructor(options: DialogOptions<T> = {}) {
    super();
    this.options = {
      mode: DialogMode.PRIMARY,
      width: 500,
      height: 'auto',
      modal: true,
      showCloseButton: true, // 默认显示关闭按钮
      ...options
    };

    this.initLayout();
    this.initStyle();
    this.initTitleIcon();
    this.initCloseButton();
    this.initButtons();
    this.initBackdrop();
  }

  get contentNode(): HTMLElement {
    return this.contentWidget.node;
  }

  // 获取标题文本节点
  get titleNode(): HTMLElement {
    return this.titleWidget.node;
  }

  static cancelButton(): DialogButton<DialogResult> {
    return { label: '取消', className: 'magic-idea-dialog-cancel', callback: () => 'cancel' };
  }

  static okButton(options: Partial<DialogButton<DialogResult>> = {}): DialogButton<DialogResult> {
    return { label: '确认', className: 'magic-idea-dialog-ok', primary: true, callback: () => 'ok', ...options };
  }

  private initLayout(): void {
    // 标题栏布局
    this.titleBarWidget.addClass('magic-idea-dialog-title-bar');
    
    // 标题图标
    this.titleIconWidget.addClass('magic-idea-dialog-title-icon');
    this.titleBarWidget.node.appendChild(this.titleIconWidget.node);

    // 标题文本
    this.titleWidget.addClass('magic-idea-dialog-title-text');
    this.titleWidget.node.textContent = this.options.title || '';
    this.titleBarWidget.node.appendChild(this.titleWidget.node);

    // 关闭按钮
    this.closeButtonWidget.addClass('magic-idea-dialog-close-button');
    this.titleBarWidget.node.appendChild(this.closeButtonWidget.node);

    // 内容区域
    this.contentWidget.addClass('magic-idea-dialog-content');

    // 按钮区域
    this.buttonsPanel.addClass('magic-idea-dialog-buttons');

    // 主面板
    const mainPanel = new Panel();
    mainPanel.addClass('magic-idea-dialog-main');
    mainPanel.addWidget(this.titleBarWidget);
    mainPanel.addWidget(this.contentWidget);
    mainPanel.addWidget(this.buttonsPanel);

    this.node.appendChild(mainPanel.node);
  }

  private initStyle(): void {
    this.addClass('magic-idea-dialog');
    this.node.style.position = 'fixed';
    this.node.style.top = '40%';
    this.node.style.left = '50%';
    this.node.style.transform = 'translate(-50%, -50%)';
    this.node.style.zIndex = Dialog.DIALOG_ZINDEX.toString();
    
    // 处理宽度和高度的单位
    if (typeof this.options.width === 'number') {
      this.node.style.width = `${this.options.width}px`;
    } else {
      this.node.style.width = this.options.width || '500px';
    }
    
    if (typeof this.options.height === 'number') {
      this.node.style.height = `${this.options.height}px`;
    } else {
      this.node.style.height = this.options.height || 'auto';
    }
    
    this.node.style.backgroundColor = 'var(--magic-idea-background)';
    this.node.style.border = '1px solid var(--magic-idea-border-color)';
    this.node.style.borderRadius = '4px';
    this.node.style.boxShadow = '0 2px 4px var(--magic-idea-shadow)';
    this.node.style.padding = '0'; // 移除外层padding，由内部元素控制

    // 标题栏样式
    this.titleBarWidget.node.style.display = 'flex';
    this.titleBarWidget.node.style.alignItems = 'center';
    this.titleBarWidget.node.style.padding = '8px 12px';
    // this.titleBarWidget.node.style.borderBottom = '1px solid var(--magic-idea-border-color)';
    this.titleBarWidget.node.style.gap = '8px';

    // 标题图标样式
    this.titleIconWidget.node.style.flexShrink = '0';
    this.titleIconWidget.node.style.display = 'none'; // 默认隐藏，有图标时显示

    // 标题文本样式
    this.titleWidget.node.style.flexGrow = '1';
    this.titleWidget.node.style.fontSize = '14px';
    this.titleWidget.node.style.fontWeight = '600';
    this.titleWidget.node.style.margin = '0';

    // 关闭按钮容器样式
    this.closeButtonWidget.node.style.flexShrink = '0';
    this.closeButtonWidget.node.style.display = this.options.showCloseButton ? 'flex' : 'none';
    this.closeButtonWidget.node.style.alignItems = 'center';
    this.closeButtonWidget.node.style.justifyContent = 'center';

    // 内容区域样式
    this.contentWidget.node.style.flex = '1';
    this.contentWidget.node.style.overflow = 'auto';
    this.contentWidget.node.style.minHeight = '30px';
    this.contentWidget.node.style.padding = '8px 12px';

    // 按钮区域样式
    if(this.options.buttons && this.options.buttons.length > 0){
      this.buttonsPanel.node.style.display = 'flex';
      this.buttonsPanel.node.style.justifyContent = 'flex-end';
      this.buttonsPanel.node.style.padding = '8px 12px';
      this.buttonsPanel.node.style.gap = '8px';
    }
    // this.buttonsPanel.node.style.borderTop = '1px solid var(--magic-idea-border-color)';
  }

  /**
   * 初始化标题图标
   */
  private initTitleIcon(): void {
    const { type, content, className } = this.options.titleIcon || {
      type: 'img',
      content: 'favicon.png',
    };
    let iconElement: HTMLElement;

    switch (type) {
      case 'class':
        // 使用图标类名（如 font-awesome）
        iconElement = document.createElement('span');
        iconElement.className = content;
        if (className) iconElement.classList.add(className);
        break;
      
      case 'svg':
        // 使用 SVG 字符串
        iconElement = document.createElement('div');
        iconElement.innerHTML = content;
        if (className) iconElement.classList.add(className);
        break;
      
      case 'img':
        // 使用图片
        iconElement = document.createElement('img');
        iconElement.setAttribute('src', content);
        iconElement.setAttribute('alt', 'title icon');
        if (className) iconElement.classList.add(className);
        break;
      
      default:
        return;
    }

    this.titleIconWidget.node.appendChild(iconElement);
    this.titleIconWidget.node.style.display = 'flex';
    this.titleIconWidget.node.style.alignItems = 'center';
    this.titleIconWidget.node.style.justifyContent = 'center';
  }

  /**
   * 初始化关闭按钮
   */
  private initCloseButton(): void {
    if (!this.options.showCloseButton) return;

    // 创建关闭按钮元素
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'magic-idea-dialog-close-btn codicon codicon-close action-label';
    closeButton.title = '关闭';
    // 关闭按钮样式
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'var(--magic-idea-foreground)';
    closeButton.style.transition = 'background-color 0.2s';

    // 悬停效果
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'var(--magic-idea-toolbar-hoverBackground)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    // 点击事件
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onCloseButtonClick?.();
      this.close();
    });

    this.closeButtonWidget.node.appendChild(closeButton);
  }

  private initButtons(): void {
    this.options.buttons?.forEach(button => {
      const buttonWidget = new Widget();
      buttonWidget.addClass('magic-idea-dialog-button');
      buttonWidget.addClass(button.className || '');

      const buttonNode = document.createElement('button');
      buttonNode.textContent = button.label;
      buttonNode.style.padding = '6px 12px';
      buttonNode.style.borderRadius = '4px';
      buttonNode.style.border = 'none';
      buttonNode.style.cursor = 'pointer';

      if (button.primary) {
        buttonNode.style.backgroundColor = 'var(--magic-idea-primary-color)';
        buttonNode.style.color = 'white';
      } else {
        buttonNode.style.backgroundColor = 'var(--magic-idea-button-secondary-background)';
        buttonNode.style.color = 'var(--magic-idea-button-secondary-foreground)';
      }

      // 按钮悬停效果
      buttonNode.addEventListener('mouseenter', () => {
        if (button.primary) {
          buttonNode.style.opacity = '0.9';
        } else {
          buttonNode.style.backgroundColor = 'var(--magic-idea-button-secondary-hoverBackground)';
        }
      });
      
      buttonNode.addEventListener('mouseleave', () => {
        if (button.primary) {
          buttonNode.style.opacity = '1';
        } else {
          buttonNode.style.backgroundColor = 'var(--magic-idea-button-secondary-background)';
        }
      });

      buttonNode.addEventListener('click', () => {
        this.result = button.callback?.();
        this.close();
      });

      buttonWidget.node.appendChild(buttonNode);
      this.buttonsPanel.addWidget(buttonWidget);
    });
  }

  private initBackdrop(): void {
    if (!this.options.modal) return;

    this.backdrop.addClass('magic-idea-dialog-backdrop');
    this.backdrop.node.style.position = 'fixed';
    this.backdrop.node.style.top = '0';
    this.backdrop.node.style.left = '0';
    this.backdrop.node.style.right = '0';
    this.backdrop.node.style.bottom = '0';
    this.backdrop.node.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'; // 修改为半透明黑色
    this.backdrop.node.style.zIndex = Dialog.BACKDROP_ZINDEX.toString();
    this.backdrop.node.style.backdropFilter = 'blur(2px)'; // 可选：添加背景模糊

    // 点击遮罩层关闭弹窗
    // this.backdrop.node.addEventListener('click', () => this.close());
  }

  /**
   * 更新对话框标题
   * @param title 新标题
   */
  setTitle(title: string): void {
    this.options.title = title;
    this.titleWidget.node.textContent = title;
  }

  /**
   * 更新标题图标
   * @param icon 新图标配置
   */
  setTitleIcon(icon?: DialogIcon): void {
    this.options.titleIcon = icon;
    this.titleIconWidget.node.innerHTML = '';
    this.titleIconWidget.node.style.display = 'none';
    if (icon) {
      this.initTitleIcon();
    }
  }

  open(): void {
    Widget.attach(this, document.body);
    if (this.options.modal) {
      Widget.attach(this.backdrop, document.body);
    }

    document.body.style.overflow = 'hidden';
    this.node.focus();
  }

  close(result?: T): void {
    if (this.options.modal) {
      Widget.detach(this.backdrop);
    }

    document.body.style.overflow = '';
    this._onClose.emit(result || this.result);
    Widget.detach(this);
    this.dispose();
  }

  renderContent(content: string | React.ReactNode | HTMLElement){
    if(typeof content === 'string') {
      this.contentNode.innerHTML = content;
      return;
    }

    if(content instanceof HTMLElement) {
      this.contentNode.appendChild(content);
      return;
    }

    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.contentNode);
    }
    this.reactRoot.render(content);
  }

  static async open<T>(dialog: Dialog<T>): Promise<T | undefined> {
    return new Promise((resolve) => {
      dialog.onClose.connect((_, result) => {
        resolve(result);
      });
      dialog.open();
    });
  }

  dispose(): void {
    super.dispose();
    this.backdrop.dispose();
    this.panel.dispose();
    this.titleBarWidget.dispose();
    this.titleIconWidget.dispose();
    this.closeButtonWidget.dispose();
  }
}