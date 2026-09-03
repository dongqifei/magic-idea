import { injectable } from "inversify";
import URI from "../common/uri";

@injectable()
export class UndoRedoService {
  private readonly editStacks = new Map<string, ResourceEditStack>();

  pushElement(
    resource: URI,
    undo: () => Promise<void>,
    redo: () => Promise<void>
  ): void {
    let editStack: ResourceEditStack;
    if (this.editStacks.has(resource.toString())) {
      editStack = this.editStacks.get(resource.toString())!;
    } else {
      editStack = new ResourceEditStack();
      this.editStacks.set(resource.toString(), editStack);
    }

    editStack.pushElement({ undo, redo });
  }

  removeElements(resource: URI): void {
    if (this.editStacks.has(resource.toString())) {
      this.editStacks.delete(resource.toString());
    }
  }

  undo(resource: URI): void {
    if (!this.editStacks.has(resource.toString())) {
      return;
    }
    const editStack = this.editStacks.get(resource.toString())!;
    const element = editStack.getClosestPastElement();
    if (!element) {
      return;
    }

    editStack.moveBackward(element);
    element.undo();
  }

  redo(resource: URI): void {
    if (!this.editStacks.has(resource.toString())) {
      return;
    }

    const editStack = this.editStacks.get(resource.toString())!;
    const element = editStack.getClosestFutureElement();
    if (!element) {
      return;
    }

    editStack.moveForward(element);
    element.redo();
  }
}

interface StackElement {
  undo(): Promise<void> | void;
  redo(): Promise<void> | void;
}

export class ResourceEditStack {
  private past: StackElement[];
  private future: StackElement[];

  constructor() {
    this.past = [];
    this.future = [];
  }

  pushElement(element: StackElement): void {
    this.future = [];
    this.past.push(element);
  }

  getClosestPastElement(): StackElement | undefined {
    if (this.past.length === 0) {
      return undefined;
    }
    return this.past[this.past.length - 1];
  }

  getClosestFutureElement(): StackElement | undefined {
    if (this.future.length === 0) {
      return undefined;
    }
    return this.future[this.future.length - 1];
  }

  moveBackward(element: StackElement): void {
    this.past.pop();
    this.future.push(element);
  }

  moveForward(element: StackElement): void {
    this.future.pop();
    this.past.push(element);
  }
}
