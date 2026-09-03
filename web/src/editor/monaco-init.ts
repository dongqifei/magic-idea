import { Container } from "inversify";

import { SyncDescriptor } from "monaco-editor/esm/vs/platform/instantiation/common/descriptors";
import { StandaloneServices } from "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices";
import { ITextModelService } from "monaco-editor/esm/vs/editor/common/services/resolverService";
import { InstantiationService } from 'monaco-editor/esm/vs/platform/instantiation/common/instantiationService';
import { IInstantiationService, createDecorator } from 'monaco-editor/esm/vs/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'monaco-editor/esm/vs/platform/instantiation/common/serviceCollection';
import { MonacoTextModelService } from "./monaco-text-model-service";
import { ICodeEditorService } from 'monaco-editor/esm/vs/editor/browser/services/codeEditorService';
import { IContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey';
import { IThemeService } from 'monaco-editor/esm/vs/platform/theme/common/themeService';
import { MonacoEditorServiceFactory, MonacoEditorServiceFactoryType } from './monaco-editor-service';
class MonacoEditorServiceConstructor {
    /**
     * MonacoEditorService needs other Monaco services as constructor parameters, so we need to do use a factory for constructing the service. If we want the singleton instance,
     * we need to fetch it from the `StandaloneServices` class instead of injecting it.
     * @param container
     * @param contextKeyService
     * @param themeService
     */
    constructor(container: Container,
        @IContextKeyService contextKeyService: IContextKeyService,
        @IThemeService themeService: IThemeService) {

        return container.get<MonacoEditorServiceFactoryType>(MonacoEditorServiceFactory)(contextKeyService, themeService);
    };
}

class MonacoTextModelServiceConstructor {
  constructor(container: Container) {
    return container.get(MonacoTextModelService);
  }
}
export namespace MonacoInit {
  export function init(container: Container): void {
    const overrides: Record<string, SyncDescriptor<unknown>> = {
      [ICodeEditorService.toString()]: new SyncDescriptor(MonacoEditorServiceConstructor, [container]),
      [ITextModelService.toString()]: new SyncDescriptor(
        MonacoTextModelServiceConstructor,
        [container],
      ),
    };

    let isInitialized = false;
    StandaloneServices.withServices(() => {
        isInitialized = true;
    });
    const servicesInitializedBeforeOverrides = isInitialized;

    // Try the standard initialization path first.
    StandaloneServices.initialize(overrides);
    
    // If StandaloneServices was already initialized (e.g., by a premature StandaloneServices.get() call
    // triggered as a side-effect during module loading), the call above is a no-op and our overrides are
    // silently dropped.  Detect this situation, warn about it, and inject our service descriptors directly
    // into the internal service collection so that they are used when the services are next resolved.
    //
    // We only need this fallback when initialize() was a no-op.  On the normal startup path,
    // initialize() succeeds and any services that get instantiated during that call (e.g. as
    // dependencies of editor features) are created from *our* Theia descriptors — not the
    // Monaco defaults — so they are perfectly fine and must not be flagged.
    if (servicesInitializedBeforeOverrides) {
        patchServices(overrides);
    }
  }
}


// @monaco-uplift: verify that the concrete InstantiationService class still exposes a
// private `_services: ServiceCollection` property.  See monaco-init.spec.ts for a CI
// guard that will flag a mismatch after a Monaco version bump.
function patchServices(overrides: Record<string, SyncDescriptor<unknown>>): void {
    const instantiationService = StandaloneServices.get(IInstantiationService);
    if (!(instantiationService instanceof InstantiationService)) {
        console.error(
            'StandaloneServices returned an IInstantiationService that is not an instance of InstantiationService. '
            + 'Theia service overrides cannot be patched in after premature initialization. '
            + 'Investigate whether Monaco\'s internal InstantiationService class has been refactored.'
        );
        return;
    }
    const serviceCollection = instantiationService['_services'];
    if (!(serviceCollection instanceof ServiceCollection)) {
        console.error(
            'InstantiationService._services is not a ServiceCollection (got '
            + (serviceCollection === undefined ? 'undefined' : typeof serviceCollection)
            + '). Theia service overrides cannot be patched in after premature initialization. '
            + 'Investigate whether Monaco\'s InstantiationService internals have changed.'
        );
        return;
    }
    const patchedServices: string[] = [];
    const alreadyInstantiatedServices: string[] = [];
    for (const serviceId of Object.keys(overrides)) {
        const serviceIdentifier = createDecorator(serviceId);
        const existing = serviceCollection.get(serviceIdentifier);
        if (existing instanceof SyncDescriptor && existing !== overrides[serviceId]) {
            // The override was not applied by initialize() – patch it in manually.
            serviceCollection.set(serviceIdentifier, overrides[serviceId]);
            patchedServices.push(serviceId);
        } else if (existing !== undefined && !(existing instanceof SyncDescriptor)) {
            // The service was already instantiated from the default Monaco
            // implementation – we cannot override it anymore.
            alreadyInstantiatedServices.push(serviceId);
        }
    }
    if (patchedServices.length > 0) {
        console.warn(
            'StandaloneServices was already initialized before MonacoInit.init() was called. '
            + 'This typically happens when a StandaloneServices.get() call is triggered as a side-effect during module loading. '
            + 'The following Theia service overrides had to be patched in after the fact: '
            + patchedServices.join(', ')
            + '. Investigate the module loading order to prevent premature initialization.'
        );
    }
    if (alreadyInstantiatedServices.length > 0) {
        console.error(
            'StandaloneServices was already initialized and the following services were already instantiated '
            + 'before MonacoInit.init() could apply Theia overrides: '
            + alreadyInstantiatedServices.join(', ')
            + '. These services are using the default Monaco implementations instead of Theia\'s. '
            + 'This may cause unexpected behavior. Investigate which code triggers premature service resolution.'
        );
    }
}
