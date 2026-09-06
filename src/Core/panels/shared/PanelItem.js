var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PLUGIN_MANAGER, PluginManager } from "../../modules/pluginManager/PluginManager";
import { global_setting } from "../../shared/setting";
import { textToIcon } from "./utils";
const lucideIconCache = new Map();
let initLucideCachePromise = null;
function ensureLucideCacheReady(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!initLucideCachePromise) {
            initLucideCachePromise = init_lucideIconCache(cache)
                .catch((e) => {
                initLucideCachePromise = null;
                throw e;
            });
        }
        return initLucideCachePromise;
    });
}
function init_lucideIconCache(lucideIconCache) {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield global_setting.api.readFile(global_setting.config.cache_paths + 'cache_lucide.json');
        if (!ret)
            return;
        const data = JSON.parse(ret);
        for (const [key, value] of Object.entries(data)) {
            lucideIconCache.set(key, value);
        }
    });
}
function save_lucideIconCache(lucideIconCache) {
    return __awaiter(this, void 0, void 0, function* () {
        void global_setting.api.writeFile(global_setting.config.cache_paths + 'cache_lucide.json', JSON.stringify(Object.fromEntries(lucideIconCache)));
    });
}
export function init_item(_p_this_1, li_1, item_1) {
    return __awaiter(this, arguments, void 0, function* (_p_this, li, item, mode = 'label') {
        var _a, _b;
        if (mode === 'none') { }
        else if (mode === 'label') {
            const label = document.createElement('div');
            li.appendChild(label);
            label.classList.add('am-context-menu-label');
            label.textContent = item.label;
        }
        else if (mode === 'icon') {
            li.title = item.label;
            if (!item.icon) {
                global_setting.api.safeInnerHTML(li, textToIcon(item.label, { twoLettersForEnglish: true }).html);
            }
            else if (item.icon.startsWith("lucide-")) {
                const iconName = item.icon.replace("lucide-", "");
                const iconUrl = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;
                try {
                    yield ensureLucideCacheReady(lucideIconCache);
                }
                catch (e) {
                    console.warn('Lucide 缓存文件初始化失败', e);
                }
                if (lucideIconCache.has(iconName)) {
                    if (global_setting.isDebug)
                        console.log('命中图标缓存', iconName);
                    const span = document.createElement('span');
                    li.appendChild(span);
                    span.classList.add('am-icon', 'am-icon-lucide');
                    global_setting.api.safeInnerHTML(span, (_a = lucideIconCache.get(iconName)) !== null && _a !== void 0 ? _a : "");
                }
                else {
                    const span = document.createElement('span');
                    li.appendChild(span);
                    span.classList.add('am-icon', 'am-icon-lucide');
                    global_setting.api.safeInnerHTML(span, '');
                    fetch(iconUrl)
                        .then(response => {
                        if (!response.ok) {
                            global_setting.api.safeInnerHTML(li, textToIcon(item.label, { twoLettersForEnglish: true }).html);
                            throw new Error(`Icon ${iconName} not found`);
                        }
                        return response.text();
                    })
                        .then(svgText => {
                        lucideIconCache.set(iconName, svgText);
                        save_lucideIconCache(lucideIconCache);
                        global_setting.api.safeInnerHTML(span, svgText);
                    })
                        .catch(error => {
                        console.warn("Failed to load Lucide icon:", error);
                        global_setting.api.safeInnerHTML(li, textToIcon(item.label, { twoLettersForEnglish: true }).html);
                    });
                }
            }
            else {
                const span = document.createElement('span');
                li.appendChild(span);
                span.classList.add('am-icon', 'am-icon-svg');
                global_setting.api.safeInnerHTML(span, item.icon);
            }
        }
        if (item.content != undefined) {
            li.addEventListener('mousedown', (event) => {
                event.preventDefault();
            });
            if (item.type === "command_ob") {
                li.addEventListener('click', () => {
                    var _a, _b;
                    if (!item.content)
                        return;
                    (_b = (_a = global_setting.other).obsidian_run_command) === null || _b === void 0 ? void 0 : _b.call(_a, item.content);
                });
            }
            else if (item.type === 'string' || item.type === "md") {
                li.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    if (!item.content)
                        return;
                    yield global_setting.api.sendText(item.content);
                }));
            }
            else if (item.type === 'path') {
                li.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    if (!item.content)
                        return;
                    yield global_setting.api.sendText(item.content, 'IMG_MODE');
                }));
            }
            else if (item.type === 'script') {
                const plugin = ((_b = item.plugin) !== null && _b !== void 0 ? _b : item.content) ? PLUGIN_MANAGER.plugin_list[item.content] : undefined;
                if (plugin) {
                    li.addEventListener('click', () => {
                        const ctx = PluginManager.getPluginRunCtx();
                        void plugin.run(ctx);
                    });
                    if (plugin.onCreateItem) {
                        const ctx = PluginManager.getPluginRunCtx();
                        plugin.onCreateItem(li, ctx);
                    }
                }
            }
            else {
            }
        }
        if (item.type && ["md", "path"].includes(item.type) && item.content &&
            !(item.type === "md" && !global_setting.other.renderMarkdown)) {
            let tooltip = undefined;
            li.onmouseenter = () => {
                var _a, _b, _c;
                const existingTooltip = li.querySelector('.ab-contextmenu-tooltip');
                if (existingTooltip) {
                    li.removeChild(existingTooltip);
                }
                tooltip = document.createElement('div');
                li.appendChild(tooltip);
                tooltip.classList.add('ab-contextmenu-tooltip');
                if (item.type === "md") {
                    if (item.content) {
                        void ((_b = (_a = global_setting.other).renderMarkdown) === null || _b === void 0 ? void 0 : _b.call(_a, item.content, tooltip));
                    }
                }
                else if (item.type === "path") {
                    const img = document.createElement('img');
                    tooltip.appendChild(img);
                    img.setAttribute('src', (_c = item.content) !== null && _c !== void 0 ? _c : "");
                    img.classList.add('tooltip-image');
                }
            };
            li.onmouseleave = () => {
                if (!tooltip)
                    return;
                li.removeChild(tooltip);
                tooltip = undefined;
            };
        }
    });
}
