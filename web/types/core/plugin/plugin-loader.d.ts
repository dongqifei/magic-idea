/**
 * 初始化插件
 */
export declare class PluginLoader {
    initPlugins(): Promise<void>;
    private registerDependencies;
    private registerModules;
}
export declare const pluginLoader: PluginLoader;
