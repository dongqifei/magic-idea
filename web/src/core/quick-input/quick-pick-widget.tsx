import { Widget } from "@lumino/widgets";
import { QuickPickOptions, QuickPickItem } from "./quick-input-types";

// 简单字符串模糊匹配
function fuzzyFilter(input: string, items: QuickPickItem[], matchDesc?: boolean, matchDetail?: boolean) {
  const query = input.toLowerCase().trim();
  return items.filter(item =>
    item.label.toLowerCase().includes(query)
    || (matchDesc && item.description && item.description.toLowerCase().includes(query))
    || (matchDetail && item.detail && item.detail.toLowerCase().includes(query))
  );
}

// 标记匹配字符串以高亮显示
function highlight(str: string, query: string) {
  if (!query) return str;
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return str;
  return (
    str.substring(0, idx) +
    `<span class="quick-input-hl">${str.substring(idx, idx + query.length)}</span>` +
    str.substring(idx + query.length)
  );
}

export class QuickPickWidget extends Widget {
  private options: QuickPickOptions;
  private resolve: (value: QuickPickItem | QuickPickItem[] | undefined) => void;
  private selected: QuickPickItem[] = [];
  private filterText: string = '';
  private activeIdx = 0;
  private input!: HTMLInputElement;
  private onInputChange?: (value: any) => Promise<QuickPickItem[]>;
  private isComposing: boolean = false; // 添加组合输入状态标志
  private inputDebounceTimer: number | null = null; // 防抖计时器
  private focusInputTimer: number | null = null;

  constructor(options: QuickPickOptions, resolve: (value: QuickPickItem | QuickPickItem[] | undefined) => void) {
    super();
    this.options = options;
    this.resolve = resolve;
    this.filterText = options.inputValue || '';
    this.onInputChange = options.onInputChange;
    this.node.classList.add('quick-pick-widget');
    this.render();
    this.focusInput();
    this.preventFocusLoss();
  }

  private focusInput() {
    if(this.focusInputTimer !== null){
      return;
    }
    const focusInputTimer = window.setTimeout(() => {
      if (this.input) this.input.focus();
    }, 0);
    this.focusInputTimer = focusInputTimer;
  }

