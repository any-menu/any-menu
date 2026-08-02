var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { global_setting } from '../../shared/setting';
import { AppCtxDemo, appCtxDemo_createFunctions, PluginInterfaceDemo, PluginRunCtxDemo } from './PluginInterface';
import { z } from 'zod';
import pkg from '../../package.json';
const currentAppVersion = pkg.version;
const PluginMetadataSchema = z.object({
    id: z.string(),
    version: z.string(),
    min_app_version: z.string(),
    name: z.string().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    css: z.string().optional(),
});
const PluginSchema = z.object({
    metadata: PluginMetadataSchema,
    process: z.function().optional(),
    run: z.function(),
    onCreateItem: z.function().optional(),
    onLoad: z.function().optional(),
    onUnload: z.function().optional(),
});
export class PluginManager {
    static factory() {
        return new PluginManager();
    }
    constructor() {
        this.plugin_list = {};
        this.plugin_list2 = {};
        if (global_setting.isDebug)
            console.log('>>> PluginManager initialized');
    }
    loadPlugin(file_path, scriptContent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let blobUrl = null;
            try {
                const blob = new Blob([scriptContent], { type: 'application/javascript' });
                blobUrl = URL.createObjectURL(blob);
                const Function2 = Function;
                const dynamicImport = new Function2('url', 'return import(url)');
                const module = yield dynamicImport(blobUrl);
                let rawPlugin = module.default;
                if (!rawPlugin) {
                    throw new Error('Plugin script must export a default object, path:' + file_path);
                }
                if (typeof rawPlugin === 'function') {
                    rawPlugin = new rawPlugin();
                }
                const plugin = this.loadPlugin_validatePlugin(rawPlugin);
                const appContext = PluginManager.getPluginAppCtx(plugin);
                if (plugin.app === undefined) {
                    ;
                    plugin.app = appContext;
                }
                PluginManager.injectPluginCss(plugin);
                this.plugin_list[plugin.metadata.id] = plugin;
                const _b = plugin.metadata, { icon, css } = _b, rest = __rest(_b, ["icon", "css"]);
                this.plugin_list2[file_path] = rest;
                (_a = plugin.onLoad) === null || _a === void 0 ? void 0 : _a.call(plugin, appContext);
                return plugin;
            }
            catch (error) {
                throw new Error('Plugin load error, path:' + file_path, { cause: error });
            }
            finally {
                if (blobUrl) {
                    URL.revokeObjectURL(blobUrl);
                }
            }
        });
    }
    loadPlugin_validatePlugin(rawPlugin) {
        var _a;
        const result = PluginSchema.safeParse(rawPlugin);
        if (!result.success) {
            const errorMsg = result.error.issues
                .map((e) => `字段 '${e.path.join('.')}' ${e.message}`)
                .join('; ');
            throw new Error(`Plugin validate error: #${(_a = rawPlugin === null || rawPlugin === void 0 ? void 0 : rawPlugin.metadata) === null || _a === void 0 ? void 0 : _a.id} ${errorMsg}`);
        }
        const isCompatible = PluginManager.loadPlugin_isVersionCompatible(rawPlugin.metadata.min_app_version, currentAppVersion);
        if (!isCompatible) {
            throw new Error(`Plugin "${rawPlugin.metadata.name || rawPlugin.metadata.id}" requires app version ${rawPlugin.metadata.min_app_version} or higher. Current version: ${currentAppVersion}`);
        }
        return rawPlugin;
    }
    static loadPlugin_isVersionCompatible(minVersion, currentVersion) {
        const minParts = minVersion.split('.').map(Number);
        const currParts = currentVersion.split('.').map(Number);
        const maxLength = Math.max(minParts.length, currParts.length);
        for (let i = 0; i < maxLength; i++) {
            const min = minParts[i] || 0;
            const curr = currParts[i] || 0;
            if (curr > min)
                return true;
            if (curr < min)
                return false;
        }
        return true;
    }
    static getPluginAppCtx(plugin) {
        var _a;
        const label = (_a = plugin.metadata.name) !== null && _a !== void 0 ? _a : plugin.metadata.id;
        return {
            env: Object.assign(Object.assign({}, AppCtxDemo.env), { pluginName: label, pluginId: plugin.metadata.id }),
            api: Object.assign(Object.assign({}, AppCtxDemo.api), appCtxDemo_createFunctions(label, plugin.metadata.id))
        };
    }
    static getPluginRunCtx(_label) {
        return Object.assign(Object.assign({}, PluginRunCtxDemo), { env: {
                selectedText: global_setting.state.selectedText,
                activeAppName: global_setting.state.activeAppName,
                activeDocTitle: global_setting.state.activeDocTitle,
                activeDocUrl: global_setting.state.activeDocUrl,
            } });
    }
    cachePluginMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = global_setting.config.cache_paths + 'cache_plugin_meta.json';
            let old_obj = {};
            try {
                const content = yield global_setting.api.readFile(path);
                if (content)
                    old_obj = JSON.parse(content);
            }
            catch (_a) { }
            global_setting.api.writeFile(global_setting.config.cache_paths + 'cache_plugin_meta.json', JSON.stringify(Object.assign(Object.assign({}, old_obj), this.plugin_list2)));
        });
    }
    static injectPluginCss(plugin) {
        const css = plugin.metadata.css;
        if (!css)
            return;
        const pluginId = plugin.metadata.id;
        PluginManager.removePluginCss(pluginId);
        {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(css);
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
            PluginManager.pluginSheets.set(pluginId, sheet);
        }
        if (global_setting.isDebug)
            console.log(`Plugin CSS injected: ${pluginId}`);
    }
    static removePluginCss(pluginId) {
        {
            const sheet = PluginManager.pluginSheets.get(pluginId);
            if (sheet) {
                document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sheet);
                PluginManager.pluginSheets.delete(pluginId);
            }
        }
    }
    static demo() {
        return __awaiter(this, void 0, void 0, function* () {
            const loader = new PluginManager();
            const plugin = yield loader.loadPlugin('PluginInterfaceDemo', PluginInterfaceDemo);
            plugin.run(PluginManager.getPluginRunCtx('plugin demo'));
            if (plugin.onUnload)
                plugin.onUnload();
        });
    }
}
PluginManager.pluginSheets = new Map();
export const PLUGIN_MANAGER = PluginManager.factory();
