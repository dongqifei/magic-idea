import { SplitPanel, AccordionPanel, Title, Widget } from "@lumino/widgets";

import { MagicApiResourceWidget } from "./magic-api-resource-widget";

export class MagicApiResourceTitleRenderer extends SplitPanel.Renderer implements AccordionPanel.IRenderer {

  readonly titleClassName = "lm-AccordionPanel-title";
  constructor() {
    super();
    this._uuid = ++MagicApiResourceTitleRenderer._nInstance;
  }

  createSectionTitle(data: Title<MagicApiResourceWidget>): HTMLElement {
    const handle = document.createElement('div');
    handle.setAttribute('tabindex', '0');
    handle.id = this.createTitleKey(data);
    handle.className = this.titleClassName;
    for (const aData in data.dataset) {
      handle.dataset[aData] = data.dataset[aData];
    }

    const collapser = handle.appendChild(document.createElement('span'));
    collapser.className = 'lm-AccordionPanel-titleCollapser';

    const label = handle.appendChild(document.createElement('div'));
    label.className = 'lm-AccordionPanel-titleLabel';
    label.textContent = data.label;
    label.title = data.caption || data.label;

    // 创建工具栏
    const toolbar = handle.appendChild(document.createElement('div'));
    toolbar.className = 'lm-AccordionPanel-titleToolbar';
    for (const tool of data.owner.tools || []) {
      const button = toolbar.appendChild(document.createElement('i'));
      button.className = tool.icon + " action-label";
      button.title = tool.label;
      button.onclick = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        tool.execute?.();
      };
    }
    return handle;
  }

  createTitleKey(data: Title<Widget>): string {
    let key = this._titleKeys.get(data);
    if (key === undefined) {
      key = `title-key-${this._uuid}-${this._titleID++}`;
      this._titleKeys.set(data, key);
    }
    return key;
  }

  private static _nInstance = 0;
  private readonly _uuid: number;
  private _titleID = 0;
  private _titleKeys = new WeakMap<Title<Widget>, string>();
}