/**
 * 文件标签提供者
 */
import { injectable, inject, named } from "inversify";
import { IEvent as Event, Emitter } from "./common";
import URI from "./common/uri"
import { ContributionProvider } from "./common/contribution-provider";
import { Prioritizeable } from "./common/prioritizeable";
import { fileIcons } from './filesystem/file-icons';
import { FrontendApplicationContribution } from "./frontend-application-contribution";

/**
 * @internal don't export it, use `LabelProvider.folderIcon` instead.
 */
const DEFAULT_FOLDER_ICON = `codicon codicon-folder default-folder-icon`;
/**
 * @internal don't export it, use `LabelProvider.fileIcon` instead.
 */
const DEFAULT_FILE_ICON = `codicon codicon-file-code default-file-icon`;

export const LabelProviderContribution = Symbol("LabelProviderContribution");

/**
 * A {@link LabelProviderContribution} determines how specific elements/nodes are displayed in the workbench.
 * MagicIDEA views use a common {@link LabelProvider} to determine the label and/or an icon for elements shown in the UI. This includes elements in lists
 * and trees, but also view specific locations like headers. The common {@link LabelProvider} collects all {@links LabelProviderContribution} and delegates
 * to the contribution with the highest priority. This is determined via calling the {@link LabelProviderContribution.canHandle} function, so contributions
 * define which elements they are responsible for.
 * As arbitrary views can consume LabelProviderContributions, they must be generic for the covered element type, not view specific. Label providers and
 * contributions can be used for arbitrary element and node types, e.g. for markers or domain-specific elements.
 */
export interface LabelProviderContribution {
  /**
   * Determines whether this contribution can handle the given element and with what priority.
   * All contributions are ordered by the returned number if greater than zero. The highest number wins.
   * If two or more contributions return the same positive number one of those will be used. It is undefined which one.
   */
  canHandle(element: object): number;

  /**
   * returns an icon color for the given element.
   */
  getIconColor?(element: object): string | undefined;

  /**
   * returns an icon class for the given element.
   */
  getIcon?(element: object): string | undefined;

  /**
   * returns a short name for the given element.
   */
  getName?(element: object): string | undefined;

  /**
   * returns a long name for the given element.
   */
  getLongName?(element: object): string | undefined;

  /**
   * A compromise between {@link getName} and {@link getLongName}. Can be used to supplement getName in contexts that allow both a primary display field and extra detail.
   */
  getDetails?(element: object): string | undefined;

  /**
   * Emit when something has changed that may result in this label provider returning a different
   * value for one or more properties (name, icon etc).
   */
  readonly onDidChange?: Event<DidChangeLabelEvent>;

  /**
   * Checks whether the given element is affected by the given change event.
   * Contributions delegating to the label provider can use this hook
   * to perform a recursive check.
   */
  affects?(element: object, event: DidChangeLabelEvent): boolean;
}

export interface DidChangeLabelEvent {
  affects(element: object): boolean;
}

export interface URIIconReference {
  kind: "uriIconReference";
  id: "file" | "folder";
  uri?: URI;
}

export namespace URIIconReference {
  export function is(element: any): element is URIIconReference {
    return (
      typeof element === "object" &&
      element !== null &&
      element.kind === "uriIconReference"
    );
  }
  export function create(
    id: URIIconReference["id"],
    uri?: URI
  ): URIIconReference {
    return { kind: "uriIconReference", id, uri };
  }
}

@injectable()
export class DefaultUriLabelProviderContribution
  implements LabelProviderContribution
{

  canHandle(element: object): number {
    if (element instanceof URI || URIIconReference.is(element)) {
      return 1;
    }
    return 0;
  }
  
  // magic-api:/api/1.0.0/api.json or magic-api:/function/1.0.0/function.json or magic-api:/task/1.0.0/task.json
  getName(element: URI | URIIconReference): string | undefined {
    const uri = this.getUri(element);
    return uri && uri.fileName;
  }

  getIcon(element: URI | URIIconReference): string {
    if (URIIconReference.is(element) && element.id === "folder") {
      return this.defaultFolderIcon;
    }
    const uri = URIIconReference.is(element) ? element.uri : element;
    if (uri) {
      const iconClass = uri && this.getFileIcon(uri);
      return iconClass || this.defaultFileIcon;
    }
    return "";
  }

  getLongName(uri: URI): string {
    return uri.path.toString();
  }

  get defaultFolderIcon(): string {
    return DEFAULT_FOLDER_ICON;
  }

  get defaultFileIcon(): string {
    return DEFAULT_FILE_ICON;
  }

  protected getUri(element: URI | URIIconReference): URI | undefined {
    return URIIconReference.is(element) ? element.uri : element;
  }

  protected getFileIcon(uri: URI): string | undefined {
    const fileIcon = fileIcons.getClassWithColor(uri.fileName);
    if (fileIcon) {
      return fileIcon;
    }
    // return fileIcon + " file-icons-js";
    return undefined;
  }
}

