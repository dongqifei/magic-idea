import { ContributionProvider } from '../common/contribution-provider';
export declare const UndoRedoHandler: unique symbol;
export interface UndoRedoHandler<T> {
    priority: number;
    select(): T | undefined;
    undo(item: T): void;
    redo(item: T): void;
}
export declare class UndoRedoHandlerService {
    protected readonly contributionProvider: ContributionProvider<UndoRedoHandler<any>>;
    private readonly handlers;
    constructor(contributionProvider: ContributionProvider<UndoRedoHandler<any>>);
    undo(): void;
    redo(): void;
}
export declare class DomInputUndoRedoHandler implements UndoRedoHandler<Element> {
    priority: number;
    select(): Element | undefined;
    undo(item: Element): void;
    redo(item: Element): void;
}
