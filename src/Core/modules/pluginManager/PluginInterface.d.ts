import type { PluginAppCtx, PluginRunCtx } from "../../../Type";
export declare const AppCtxDemo: PluginAppCtx;
export declare function appCtxDemo_createFunctions(id: string, name: string): {
    getRunCtx: () => PluginRunCtx;
    notify: (message: string) => Promise<void>;
    readFile(path?: {
        relPath: string;
        basePath?: "CACHE" | "NOTE" | "DICT";
    }): Promise<string | null>;
    writeFile(content: string, path?: {
        relPath: string;
        basePath?: "CACHE" | "NOTE" | "DICT";
    }, is_append?: boolean): Promise<boolean>;
};
export declare const PluginRunCtxDemo: PluginRunCtx;
export declare const PluginInterfaceDemo: string;