  private preventFocusLoss() {
    // 阻止外部点击丢焦点
    document.addEventListener('mousedown', this.globalMouseDown, true);
    this.node.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.options.onDidHide?.();
        this.resolve(undefined);
      }
    });
  }

  private globalMouseDown = (e: MouseEvent) => {
    if (!this.node.contains(e.target as Node)) {
      e.preventDefault();
      this.focusInput();
    }
  };

  private async render() {
    // 清空
    this.node.innerHTML = '';
    // 输入框
    const box = document.createElement('div');
    box.className = 'quick-input-header';

    this.input = document.createElement('input');
    this.input.className = 'quick-input-filter';
    this.input.type = 'text';
    this.input.value = this.filterText;
    this.input.placeholder = this.options.placeholder || 'Filter...';

    // 设置输入法事件监听
    this.setupInputEvents();

    this.input.onkeydown = (e) => this.keyboardHandler(e);

    box.appendChild(this.input);
    this.node.appendChild(box);

    // 滚动容器
    const scrollable: HTMLDivElement = document.createElement('div');
    scrollable.className = 'scrollable-container';
    // 列表容器
    const listBox = document.createElement('div');
    listBox.className = 'quick-input-list';
    listBox.tabIndex = -1;
    scrollable.appendChild(listBox);

    this.node.appendChild(scrollable);

     // 获取当前选中项的下标
    const getActiveIndex = async () => {
      for (let i = 0; i < this.options.items.length; i++) {
        if (await this.getPickedStatus(this.options.items[i])) return i;
      }
      return 0;
    };
    this.activeIdx = await getActiveIndex();

    this.drawList();
  }

  // 设置输入法相关事件
  private setupInputEvents() {
    // 中文输入法开始
    this.input.addEventListener('compositionstart', () => {
      this.isComposing = true;
      this.clearDebounceTimer();
    });

    // 中文输入法结束
    this.input.addEventListener('compositionend', (e) => {
      this.isComposing = false;
      this.scheduleInputChange();
    });

    // 普通输入事件
    this.input.oninput = () => {
      if (this.isComposing) {
        return; // 中文输入过程中不处理
      }
      this.scheduleInputChange();
    };
  }

  // 调度输入变化处理（带防抖）
  private scheduleInputChange(): void {
    this.clearDebounceTimer();
    
    // 添加防抖，避免频繁触发
    this.inputDebounceTimer = window.setTimeout(() => {
      this.handleInputChange();
    }, 150); // 150ms 防抖延迟
  }

  // 清除防抖计时器
  private clearDebounceTimer(): void {
    if (this.inputDebounceTimer) {
      clearTimeout(this.inputDebounceTimer);
      this.inputDebounceTimer = null;
    }
  }

  // 清除输入框聚焦计时器
  private clearFocusInputTimer(): void { 
    if (this.focusInputTimer) {
      clearTimeout(this.focusInputTimer);
      this.focusInputTimer = null;
    }
  }


  // 处理输入变化的实际逻辑
  private async handleInputChange(): Promise<void> {
    this.filterText = this.input.value;
    let items = this.options.items;
    
    if (this.onInputChange) {
      items = await this.onInputChange(this);
      this.options.items = items;
    }
    
    this.input.placeholder = this.options.placeholder || 'Filter...';
    this.activeIdx = 0;
    this.drawList();
    
    if (this.selected[0]) {
      this.options.onDidChangeSelection?.(this.selected[0]);
    }
  }

  private getQueryVaule() {
    if (!this.options.prefix) return this.filterText;
    return this.filterText.slice(this.options.prefix.length).trim();
  }

  /**
   * 渲染 QuickPickItem 的行内按钮
   */
  private renderButtons(li: HTMLElement, item: QuickPickItem): void {
    if (!item.buttons || item.buttons.length === 0) return;

    const buttonsContainer = li.querySelector('.quick-input-item-buttons') as HTMLElement;
    if (!buttonsContainer) return;

    for (let i = 0; i < item.buttons.length; i++) {
      const button = item.buttons[i];
      const btn = document.createElement('span');
      btn.className = 'quick-input-item-button';

      // 设置提示文本
      if (button.tooltip) {
        btn.setAttribute('title', button.tooltip);
      }

      // 设置图标类名
      if (button.iconClass) {
        button.iconClass.split(' ').forEach((cls) => {
          if (cls.trim()) {
            btn.classList.add(cls.trim());
          }
        });
      }

      // 绑定点击事件
      btn.onclick = (e: Event) => {
        e.stopPropagation();
        this.handleButtonClick(button, item);
      };

      buttonsContainer.appendChild(btn);

      // 处理虚拟图标渲染
      if (button.icon) {
        button.icon.render(btn);
      }
    }
  }

  /**
   * 处理行内按钮点击事件
   */
  private async handleButtonClick(button: any, item: QuickPickItem): Promise<void> {
    const result = await Promise.resolve(button.callback());

    // 如果回调返回 true，关闭面板并解析当前选中项
    if (result === true) {
      this.options.onDidAccept?.(item);
      this.options.onDidHide?.();
      this.clearDebounceTimer();
      this.clearFocusInputTimer();
      document.removeEventListener('mousedown', this.globalMouseDown, true);
      this.resolve(item);
    }
  }

  /**
   * 绘制过滤后的快速选择项列表
   * 根据当前搜索条件筛选选项，并渲染到UI中
   *
   * 执行流程：
   * 1. 获取当前搜索值
   * 2. 使用模糊匹配算法过滤选项
   * 3. 生成对应的DOM元素并添加到列表容器
   * 4. 高亮显示匹配的文本片段
   * 5. 如果没有匹配结果则显示空状态提示
   * 6. 自动滚动到当前激活的选项
   */
  private async drawList() {
    const listBox = this.node.querySelector('.quick-input-list')!;
    listBox.innerHTML = '';
    const queryValue = this.getQueryVaule(); // 注意：你原有代码此处拼写错误（Vaule -> Value），建议修正
    const filtered = fuzzyFilter(
      queryValue, this.options.items,
      this.options.matchOnDescription, this.options.matchOnDetail
    );

    if (filtered.length === 0) {
      listBox.innerHTML = '<div class="quick-input-empty">没有匹配的结果</div>';
      return;
    }

    // 遍历渲染每个选项
    for (let idx = 0; idx < filtered.length; idx++) {
      const item = filtered[idx];
      const li = document.createElement('div');
      li.className = 'quick-input-item';
      if (idx === this.activeIdx) li.classList.add('active');
      li.tabIndex = 0;
      li.onclick = () => this.select(idx, filtered);
      // 先渲染基础结构（不含选中状态）
      li.innerHTML = `
        ${item.iconClass ? ` <span class="quick-icon ${item.iconClass}"></span>` : ""}
        ${item.icon ? ` <span class="quick-icon"></span>` : ""}
        <span class="label">${highlight(item.label, queryValue)}</span>
        ${item.description ? `<span class="desc">${highlight(item.description, queryValue)}</span>` : ""}
        ${item.detail ? `<span class="detail">${highlight(item.detail, queryValue)}</span>` : ""}
        <span class="picked-status-container"></span>
        <span class="quick-input-item-buttons"></span>
      `.trim();

      // 渲染行内按钮
      this.renderButtons(li, item);

      const iconContainer = li.querySelector('.quick-icon') as HTMLElement;
      if (item.icon && iconContainer) {
        item.icon.render(iconContainer);
      }
      listBox.appendChild(li);

      // 异步获取选中状态
      const isPicked = await this.getPickedStatus(item);
      const pickedContainer = li.querySelector('.picked-status-container')!;
      // 按需添加/移除样式类，实现选中状态图标展示
      if (isPicked) {
        pickedContainer.classList.add('quick-icon', 'codicon', 'codicon-check');
      } else {
        pickedContainer.classList.remove('quick-icon', 'codicon', 'codicon-check');
      }
    }

    // 滚动到可视区域
    const itemNode = listBox.children[this.activeIdx] as HTMLLIElement;
    itemNode.scrollIntoView({ block: 'nearest' });
  }

  /**
   * 获取选中状态（兼容同步/异步、值/函数类型）
   * @param item QuickPickItem 实例
   * @returns Promise<boolean> 选中状态（异步适配所有场景）
   */
  private async getPickedStatus(item: QuickPickItem): Promise<boolean> {
    const { picked } = item;

    // 情况1：picked 为 undefined（默认未选中）
    if (picked === undefined) {
      return false;
    }

    // 情况2：picked 为 boolean 原始值（直接返回）
    if (typeof picked === 'boolean') {
      return picked;
    }

    // 情况3：picked 为函数（CommandFunc），先执行函数获取结果
    let result: boolean | Promise<boolean>;
    try {
      result = picked(); // 执行函数
    } catch (error) {
      console.error('执行 picked 函数失败:', error);
      return false; // 执行失败默认未选中
    }

    // 情况3.1：函数返回值为 boolean（同步结果，直接返回）
    if (typeof result === 'boolean') {
      return result;
    }

    // 情况3.2：函数返回值为 Promise<boolean>（异步结果，等待解析）
    try {
      return await result;
    } catch (error) {
      console.error('解析 picked 异步结果失败:', error);
      return false; // 异步失败默认未选中
    }
  }

  private select(idx: number, filtered?: QuickPickItem[]) {
    const items = filtered ? filtered : fuzzyFilter(this.getQueryVaule(), this.options.items, this.options.matchOnDescription, this.options.matchOnDetail);
    const item = items[idx];
    this.selected = [item];
    this.options.onDidChangeSelection?.(item);
    if (item.execute) {
      Promise.resolve(item.execute()).then(() => this.finishSelect(item));
    } else {
      this.finishSelect(item);
    }
  }

  private finishSelect(item: QuickPickItem) {
    this.options.onDidAccept?.(item);
    this.options.onDidHide?.();
    this.clearDebounceTimer();
    this.clearFocusInputTimer();
    document.removeEventListener('mousedown', this.globalMouseDown, true);
    this.resolve(item);
  }

  // 键盘事件：上下选、回车、ESC
  private keyboardHandler(e: KeyboardEvent) {
    // 如果正在中文输入，不处理某些按键
    if (this.isComposing) {
      if (e.key === 'Enter') {
        // 中文输入时按回车是确认输入，不是选择项
        e.preventDefault();
      }
      return;
    }

    const filtered = this.options.items;
    if (e.key === 'ArrowDown') {
      this.activeIdx = Math.min(this.activeIdx + 1, filtered.length - 1);
      this.drawList();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.activeIdx = Math.max(this.activeIdx - 1, 0);
      this.drawList();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      this.select(this.activeIdx, filtered);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.options.onDidHide?.();
      this.clearDebounceTimer();
      this.clearFocusInputTimer();
      document.removeEventListener('mousedown', this.globalMouseDown, true);
      this.resolve(undefined);
      e.preventDefault();
    }
  }

  // 清理资源
  public dispose(): void {
    this.clearDebounceTimer();
    this.clearFocusInputTimer();
    document.removeEventListener('mousedown', this.globalMouseDown, true);
    super.dispose();
  }
}