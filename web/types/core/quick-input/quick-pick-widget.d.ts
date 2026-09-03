import { Widget } from "@lumino/widgets";
import { QuickPickOptions, QuickPickItem } from "./quick-input-types";
export declare class QuickPickWidget extends Widget {
    private options;
    private resolve;
    private selected;
    private filterText;
    private activeIdx;
    private input;
    private onInputChange?;
    private isComposing;
    private inputDebounceTimer;
    private focusInputTimer;
    constructor(options: QuickPickOptions, resolve: (value: QuickPickItem | QuickPickItem[] | undefined) => void);
    private focusInput;
    private preventFocusLoss;
    private globalMouseDown;
    private render;
    private setupInputEvents;
    private scheduleInputChange;
    private clearDebounceTimer;
    private clearFocusInputTimer;
    private handleInputChange;
    private getQueryVaule;
    /**
     * 渲染 QuickPickItem 的行内按钮
     */
    private renderButtons;
    /**
     * 处理行内按钮点击事件
     */
    private handleButtonClick;
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
    private drawList;
    /**
     * 获取选中状态（兼容同步/异步、值/函数类型）
     * @param item QuickPickItem 实例
     * @returns Promise<boolean> 选中状态（异步适配所有场景）
     */
    private getPickedStatus;
    private select;
    private finishSelect;
    private keyboardHandler;
    dispose(): void;
}
