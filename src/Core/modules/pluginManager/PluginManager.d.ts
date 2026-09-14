import type { MetadataCache, PluginInterface } from '../../../Type';
export declare class PluginManager {
    plugin_list: Record<string, PluginInterface>;
    plugin_list2: Record<string, MetadataCache>;
    static factory(): PluginManager;
    private constructor();
    loadPlugin(file_path: string, scriptContent: string): Promise<PluginInterface>;
    private loadPlugin_validatePlugin;
    static loadPlugin_isVersionCompatible(minVersion: string, currentVersion: string): boolean;
    cachePluginMeta(): Promise<void>;
    private static pluginSheets;
    private static injectPluginCss;
    private static removePluginCss;
    static demo(): Promise<void>;
}
export declare const PLUGIN_MANAGER: PluginManager;
