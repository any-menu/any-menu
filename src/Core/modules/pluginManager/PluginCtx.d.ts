import type { PluginInterface, PluginRunCtx, PluginAppCtx } from "../../../Type";
export declare namespace PluginCtx {
    function getPluginAppCtx(plugin: PluginInterface): PluginAppCtx;
    function getPluginRunCtx(): PluginRunCtx;
    const PluginInterfaceDemo: string;
}
