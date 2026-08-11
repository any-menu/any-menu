var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import DOMPurify from 'dompurify';
export const global_setting = {
    platform: 'app',
    isDebug: false,
    focusStrategy: true,
    config: {
        "language": "auto",
        "pinyin_index": true,
        "pinyin_first_index": true,
        "search_engine": "reverse",
        "search_limit": 500,
        "server_port": 41667,
        "dict_online_source": "github",
        "config_paths": "./config/",
        "dict_paths": "./dict/",
        "note_paths": "./notes/",
        "cache_paths": "./cache/",
        "send_text_method": "clipboard",
        "auto_show_toolbar_on_select": false,
        "auto_append_to_contextmenu": "right",
        "app_black_list": ["- Obsidian "],
        "app_ad_shortcut": true,
        "toolbar_list": [],
        "context_menu_list": [],
        "panel_preset2": [
            {
                "key": "Alt+A",
                "list": ["search", "toolbar", "menu"],
                "is_focus": true,
                "position_mode": "cursor",
            },
            {
                "key": "Alt+S",
                "list": ["search", "toolbar"],
                "is_focus": true,
                "position_mode": "cursor",
            },
            {
                "key": "Alt+D",
                "list": ["info"],
                "is_focus": true,
                "position_mode": "cursor",
            },
        ],
        "theme": "default",
        "darkmode": "auto",
    },
    config_css_vars: [],
    config_plugins: [],
    config_: {
        is_auto_startup: false,
        pinyin_method: 'pinyin',
        menu_position: 'cursor',
    },
    state: {
        language: 'en',
        isDark: false,
        isPin: false,
        editor_engine: 'codeblock',
        selectedText: undefined,
        infoText: '',
        activeAppName: undefined,
        activeDocTitle: undefined,
        activeDocUrl: undefined,
    },
    api: {
        safeInnerHTML: (el, string) => {
            const safeNode = DOMPurify.sanitize(string, {
                USE_PROFILES: { html: true, svg: true },
                RETURN_DOM_FRAGMENT: true
            });
            el.replaceChildren(safeNode);
        },
        isFolder: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.isFolder 方法"); return false; }),
        readFile: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.readFile 方法"); return null; }),
        readFolder: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.readFolder 方法"); return []; }),
        writeFile: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.writeFile 方法"); return false; }),
        deleteFile: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.deleteFile 方法"); return false; }),
        loadConfig: () => __awaiter(void 0, void 0, void 0, function* () {
            const loadConfig_ = (file_path, bindObj) => __awaiter(void 0, void 0, void 0, function* () {
                let file_content = null;
                try {
                    const result = yield global_setting.api.readFile(file_path);
                    if (typeof result !== 'string') {
                        throw new Error("Invalid file content format");
                    }
                    file_content = result;
                }
                catch (error) {
                    console.warn("没配置文件，将自动生成一个", file_path);
                    file_content = null;
                }
                if (!file_content)
                    return false;
                try {
                    const new_config = JSON.parse(file_content);
                    if (!new_config || typeof new_config !== 'object') {
                        throw new Error("Invalid config format");
                    }
                    if (bindObj) {
                        Object.assign(bindObj, new_config);
                    }
                    return true;
                }
                catch (error) {
                    console.error('配置解析失败，请检查格式是否正确', error);
                    return false;
                }
            });
            const [ret1, ret2, ret3] = yield Promise.all([
                loadConfig_(global_setting.config.config_paths + 'config.json', global_setting.config),
                loadConfig_(global_setting.config.config_paths + 'config_css_vars.json', global_setting.config_css_vars),
                loadConfig_(global_setting.config.config_paths + 'config_plugins.json', global_setting.config_plugins),
            ]);
            const ret4 = yield global_setting.api.saveConfig();
            return ret1 && ret2 && ret3 && ret4;
        }),
        saveConfig: () => __awaiter(void 0, void 0, void 0, function* () {
            const saveConfig_ = (file_path, target_obj) => __awaiter(void 0, void 0, void 0, function* () {
                let newStr;
                if (Array.isArray(target_obj)) {
                    newStr = '[\n' + target_obj.map(item => JSON.stringify(item)).join(',\n') + '\n]';
                }
                else {
                    newStr = JSON.stringify(target_obj, undefined, 2);
                }
                void global_setting.api.writeFile(file_path, newStr);
            });
            void saveConfig_(global_setting.config.config_paths + 'config.json', global_setting.config);
            void saveConfig_(global_setting.config.config_paths + 'config_css_vars.json', global_setting.config_css_vars);
            void saveConfig_(global_setting.config.config_paths + 'config_plugins.json', global_setting.config_plugins);
            return true;
        }),
        getCursorXY: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.getCursorXY 方法"); return { x: -1, y: -1 }; }),
        getScreenSize: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.getScreenSize 方法"); return { width: -1, height: -1 }; }),
        getInfo: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.getInfo 方法"); return null; }),
        notify: (message) => __awaiter(void 0, void 0, void 0, function* () {
            console.warn("未实现 api.notify 方法，将使用 console.warn 替代");
            console.warn(message);
        }),
        pin: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.pin 方法"); }),
        sendText: (text) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            console.warn("未实现 api.sendText 方法，将使用通用浏览器行为");
            const activeElement = document.activeElement;
            if (activeElement) {
                const active = activeElement;
                const tagName = active.tagName;
                const isInput = tagName === 'INPUT';
                const isTextarea = tagName === 'TEXTAREA';
                const isContentEditable = active.isContentEditable;
                if (isInput || isTextarea) {
                    const el = active;
                    const nonTextTypes = ['checkbox', 'radio', 'file', 'button', 'submit', 'reset', 'image', 'hidden'];
                    if (!el.disabled &&
                        !el.readOnly &&
                        !(isInput && nonTextTypes.includes(active.type))) {
                        const start = (_a = el.selectionStart) !== null && _a !== void 0 ? _a : 0;
                        const end = (_b = el.selectionEnd) !== null && _b !== void 0 ? _b : 0;
                        el.setRangeText(text, start, end, 'end');
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
                else if (isContentEditable) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        const textNode = document.createTextNode(text);
                        range.insertNode(textNode);
                        range.setStartAfter(textNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        active.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    else {
                        console.warn('没有活动的选区，将demo文本生成到剪贴板');
                        navigator.clipboard.writeText(text).catch(err => console.error('Could not copy text: ', err));
                    }
                }
            }
            console.warn('没有活动的元素，将demo文本生成到剪贴板');
            navigator.clipboard.writeText(text).catch(err => console.error("Could not copy text: ", err));
        }),
        saveToClipboard: (text) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield navigator.clipboard.writeText(text);
            }
            catch (err) {
                console.error("Failed to save to clipboard: ", err);
            }
        }),
        urlRequest: () => __awaiter(void 0, void 0, void 0, function* () { console.error("需实现 api.urlRequest 方法"); return null; }),
        getSystemIsDark: () => { console.error("需实现 api.getSystemIsDark 方法"); return false; },
    },
    other: {
        obsidian_plugin: null,
        obsidian_ctx: null,
        obsidian_run_command: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非obsidian环境不支持此操作"); }),
        renderMarkdown: null,
        app_show: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非app环境不支持此操作"); }),
        app_hide: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非app环境不支持此操作"); }),
        app_showInExplorer: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非app环境不支持此操作"); }),
        app_selectInExplorer: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非app环境不支持此操作"); return null; }),
        app_convertFileSrc: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非app环境不支持此操作"); return '[error]'; }),
        app_createTitlebar: () => __awaiter(void 0, void 0, void 0, function* () { console.warn("非app环境不支持此操作，或未定义"); }),
    }
};
global_setting.config_css_vars = [
    { varName: "--am-text-color", value: "#1E1E1E", darkValue: "#f6f6f6", name: "文本色" },
    { varName: "--am-bg-color", value: "#f6f6f6", darkValue: "#2f2f2f", name: "背景色" },
    { varName: "--am-bd-color", value: "#e0e0e0", darkValue: "#34343f", name: "边框色" },
    { varName: "--am-pre-text-color", value: "#5c5c5c", darkValue: "#e3e3e3", name: "文本框文本色" },
    { varName: "--am-pre-bg-color", value: "#ffffff", darkValue: "#282828", name: "文本框背景色" },
    { varName: "--am-pre-bd-color", value: "#e5e5e5", darkValue: "#383839", name: "文本框边框色" },
    { varName: "--am-pre-bg-hlcolor", value: "#005eb5", darkValue: "#0078d7", name: "文本框边框高亮色" },
    { varName: "--am-bright-color", value: "#23A8F2", darkValue: "#23A8F2", name: "文本高亮色" },
    { varName: "--am-bright-bg-color", value: "#4a89dc", darkValue: "#4a89dc", name: "背景高亮色" },
    { varName: "--ab-tab-root-tx-color", value: "#5c5c5c", darkValue: "#9e9e9e", name: "标签栏文本色" },
    { varName: "--ab-tab-root-bg-color", value: "#ffffff", darkValue: "#0d1117", name: "标签栏背景色" },
    { varName: "--ab-tab-root-bd-color", value: "#e0e0e0", darkValue: "#34343f", name: "标签栏边框色" },
    { varName: "--ab-tab-root-hv-color", value: "#d7d7d7", darkValue: "#363639", name: "标签栏悬停色" },
];
const key_darkmode = Symbol('darkmode');
export function proxy_global_setting() {
    Object.defineProperty(global_setting.config, 'darkmode', {
        get() {
            return this[key_darkmode];
        },
        set(darkmode) {
            this[key_darkmode] = darkmode;
            let isDark;
            if (darkmode === 'dark')
                isDark = true;
            else if (darkmode === 'light')
                isDark = false;
            else
                isDark = global_setting.api.getSystemIsDark();
            global_setting.state.isDark = isDark;
            document.documentElement.classList.toggle('am-theme-dark', isDark);
            document.documentElement.classList.toggle('am-theme-light', !isDark);
        },
        enumerable: true,
        configurable: true,
    });
}
proxy_global_setting();
