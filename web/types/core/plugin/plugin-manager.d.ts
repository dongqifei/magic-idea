import { PluginManifest } from "./plugin-types";
export interface PluginLoadError {
    pluginName: string;
    detail: Error;
}
export declare class PluginManager {
    private static STORE_KEY;
    private onDidUpdatePluginsEmitter;
    private onDidLoadPluginErrorEmitter;
    readonly onDidUpdatePlugins: import("vscode-jsonrpc/lib/common/events").Event<PluginManifest[]>;
    readonly onDidLoadPluginError: import("vscode-jsonrpc/lib/common/events").Event<PluginLoadError>;
    /**
     * 获取已安装扩展列表
     */
    getInstalledPlugins(): Promise<PluginManifest[]>;
    /**
     * 保存已安装扩展列表
     */
    private saveInstalledPlugins;
    /**
     * 安装扩展
     */
    installPlugin(manifest: PluginManifest): Promise<void>;
    /**
     * 卸载扩展
     */
    uninstallPlugin(pluginName: string): Promise<void>;
    /**
     * 初始化扩展管理器
     */
    initPlugins(): Promise<void>;
}
export declare const pluginManager: PluginManager;
