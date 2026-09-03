import { Disposable } from '..\..\core';
export declare class EditorDecorationStyle implements Disposable {
    readonly selector: string;
    protected decorationsStyleSheet: CSSStyleSheet;
    constructor(selector: string, styleProvider: (style: CSSStyleDeclaration) => void, decorationsStyleSheet: CSSStyleSheet);
    get className(): string;
    dispose(): void;
}
