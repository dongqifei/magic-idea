import { initMiniStar, loadSinglePlugin } from "mini-star";
import _uniqBy from "lodash/uniqBy";
import { Emitter } from "../common";

import { PluginManifest } from "./plugin-types";
import { builtinPlugins } from "./builtin";

export interface PluginLoadError {
    pluginName: string;
    detail: Error;
}

export class PluginManager {
  private static STORE_KEY = "$MagicIdeaPlugins";

  private onDidUpdatePluginsEmitter = new Emitter<PluginManifest[]>();

  private onDidLoadPluginErrorEmitter = new Emitter<PluginLoadError>();

  readonly onDidUpdatePlugins = this.onDidUpdatePluginsEmitter.event;
  readonly onDidLoadPluginError = this.onDidLoadPluginErrorEmitter.event;

  /**
   * 获取已安装扩展列表
   */
  async getInstalledPlugins(): Promise<PluginManifest[]> {
    const plugins = localStorage.getItem(PluginManager.STORE_KEY);
    return plugins ? JSON.parse(plugins) : [];
  }

  /**
   * 保存已安装扩展列表
   */
  private async saveInstalledPlugins(plugins: PluginManifest[]) {
    localStorage.setItem(PluginManager.STORE_KEY, JSON.stringify(plugins));
    this.onDidUpdatePluginsEmitter.fire(plugins);
  }

  /**
   * 安装扩展
   */
  async installPlugin(manifest: PluginManifest): Promise<void> {
    const plugins = await this.getInstalledPlugins();

    const existingIndex = plugins.findIndex((p) => p.name === manifest.name);
    if (existingIndex >= 0) {
      // 更新已存在的扩展
      plugins[existingIndex] = manifest;
    } else {
      // 添加新扩展
      plugins.push(manifest);
    }

    await this.saveInstalledPlugins(plugins);

    // 加载扩展
    await loadSinglePlugin({
      name: manifest.name,
      url: manifest.url,
    });
  }

  /**
   * 卸载扩展
   */
  async uninstallPlugin(pluginName: string): Promise<void> {
    try {
      const plugins = await this.getInstalledPlugins();
      const index = plugins.findIndex((plugin) => plugin.name === pluginName);

      if (index === -1) {
        throw new Error(`插件 ${pluginName} 不存在`);
      }

      // 创建新数组而不是修改原数组（遵循不可变原则）
      const updatedPlugins = [...plugins];
      updatedPlugins.splice(index, 1);

      await this.saveInstalledPlugins(updatedPlugins);
      
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 初始化扩展管理器
   */
  async initPlugins() {
    const installedPlugins = _uniqBy(
      [...builtinPlugins, ...(await this.getInstalledPlugins())],
      "name"
    ); // 基于名称去重，确保不会重复安装扩展

    const plugins = installedPlugins.map(
      ({
        label,
        name,
        icon,
        url,
        version,
        description,
        position,
        author,
        isBuiltIn,
        requireRestart,
      }) => ({
        label,
        name,
        icon: icon, // 这里可以添加默认图标
        url: url,
        version: version,
        description: description,
        position: position,
        author: author,
        isBuiltIn: isBuiltIn,
        requireRestart: requireRestart,
      })
    );

    await this.saveInstalledPlugins(plugins);

    await initMiniStar({
      plugins,
      // removeScriptDomOnLoaded: false, // for test
      onPluginLoadError: (err: PluginLoadError) => {
        console.error("Plugin load error:", err);
        this.onDidLoadPluginErrorEmitter.fire(err);
      },
    });
  }
}

export const pluginManager = new PluginManager();