@injectable()
export class LabelProvider implements FrontendApplicationContribution {
  protected readonly onDidChangeEmitter = new Emitter<DidChangeLabelEvent>();

  @inject(ContributionProvider)
  @named(LabelProviderContribution)
  protected readonly contributionProvider: ContributionProvider<LabelProviderContribution>;

  /**
   * Start listening to contributions.
   *
   * Don't call this method directly!
   * It's called by the frontend application during initialization.
   */
  initialize(): void {
    const contributions = this.contributionProvider.getContributions();
    for (const eventContribution of contributions) {
      if (eventContribution.onDidChange) {
        eventContribution.onDidChange((event) => {
          this.onDidChangeEmitter.fire({
            // TODO check eventContribution.canHandle as well
            affects: (element) => this.affects(element, event),
          });
        });
      }
    }
  }

  protected affects(element: object, event: DidChangeLabelEvent): boolean {
    if (event.affects(element)) {
      return true;
    }
    for (const contribution of this.findContribution(element)) {
      if (contribution.affects && contribution.affects(element, event)) {
        return true;
      }
    }
    return false;
  }

  get onDidChange(): Event<DidChangeLabelEvent> {
    return this.onDidChangeEmitter.event;
  }

  /**
   * Return a default file icon for the current icon theme.
   */
  get fileIcon(): string {
    return this.getIcon(URIIconReference.create("file"));
  }

  /**
   * Return a default folder icon for the current icon theme.
   */
  get folderIcon(): string {
    return this.getIcon(URIIconReference.create("folder"));
  }

  /**
   * Get the icon color from the list of available {@link LabelProviderContribution} for the given element.
   * @return the icon color
   */
  getIconColor(element: object): string {
    return this.handleRequest(element, "getIconColor") ?? "";
  }
  
  /**
   * Get the icon class from the list of available {@link LabelProviderContribution} for the given element.
   * @return the icon class
   */
  getIcon(element: object): string {
    return this.handleRequest(element, "getIcon") ?? "";
  }

  /**
   * Get a short name from the list of available {@link LabelProviderContribution} for the given element.
   * @return the short name
   */
  getName(element: object): string {
    return this.handleRequest(element, "getName") ?? "<unknown>";
  }

  /**
   * Get a long name from the list of available {@link LabelProviderContribution} for the given element.
   * @return the long name
   */
  getLongName(element: object): string {
    return this.handleRequest(element, "getLongName") ?? "";
  }

  /**
   * Get details from the list of available {@link LabelProviderContribution} for the given element.
   * @return the details
   * Can be used to supplement {@link getName} in contexts that allow both a primary display field and extra detail.
   */
  getDetails(element: object): string {
    return this.handleRequest(element, "getDetails") ?? "";
  }

  protected handleRequest(
    element: object,
    method: keyof Omit<
      LabelProviderContribution,
      "canHandle" | "onDidChange" | "affects"
    >
  ): string | undefined {
    for (const contribution of this.findContribution(element, method)) {
      const value = contribution[method]?.(element);
      if (value !== undefined) {
        return value;
      }
    }
  }

  protected findContribution(
    element: object,
    method?: keyof Omit<
      LabelProviderContribution,
      "canHandle" | "onDidChange" | "affects"
    >
  ): LabelProviderContribution[] {
    const candidates = method
      ? this.contributionProvider
          .getContributions()
          .filter((candidate) => candidate[method])
      : this.contributionProvider.getContributions();
    return Prioritizeable.prioritizeAllSync(candidates, (contrib) =>
      contrib.canHandle(element)
    ).map((entry) => entry.value);
  }
}
