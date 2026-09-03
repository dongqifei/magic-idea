import { PluginManifest } from '@MagicIdea/core/plugin';

export interface Extension extends PluginManifest {
  isInstalled: boolean;
}
