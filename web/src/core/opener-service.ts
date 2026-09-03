import { injectable, inject, named } from "inversify";
import URI from "./common/uri";
import { Disposable, MaybePromise, ContributionProvider, IEvent as Event, Emitter } from "./common";
import { Prioritizeable } from "./common/prioritizeable";
import { PreferenceService } from './preferences/preference-service';

export interface OpenerOptions {
}

export const OpenHandler = Symbol("OpenHandler");

export interface OpenHandler {
  /**
   * A unique id of this handler.
   */
  readonly id: string;
  /**
   * A human-readable name of this handler.
   */
  readonly label?: string;
  /**
   * A css icon class of this handler.
   */
  readonly iconClass?: string;

  /**
   * 判断是否能打开指定 URI
   */
  canHandle(uri: URI, options?: OpenerOptions): MaybePromise<number>;

  /**
   * 打开 URI
   */
  open(uri: URI, options?: OpenerOptions): Promise<object | undefined>;
}

export interface OpenerService {
  getOpeners(uri: URI, options?: OpenerOptions): Promise<OpenHandler[]>;
  getOpener(uri: URI, options?: OpenerOptions): Promise<OpenHandler>;
  addHandler(openHandler: OpenHandler): Disposable;
  removeHandler(openHandler: OpenHandler): void;
  /**
   * Event that fires when a new opener is added or removed.
   */
  onDidChangeOpeners?: Event<void>;
}

export const OpenerService = Symbol("OpenerService");

@injectable()
export class DefaultOpenerService implements OpenerService {

  // Collection of open-handlers for custom-editor contributions.
  protected readonly customEditorOpenHandlers: OpenHandler[] = [];

  protected readonly onDidChangeOpenersEmitter = new Emitter<void>();
  readonly onDidChangeOpeners = this.onDidChangeOpenersEmitter.event;

  constructor(
     @inject(ContributionProvider) @named(OpenHandler)
     protected readonly handlersProvider: ContributionProvider<OpenHandler>
  ) {
  }

  async getOpeners(uri: URI, options?: OpenerOptions): Promise<OpenHandler[]> {
    return uri ? this.prioritize(uri, options) : this.getHandlers();
  }

  async getOpener(uri: URI, options?: OpenerOptions): Promise<OpenHandler> {
    const handlers = await this.prioritize(uri, options);
    if (handlers.length >= 1) {
        return handlers[0];
    }
    return Promise.reject(new Error(`There is no opener for ${uri}.`));
  }

  addHandler(openHandler: OpenHandler): Disposable {
    this.customEditorOpenHandlers.push(openHandler);
    this.onDidChangeOpenersEmitter.fire();
    return Disposable.create(() => this.removeHandler(openHandler));
  }

  removeHandler(openHandler: OpenHandler): void {
    const index = this.customEditorOpenHandlers.indexOf(openHandler);
    if (index !== -1) {
      this.customEditorOpenHandlers.splice(index, 1);
      this.onDidChangeOpenersEmitter.fire();
    }
  }

  protected async prioritize(uri: URI, options?: OpenerOptions): Promise<OpenHandler[]> {
    const prioritized = await Prioritizeable.prioritizeAll(this.getHandlers(), async handler => {
      try {
          return await handler.canHandle(uri, options);
      } catch {
          return 0;
      }
    });
    return prioritized.map(p => p.value);
  }

  protected getHandlers(): OpenHandler[] {
    return [
        ...this.handlersProvider.getContributions(),
        ...this.customEditorOpenHandlers
    ];
  }
}

/**
 * 打开文件
 * @param openerService 
 * @param uri 
 * @param options 
 * @returns 
 */
export async function open(openerService: OpenerService, uri: URI, options?: OpenerOptions): Promise<object | undefined> {
    const opener = await openerService.getOpener(uri, options);
    return opener.open(uri, options);
}

export const defaultHandlerPriority = 100_000;

export function getDefaultHandler(uri: URI, preferenceService: PreferenceService): string | undefined {
  const associations = preferenceService.get('workbench.editorAssociations', {}) as { [key: string]: string };
  const defaultHandler = Object.entries(associations).find(([key]) => match(key, uri.path.base))?.[1];
  if (typeof defaultHandler === 'string') {
      return defaultHandler;
  }
  return 'default';
}

function match(pattern: string, path: string): boolean {
  const regexp = new RegExp(pattern.replace(/\*/g, '.*'));
  return regexp.test(path);
}