import { inject, injectable, named } from "inversify";
import { ContributionProvider } from '../common/contribution-provider';

export const UndoRedoHandler = Symbol("UndoRedoHandler");

export interface UndoRedoHandler<T> {
  priority: number;
  select(): T | undefined;
  undo(item: T): void;
  redo(item: T): void;
}

@injectable()
export class UndoRedoHandlerService {
  private readonly handlers: UndoRedoHandler<any>[] = [];

  constructor(
    @inject(ContributionProvider)
    @named(UndoRedoHandler)
    protected readonly contributionProvider: ContributionProvider<UndoRedoHandler<any>>
  ) {
    if(this.contributionProvider.getContributions().length === 0) return; 
    this.handlers = this.contributionProvider.getContributions().sort((a, b) => b.priority - a.priority);
  }

  undo(): void {
    for (const handler of this.handlers) {
      const selection = handler.select();
      if (selection) {
        handler.undo(selection);
        return;
      }
    }
  }

  redo(): void {
    for (const handler of this.handlers) {
      const selection = handler.select();
      if (selection) {
        handler.redo(selection);
        return;
      }
    }
  }
}

@injectable()
export class DomInputUndoRedoHandler implements UndoRedoHandler<Element> {
  priority = 100;

  select(): Element | undefined {
    const element = document.activeElement;
    if (
      element &&
      ["input", "textarea"].includes(element.tagName.toLowerCase())
    ) {
      return element;
    }
    return undefined;
  }

  undo(item: Element): void {
    document.execCommand("undo");
  }

  redo(item: Element): void {
    document.execCommand("redo");
  }
}