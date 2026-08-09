var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { global_setting } from "../../shared/setting";
import { activeAMPanel } from "../../panels/MulPanel";
export const AppCtxDemo = {
    env: {
        platform: global_setting.platform,
        obsidian: global_setting.platform === 'obsidian-plugin' ? {
            plugin: global_setting.other.obsidian_plugin,
            ctx: global_setting.other.obsidian_ctx
        } : undefined,
        pluginName: '<will be override>',
        pluginId: '<will be override>',
    },
    api: {
        sendText: (str) => { global_setting.api.sendText(str); activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide(); },
        saveToClipboard: (str) => { global_setting.api.saveToClipboard(str); },
        notify: () => {
            console.error('will be override');
            return '';
        },
        urlRequest: (conf) => global_setting.api.urlRequest(conf),
        readFile() {
            return __awaiter(this, void 0, void 0, function* () {
                console.error('will be override');
                return '';
            });
        },
        writeFile() {
            return __awaiter(this, void 0, void 0, function* () {
                console.error('will be override');
                return false;
            });
        },
        hidePanel: (list) => {
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide(list);
            if (list == undefined && global_setting.platform === 'app') {
                global_setting.other.app_hide(list);
            }
        },
        showPanel: (list, position) => {
            if (global_setting.platform === 'app') {
                global_setting.other.app_show(position, list);
            }
            else {
                if (position != undefined) {
                    console.warn('非 app 环境不支持 position 参数');
                }
                activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_show(undefined, list, true);
            }
        },
        togglePanel: (item) => {
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_toggle(item);
        },
        registerSubPanel: (options) => {
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.register_sub_panel(options.id, options.el);
        },
        unregisterSubPanel: (id) => {
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.unregister_sub_panel(id);
        }
    }
};
export function appCtxDemo_createFunctions(id, name) {
    return {
        notify: (message) => __awaiter(this, void 0, void 0, function* () {
            yield global_setting.api.notify(name + ': ' + message);
        }),
        readFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                let targetPath = '';
                const fail_return = null;
                {
                    if (!path) {
                        path = {
                            relPath: id,
                            basePath: 'CACHE',
                        };
                    }
                    if (path.relPath.includes('../') || path.relPath.includes('..\\')) {
                        console.warn('拒绝访问包含 ../ 的路径穿越请求:', path.relPath);
                        return fail_return;
                    }
                    if (/[:*?"<>|\x00-\x1f\x7f]/.test(path.relPath)) {
                        console.warn('插件id包含非法字符:', path.relPath);
                        return fail_return;
                    }
                    switch (path.basePath) {
                        case "DICT":
                            targetPath = global_setting.config.dict_paths + path.relPath;
                            break;
                        case "NOTE":
                            targetPath = global_setting.config.note_paths + path.relPath;
                            break;
                        default:
                            targetPath = global_setting.config.cache_paths + path.relPath;
                            break;
                    }
                }
                return yield global_setting.api.readFile(targetPath);
            });
        },
        writeFile(content, path, is_append) {
            return __awaiter(this, void 0, void 0, function* () {
                let targetPath = '';
                const fail_return = false;
                {
                    if (!path) {
                        path = {
                            relPath: id,
                            basePath: 'CACHE',
                        };
                    }
                    if (path.relPath.includes('../') || path.relPath.includes('..\\')) {
                        console.warn('拒绝访问包含 ../ 的路径穿越请求:', path.relPath);
                        return fail_return;
                    }
                    if (/[:*?"<>|\x00-\x1f\x7f]/.test(path.relPath)) {
                        console.warn('插件id包含非法字符:', path.relPath);
                        return fail_return;
                    }
                    switch (path.basePath) {
                        case "DICT":
                            targetPath = global_setting.config.dict_paths + path.relPath;
                            break;
                        case "NOTE":
                            targetPath = global_setting.config.note_paths + path.relPath;
                            break;
                        default:
                            targetPath = global_setting.config.cache_paths + path.relPath;
                            break;
                    }
                }
                return yield global_setting.api.writeFile(targetPath, content, is_append);
            });
        },
    };
}
export const PluginRunCtxDemo = {
    env: {
        selectedText: undefined,
        activeAppName: undefined,
        activeDocTitle: undefined,
        activeDocUrl: undefined,
    },
};
export const PluginInterfaceDemo = `\
export default {
  metadata: {
    id: 'text-processor',
    name: 'TextProcessor',
    version: '1.0.0',
    min_app_version: '1.1.0',
    author: 'LincZero',
    description: '一个示例插件，将文本转为大写文本',
  },

  async process(str) {
    if (!str) return 'Empty input';
    return str.toUpperCase();
  },

  async run(ctx) {
    console.log('plugin demo test');
  },

  onLoad() {
    console.log('demo: 插件加载完成');
  },
  
  onUnload() {
    console.log('demo: 插件卸载');
  }
};
`;
