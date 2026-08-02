var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { activeAMPanel } from "./panels/MulPanel";
import { global_setting } from "./shared/setting";
import { SEARCH_DB, SEARCH_DB_img } from "./panels/search/SearchDB";
import { PLUGIN_MANAGER, PluginManager } from "./modules/pluginManager/PluginManager";
import { toml_parse } from "./panels/contextmenu/demo";
import * as yaml from 'js-yaml';
export function initMenuData() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!activeAMPanel) {
            console.error("Have no active amPanel");
            return;
        }
        if (!activeAMPanel.sub_panels.amContextMenu) {
            console.error("AMContextMenu is not initialized");
            return;
        }
        const myContextMenu = activeAMPanel.sub_panels.amContextMenu;
        if (!activeAMPanel.sub_panels.amToolbar) {
            console.error("AMToolbar is not initialized");
            return;
        }
        const myToolbar = activeAMPanel.sub_panels.amToolbar;
        {
            if (global_setting.isDebug) {
                const result = 'testE	🙂‍↔️\ntest1\t读取词库文件失败\ntest2\ttest222\ntest3\ttest123超长测试超长测试超长测试超长测试超长测试5超长测试超长测试超长测试';
                SEARCH_DB.add_data_by_csv(result, 'test');
            }
            if (global_setting.isDebug)
                PluginManager.demo();
        }
        if (!global_setting.config.dict_paths.endsWith('/')) {
            global_setting.config.dict_paths += '/';
        }
        yield fill_by_folder(global_setting.config.dict_paths);
        function fill_by_folder(folder_path) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const entries = yield global_setting.api.readFolder(folder_path, 1);
                    if (!entries || entries.length === 0)
                        throw new Error("No files found");
                    const promises = entries.map((entry_path) => __awaiter(this, void 0, void 0, function* () {
                        yield fill_by_file(entry_path);
                    }));
                    yield Promise.all(promises);
                    void PLUGIN_MANAGER.cachePluginMeta();
                }
                catch (error) {
                    console.warn("Failed to read directory:", error);
                }
            });
        }
        function fill_by_file(file_path) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                let file_folder;
                let file_name_short;
                let file_ext;
                file_folder = file_path.split(/\/|\\/).slice(0, -1).join('/');
                file_folder = (file_folder == '') ? '' : (file_folder + '/');
                const file_name_full = (_a = file_path.split(/\/|\\/).pop()) !== null && _a !== void 0 ? _a : '';
                const file_path_rel = file_path.replace(global_setting.config.dict_paths, '');
                const file_part = file_name_full.split('.');
                if (file_part.length < 2) {
                    file_name_short = file_name_full;
                    file_ext = '';
                }
                else {
                    file_name_short = file_part.slice(0, -1).join('.');
                    file_ext = file_part[file_part.length - 1].toLowerCase();
                }
                if (!['toml', 'csv', 'txt', 'json', 'yaml', 'yml', 'js'].includes(file_ext)) {
                    return;
                }
                let isFound = false;
                let isEnable = false;
                for (const plugin of global_setting.config_plugins) {
                    if (plugin.path !== file_path_rel)
                        continue;
                    isFound = true;
                    if (plugin.enabled)
                        isEnable = true;
                    break;
                }
                if (!isFound) {
                    global_setting.config_plugins.push({
                        path: file_path_rel,
                        enabled: false
                    });
                    global_setting.api.saveConfig();
                }
                if (!isEnable)
                    return;
                let file_content = '';
                file_content = yield global_setting.api.readFile(file_path);
                if (typeof file_content !== 'string') {
                    throw new Error("Invalid file content format");
                }
                if (file_ext === 'toml') {
                    void fill_by_toml(file_content, file_name_short);
                }
                else if (file_ext === 'csv' || file_ext === 'txt') {
                    void fill_by_csv(file_content, file_name_short);
                }
                else if (file_name_full.endsWith('.img.json')) {
                    void fill_by_img_json(file_content, file_name_short, file_folder);
                }
                else if (file_ext === 'json') {
                    void fill_by_json(file_content, file_name_short);
                }
                else if (file_ext === 'yaml' || file_ext === 'yml') {
                    void fill_by_yaml(file_content, file_name_short);
                }
                else if (file_ext === 'js') {
                    void fill_by_js(file_content, file_name_short, file_path);
                }
                else {
                    console.error('Unreadable, file type:', file_ext);
                }
            });
        }
        function fill_by_csv(file_content, file_name_short) {
            return __awaiter(this, void 0, void 0, function* () {
                SEARCH_DB.add_data_by_csv(file_content, file_name_short);
            });
        }
        function fill_by_json(file_content, file_name_short) {
            return __awaiter(this, void 0, void 0, function* () {
                let jsonData;
                try {
                    jsonData = JSON.parse(file_content);
                }
                catch (error) {
                    console.error("Parse error:", error);
                    return;
                }
                let records = jsonData.map((item) => {
                    var _a;
                    return {
                        key: item["keyword"],
                        value: item["title"],
                        name: (_a = item["description"]) !== null && _a !== void 0 ? _a : undefined,
                    };
                });
                SEARCH_DB.add_data_by_json(records, file_name_short);
            });
        }
        function fill_by_yaml(file_content, file_name_short) {
            return __awaiter(this, void 0, void 0, function* () {
                let yamlData;
                try {
                    yamlData = yaml.load(file_content);
                }
                catch (error) {
                    console.error("Parse error:", error);
                    return;
                }
                let records = yamlData.map((item) => {
                    var _a;
                    return {
                        key: item["keyword"],
                        value: item["title"],
                        name: (_a = item["description"]) !== null && _a !== void 0 ? _a : undefined,
                    };
                });
                SEARCH_DB.add_data_by_json(records, file_name_short);
            });
        }
        function fill_by_toml(file_content, file_name_short) {
            return __awaiter(this, void 0, void 0, function* () {
                let menu_items = [];
                try {
                    menu_items = toml_parse(file_content)["categories"];
                }
                catch (error) {
                    console.error("Parse error:", error);
                    return;
                }
                const records = [];
                function recursive(items) {
                    var _a, _b;
                    for (const item of items) {
                        if (!item.content)
                            item.content = item.callback;
                        if (!item.type) {
                            if (item.detail == "command_ob")
                                item.type = "command_ob";
                            else if (item.children)
                                item.type = "folder";
                        }
                        if (typeof item.content === 'string') {
                            records.push({
                                key: (_a = item.key) !== null && _a !== void 0 ? _a : item.label,
                                value: item.content,
                                name: (_b = item.key) !== null && _b !== void 0 ? _b : undefined,
                            });
                        }
                        if (item.children)
                            recursive(item.children);
                    }
                }
                if (menu_items)
                    recursive(menu_items);
                SEARCH_DB.add_data_by_json(records, file_name_short);
                myContextMenu.append_data([
                    {
                        label: file_name_short,
                        children: menu_items,
                    }
                ]);
            });
        }
        function fill_by_js(file_content, file_name_short, file_path) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const plugin = yield PLUGIN_MANAGER.loadPlugin(file_path, file_content);
                const panelItem = {
                    label: (_a = plugin.metadata.name) !== null && _a !== void 0 ? _a : plugin.metadata.id,
                    icon: plugin.metadata.icon,
                    type: "script",
                    content: plugin.metadata.id,
                    plugin,
                };
                SEARCH_DB.add_data_by_script({
                    id: plugin.metadata.id,
                    name: (_b = plugin.metadata.name) !== null && _b !== void 0 ? _b : undefined,
                    key: file_name_short,
                    value: file_name_short,
                });
                myContextMenu.append_data([panelItem]);
                myToolbar.append_data([panelItem]);
            });
        }
        function fill_by_img_json(file_content, file_name_short, file_folder) {
            return __awaiter(this, void 0, void 0, function* () {
                let jsonData;
                try {
                    jsonData = JSON.parse(file_content);
                }
                catch (error) {
                    console.error("Parse error:", error);
                    return;
                }
                let records = jsonData.map((item) => {
                    return {
                        key: file_name_short.replace('.img', '') + "/ " + item["path"],
                        name: item["keyword"],
                        value: file_folder + item["path"],
                    };
                });
                SEARCH_DB_img.add_data_by_json(records, file_name_short);
            });
        }
    });
}
