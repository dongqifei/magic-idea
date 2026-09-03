import { regDependency, regSharedModule } from 'mini-star';
import { pluginManager } from './plugin-manager';

/**
 * 初始化插件
 */
export class PluginLoader {

  async initPlugins(): Promise<void> {
    this.registerDependencies();
    this.registerModules();

    await pluginManager.initPlugins();
  }

  private registerDependencies(): void {
    regDependency('react', () => import('react'));
    regDependency('axios', () => import('axios'));
    regDependency('lodash', () => import('lodash'));
    regDependency('dayjs', () => import('dayjs'));
    regDependency('styled-components', () => import('styled-components'));
    regDependency('classnames', () => import('classnames'));
    regDependency('monaco-editor', () => import('monaco-editor'));
    regDependency('@rjsf/core', () => import('@rjsf/core'));
    regDependency('@rjsf/utils', () => import('@rjsf/utils'));
    regDependency('@rjsf/validator-ajv8', () => import('@rjsf/validator-ajv8'));
  }

  private registerModules(): void {
    regSharedModule('@capital/shared/inversify', () => import('inversify'));
    regSharedModule('@capital/shared/monaco-editor', () => import('monaco-editor'));
    regSharedModule('@capital/shared/@lumino/algorithm', () => import('@lumino/algorithm'));
    regSharedModule('@capital/shared/@lumino/collections', () => import('@lumino/collections'));
    regSharedModule('@capital/shared/@lumino/commands', () => import('@lumino/commands'));
    regSharedModule('@capital/shared/@lumino/coreutils', () => import('@lumino/coreutils'));
    regSharedModule('@capital/shared/@lumino/disposable', () => import('@lumino/disposable'));
    regSharedModule('@capital/shared/@lumino/domutils', () => import('@lumino/domutils'));
    regSharedModule('@capital/shared/@lumino/dragdrop', () => import('@lumino/dragdrop'));
    regSharedModule('@capital/shared/@lumino/keyboard', () => import('@lumino/keyboard'));
    regSharedModule('@capital/shared/@lumino/messaging', () => import('@lumino/messaging'));
    regSharedModule('@capital/shared/@lumino/signaling', () => import('@lumino/signaling'));
    regSharedModule('@capital/shared/@lumino/virtualdom', () => import('@lumino/virtualdom'));
    regSharedModule('@capital/shared/@lumino/widgets', () => import('@lumino/widgets'));

    regSharedModule('@capital/core', () => import('@MagicIdea/core'));
    regSharedModule('@capital/core/plugin', () => import('@MagicIdea/core/plugin'));
    regSharedModule('@capital/core/commands', () => import('@MagicIdea/core/commands'));
    regSharedModule('@capital/core/common', () => import('@MagicIdea/core/common'));
    regSharedModule('@capital/core/logger', () => import('@MagicIdea/core/logger'));
    regSharedModule('@capital/core/keybinding', () => import('@MagicIdea/core/keybinding'));
    regSharedModule('@capital/core/filesystem', () => import('@MagicIdea/core/filesystem'));
    regSharedModule('@capital/core/dialogs', () => import('@MagicIdea/core/dialogs'));
    regSharedModule('@capital/core/notification', () => import('@MagicIdea/core/notification'));
    regSharedModule('@capital/core/preferences', () => import('@MagicIdea/core/preferences'));
    regSharedModule('@capital/core/quick-input', () => import('@MagicIdea/core/quick-input'));
    regSharedModule('@capital/core/shell', () => import('@MagicIdea/core/shell'));
    regSharedModule('@capital/core/statusbar', () => import('@MagicIdea/core/statusbar'));
    regSharedModule('@capital/core/storage', () => import('@MagicIdea/core/storage'));
    regSharedModule('@capital/core/theme', () => import('@MagicIdea/core/theme'));
    regSharedModule('@capital/core/undo-redo', () => import('@MagicIdea/core/undo-redo'));
    regSharedModule('@capital/core/widgets', () => import('@MagicIdea/core/widgets'));
    regSharedModule('@capital/core/magic-api', () => import('@MagicIdea/core/magic-api'));
    regSharedModule('@capital/editor', () => import('@MagicIdea/editor'));
  }
}

export const pluginLoader = new PluginLoader();