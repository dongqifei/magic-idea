import { interfaces } from "inversify";
import { ContributionFilterRegistry } from "./contribution-filter";

export const ContributionProvider = Symbol("ContributionProvider");

export interface ContributionProvider<T extends object> {
  /**
   * @param recursive `true` if the contributions should be collected from the parent containers as well. Otherwise, `false`. It is `false` by default.
   */
  getContributions(recursive?: boolean): T[];
}

class ContainerBasedContributionProvider<T extends object>
  implements ContributionProvider<T>
{
  protected services: T[] | undefined;

  constructor(
    protected readonly serviceIdentifier: interfaces.ServiceIdentifier<T>,
    protected readonly container: interfaces.Container
  ) {}

  getContributions(recursive?: boolean): T[] {
    if (this.services === undefined) {
      const currentServices: T[] = [];
      let filterRegistry: ContributionFilterRegistry | undefined;
      let currentContainer: interfaces.Container | null = this.container;
      // eslint-disable-next-line no-null/no-null
      while (currentContainer !== null) {
        if (currentContainer.isBound(this.serviceIdentifier)) {
          try {
            currentServices.push(
              ...currentContainer.getAll(this.serviceIdentifier)
            );
          } catch (error) {
            console.error(error);
          }
        }
        if (
          filterRegistry === undefined &&
          currentContainer.isBound(ContributionFilterRegistry)
        ) {
          filterRegistry = currentContainer.get(ContributionFilterRegistry);
        }
        // eslint-disable-next-line no-null/no-null
        currentContainer = recursive === true ? currentContainer.parent : null;
      }

      this.services = filterRegistry
        ? filterRegistry.applyFilters(currentServices, this.serviceIdentifier)
        : currentServices;
    }
    return this.services;
  }
}

export type Bindable = interfaces.Bind | interfaces.Container;
export namespace Bindable {
  export function isContainer(arg: Bindable): arg is interfaces.Container {
    return (
      typeof arg !== "function" &&
      // In InversifyJS `4.14.0` containers no longer have a property `guid`.
      ("guid" in arg || "parent" in arg)
    );
  }
}

export function bindContributionProvider(bindable: Bindable, id: symbol): void {
  const bindingToSyntax = Bindable.isContainer(bindable)
    ? bindable.bind(ContributionProvider)
    : bindable(ContributionProvider);
  bindingToSyntax
    .toDynamicValue(
      (ctx) => new ContainerBasedContributionProvider(id, ctx.container)
    )
    .inSingletonScope()
    .whenTargetNamed(id);
}


/**
 * Binds a {@link ContributionProvider} for the given service identifier, resolving contributions
 * from the **root** (top-level) Inversify container.
 *
 * **This is the recommended default** for binding contribution providers in module-level `ContainerModule`
 * definitions. It walks up from whichever container first resolves the provider to the root container,
 * ensuring the provider does not permanently retain a reference to a short-lived child container.
 *
 * Use this function when contributions are registered at the application level (the common case for
 * `FrontendApplicationContribution`, `CommandContribution`, `MenuContribution`, `KeybindingContribution`,
 * and similar top-level contribution points).
 *
 * If you need contributions that are scoped to a child container (e.g. connection-scoped), use {@link bindContributionProvider} instead.
 *
 * See {@link https://github.com/eclipse-theia/theia/issues/10877#issuecomment-1107000223}
 *
 * @param bindable - A `Container` or `Bind` function to register the provider in.
 * @param id - The service identifier symbol whose contributions the provider collects.
 */
export function bindRootContributionProvider(bindable: Bindable, id: symbol): void {
    const bindingToSyntax = (Bindable.isContainer(bindable) ? bindable.bind(ContributionProvider) : bindable(ContributionProvider));
    bindingToSyntax
        .toDynamicValue(ctx => {
            let container = ctx.container;
            while (container.parent) {
                container = container.parent;
            }
            return new ContainerBasedContributionProvider(id, container);
        })
        .inSingletonScope().whenTargetNamed(id);
}

/**
 * Helper function to bind a service to a list of contributions easily.
 * @param bindable a Container or the bind function directly.
 * @param service an already bound service to refer the contributions to.
 * @param contributions array of contribution identifiers to bind the service to.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindContribution(
  bindable: Bindable,
  service: interfaces.ServiceIdentifier<any>,
  contributions: interfaces.ServiceIdentifier<any>[]
): void {
  const bind: interfaces.Bind = Bindable.isContainer(bindable)
    ? bindable.bind.bind(bindable)
    : bindable;
  for (const contribution of contributions) {
    bind(contribution).toService(service);
  }
}
