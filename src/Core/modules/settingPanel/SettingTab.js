var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { t } from '../../shared/locales/helper';
import { global_setting } from '../../shared/setting';
import { RepoAPI } from '../../shared/webApi';
import { SettingItem } from './SettingItem';
export function initSettingTab_1(el) {
    el.classList.add('tab-root', 'am-config');
    const tab_nav_container = document.createElement('div');
    el.appendChild(tab_nav_container);
    tab_nav_container.classList.add('tab-nav-container');
    const tab_content_container = document.createElement('div');
    el.appendChild(tab_content_container);
    tab_content_container.classList.add('tab-content-container');
    initSettingTab_miniDocs(tab_nav_container, tab_content_container);
    void initSettingTab_localDict(tab_nav_container, tab_content_container);
    void initSettingTab_webDict(tab_nav_container, tab_content_container);
    void initSettingTab_toolbar(tab_nav_container, tab_content_container);
    void initSettingTab_contextMenu(tab_nav_container, tab_content_container);
    void initSettingTab_style(tab_nav_container, tab_content_container);
    void initSettingTab_configUI(tab_nav_container, tab_content_container);
    void initSettingTab_modiByText(tab_nav_container, tab_content_container);
    return { tab_nav_container, tab_content_container };
}
export function initSettingTab_2(tab_nav_container, tab_content_container) {
    for (const nav of tab_nav_container.querySelectorAll('div.item')) {
        const index = nav.getAttribute('index');
        if (index == null)
            continue;
        nav.addEventListener('click', () => {
            for (const nav_item of tab_nav_container.children) {
                nav_item.classList.remove('active');
            }
            nav.classList.add('active');
            let content = null;
            for (const content_ of tab_content_container.children) {
                content_.classList.remove('active');
                if (content_.getAttribute('index') === index)
                    content = content_;
            }
            content === null || content === void 0 ? void 0 : content.classList.add('active');
        });
    }
}
function initSettingTab_miniDocs(tab_nav_container, tab_content_container) {
    const tab_nav = document.createElement('div');
    tab_nav_container.appendChild(tab_nav);
    tab_nav.classList.add('item');
    tab_nav.textContent = t('Mini docs');
    const tab_content = document.createElement('div');
    tab_content_container.appendChild(tab_content);
    tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'mini-docs');
    tab_content.setAttribute('index', 'mini-docs');
    const div = document.createElement('div');
    tab_content.appendChild(div);
    div.classList.add('am-inner-html');
    global_setting.api.saveInnerHTML(div, t('Mini docs2'));
    tab_nav.classList.add('active');
    tab_content.classList.add('active');
}
const local_dict_list = [];
function local_dict_list_onChange() {
}
function initSettingTab_webDict(tab_nav_container, tab_content_container) {
    return __awaiter(this, void 0, void 0, function* () {
        const tab_nav = document.createElement('div');
        tab_nav_container.appendChild(tab_nav);
        tab_nav.classList.add('item');
        tab_nav.textContent = t('Online dict');
        const tab_content = document.createElement('div');
        tab_content_container.appendChild(tab_content);
        tab_content.classList.add('item');
        tab_nav.setAttribute('index', 'web-dict');
        tab_content.setAttribute('index', 'web-dict');
        const container = document.createElement('div');
        tab_content.appendChild(container);
        const span = document.createElement('span');
        container.appendChild(span);
        span.textContent = `未加载，请手动点击刷新按钮重试`;
        const dataview = document.createElement('div');
        container.appendChild(dataview);
        dataview.classList.add('am-hide');
        {
            const buttons = document.createElement('div');
            container.appendChild(buttons);
            buttons.classList.add('setting-buttons');
            const dataview_mode_btn = document.createElement('button');
            buttons.appendChild(dataview_mode_btn);
            dataview_mode_btn.textContent = t('Change dataview mode');
            dataview_mode_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                let viewmode_ = dataview.dataset.viewmode;
                let viewmode = (viewmode_ !== 'card') ? 'card' : 'table';
                void getDictData_and_showData(viewmode);
            });
            const refresh_btn = document.createElement('button');
            buttons.appendChild(refresh_btn);
            refresh_btn.textContent = t('Refresh dict list');
            refresh_btn.onclick = () => __awaiter(this, void 0, void 0, function* () { return void getDictData_and_showData('card', false); });
        }
        let data_cache = null;
        void getDictData_and_showData();
        function getDictData_and_showData() {
            return __awaiter(this, arguments, void 0, function* (mode = 'card', is_use_cache = true) {
                let data;
                if (is_use_cache && data_cache) {
                    data = data_cache;
                }
                else {
                    data = yield getDictData();
                    if (!data)
                        return;
                    else
                        data_cache = data;
                }
                const api = new RepoAPI();
                const data_header = [
                    ...(global_setting.isDebug ? [{
                            name: t('Id'),
                            callback: (el, item) => {
                                el.innerText = item.id;
                                return true;
                            }
                        }] : []),
                    {
                        name: t('Name'),
                        callback: (el, item) => {
                            el.innerText = item.name;
                            return true;
                        }
                    },
                    {
                        name: t('Path'),
                        callback: (el, item) => {
                            const a = document.createElement('a');
                            el.appendChild(a);
                            a.target = '_blank';
                            a.textContent = item.path;
                            if (item.path.includes('/')) {
                                a.href = `https://github.com/${item.path}`;
                            }
                            else {
                                a.href = `${api.blobUrl()}store/dict/${item.path}`;
                            }
                            return true;
                        }
                    },
                    {
                        name: t('Author'),
                        callback: (el, item) => {
                            if (!item.author)
                                return false;
                            el.innerText = item.author;
                            return true;
                        }
                    },
                    {
                        name: t('Description'),
                        callback: (el, item) => {
                            if (!item.description)
                                return false;
                            el.innerText = item.description;
                            return true;
                        }
                    },
                    {
                        name: t('Is downloaded'),
                        callback: (el, item) => {
                            const td4_btn = document.createElement('button');
                            el.appendChild(td4_btn);
                            td4_btn.classList.add('btn');
                            const split_num = item.path.split('/');
                            if (split_num.length > 2) {
                                console.error("非法的路径名:", item.path);
                                return false;
                            }
                            const newPath = item.path.includes('/') ? `${item.path}.js` : item.path;
                            if (local_dict_list.find(d => d.relPath === newPath)) {
                                td4_btn.textContent = t('Downloaded');
                                td4_btn.setAttribute('color', 'green');
                            }
                            else {
                                td4_btn.textContent = t('Download');
                                td4_btn.setAttribute('color', 'gray');
                            }
                            td4_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                                td4_btn.textContent = t('Downloading');
                                const color = td4_btn.getAttribute('color');
                                if (color === 'green') {
                                    global_setting.api.deleteFile(`${global_setting.config.dict_paths}${newPath}`).then(success => {
                                        if (!success) {
                                            td4_btn.textContent = t('Uninstalled failed');
                                            td4_btn.setAttribute('color', 'green');
                                            return;
                                        }
                                        td4_btn.textContent = t('Uninstalled');
                                        td4_btn.setAttribute('color', 'gray');
                                        const index = local_dict_list.findIndex(d => d.relPath === newPath);
                                        if (index >= 0) {
                                            local_dict_list.splice(index, 1);
                                            local_dict_list_onChange();
                                        }
                                    });
                                }
                                else {
                                    if (item.path.includes('/')) {
                                        RepoAPI.getFile_fromRelease_and_writeFile(item.path).then(success => {
                                            if (!success) {
                                                td4_btn.textContent = t('Download failed');
                                                td4_btn.setAttribute('color', 'red');
                                                return;
                                            }
                                            td4_btn.textContent = t('Downloaded');
                                            td4_btn.setAttribute('color', 'green');
                                            local_dict_list.push({
                                                path: `${global_setting.config.dict_paths}${newPath}`,
                                                relPath: newPath,
                                                isDownloaded: true, isEnabled: true,
                                            });
                                            local_dict_list_onChange();
                                        });
                                        return;
                                    }
                                    api.getFile_fromStorePath_and_writeFile(newPath).then(success => {
                                        if (!success) {
                                            td4_btn.textContent = t('Download failed');
                                            td4_btn.setAttribute('color', 'red');
                                            return;
                                        }
                                        td4_btn.textContent = t('Downloaded');
                                        td4_btn.setAttribute('color', 'green');
                                        local_dict_list.push({
                                            path: `${global_setting.config.dict_paths}${newPath}`,
                                            relPath: newPath,
                                            isDownloaded: true, isEnabled: true
                                        });
                                        local_dict_list_onChange();
                                    });
                                }
                            });
                            return true;
                        }
                    },
                ];
                if (mode === 'card')
                    json2card(dataview, data, data_header);
                else
                    json2table(dataview, data, data_header);
            });
        }
        function getDictData() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                dataview.innerHTML = '';
                dataview.classList.add('am-hide');
                span.classList.remove('am-hide');
                span.textContent = t('Loading');
                const api = new RepoAPI();
                const ret = yield api.getDir_fromStorePath();
                if (!(ret && ret.code == 0 && ((_a = ret.data) === null || _a === void 0 ? void 0 : _a.json))) {
                    console.error('Failed to load dict list from repo', ret);
                    if (global_setting.config.dict_online_source === 'github') {
                        console.error("You can try to change the dict_online_source to 'gitee' in settings.");
                    }
                    dataview.classList.add('am-hide');
                    span.classList.remove('am-hide');
                    span.textContent = `${t('Load failed')}，请检查网络或稍后重试. code:${ret === null || ret === void 0 ? void 0 : ret.code}, msg:${ret === null || ret === void 0 ? void 0 : ret.msg}`;
                    return;
                }
                dataview.classList.remove('am-hide');
                span.classList.add('am-hide');
                span.textContent = t('Load successed');
                const dir = ret.data.json;
                return dir;
            });
        }
    });
}
function initSettingTab_localDict(tab_nav_container, tab_content_container) {
    return __awaiter(this, void 0, void 0, function* () {
        const tab_nav = document.createElement('div');
        tab_nav_container.appendChild(tab_nav);
        tab_nav.classList.add('item');
        tab_nav.textContent = t('Local dict');
        const tab_content = document.createElement('div');
        tab_content_container.appendChild(tab_content);
        tab_content.classList.add('item');
        tab_nav.setAttribute('index', 'local-dict');
        tab_content.setAttribute('index', 'local-dict');
        tab_nav.addEventListener('click', () => void getDictData_and_showData());
        const container = document.createElement('div');
        tab_content.appendChild(container);
        const span = document.createElement('span');
        container.appendChild(span);
        span.textContent = `未加载，请手动点击刷新按钮重试`;
        const dataview = document.createElement('div');
        container.appendChild(dataview);
        dataview.classList.add('am-hide');
        {
            const buttons = document.createElement('div');
            tab_content.appendChild(buttons);
            buttons.classList.add('setting-buttons');
            const text_modi_btn = document.createElement('button');
            buttons.appendChild(text_modi_btn);
            text_modi_btn.textContent = t('Modi by text');
            text_modi_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                void initSettingTab_modiByText_refresh(global_setting.config.config_paths + 'config_plugins.json', global_setting.config_plugins);
            });
            const dataview_mode_btn = document.createElement('button');
            buttons.appendChild(dataview_mode_btn);
            dataview_mode_btn.textContent = t('Change dataview mode');
            dataview_mode_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                let viewmode_ = dataview.dataset.viewmode;
                let viewmode = (viewmode_ !== 'card') ? 'card' : 'table';
                void getDictData_and_showData(viewmode);
            });
            const refresh_btn = document.createElement('button');
            buttons.appendChild(refresh_btn);
            refresh_btn.textContent = t('Refresh dict list');
            refresh_btn.onclick = () => __awaiter(this, void 0, void 0, function* () { return void getDictData_and_showData(); });
        }
        void getDictData_and_showData();
        function getDictData_and_showData() {
            return __awaiter(this, arguments, void 0, function* (mode = 'card') {
                const data = yield getDictData();
                if (!data)
                    return;
                const path = global_setting.config.cache_paths + 'cache_plugin_meta.json';
                let plugins_cache = {};
                try {
                    const content = yield global_setting.api.readFile(path);
                    if (content)
                        plugins_cache = JSON.parse(content);
                }
                catch (_a) { }
                const data_header = [
                    {
                        name: t('Name'),
                        callback: (el, item) => {
                            var _a;
                            const ret = plugins_cache[item.path];
                            if (!ret)
                                return false;
                            el.innerText = (_a = ret.name) !== null && _a !== void 0 ? _a : ret.id;
                            return true;
                        },
                    },
                    {
                        name: t('Path'),
                        callback: (el, item) => {
                            el.innerText = item.relPath;
                            return true;
                        },
                    },
                    {
                        name: t('Author'),
                        callback: (el, item) => {
                            const ret = plugins_cache[item.path];
                            if (!ret || !ret.author)
                                return false;
                            el.innerText = ret.author;
                            return true;
                        }
                    },
                    {
                        name: t('Version'),
                        callback: (el, item) => {
                            const ret = plugins_cache[item.path];
                            if (!ret)
                                return false;
                            el.innerText = ret.version;
                            return true;
                        }
                    },
                    {
                        name: t('Description'),
                        callback: (el, item) => {
                            const ret = plugins_cache[item.path];
                            if (!ret || !ret.description)
                                return false;
                            el.innerText = ret.description;
                            return true;
                        }
                    },
                    {
                        name: t('Uninstall'),
                        callback: (el, item) => {
                            const td4_btn = document.createElement('button');
                            el.appendChild(td4_btn);
                            td4_btn.classList.add('btn');
                            td4_btn.textContent = t('Downloaded');
                            td4_btn.setAttribute('color', 'green');
                            td4_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                                const color = td4_btn.getAttribute('color');
                                if (color !== 'green') {
                                    console.error('Unreachable');
                                    return;
                                }
                                global_setting.api.deleteFile(`${global_setting.config.dict_paths}${item.relPath}`).then(success => {
                                    if (!success) {
                                        td4_btn.textContent = t('Uninstalled failed');
                                        td4_btn.setAttribute('color', 'green');
                                        return;
                                    }
                                    const index = local_dict_list.findIndex(d => d.relPath === item.relPath);
                                    if (index >= 0) {
                                        local_dict_list.splice(index, 1);
                                        local_dict_list_onChange();
                                    }
                                    void getDictData_and_showData();
                                });
                            });
                            return true;
                        }
                    },
                    {
                        name: t('Is enabled'),
                        callback: (el, item) => {
                            const td5_btn = document.createElement('button');
                            el.appendChild(td5_btn);
                            td5_btn.classList.add('btn');
                            const ret_ = global_setting.config_plugins.find(p => p.path === item.relPath);
                            const ret = ret_ !== null && ret_ !== void 0 ? ret_ : {
                                path: item.relPath,
                                enabled: false
                            };
                            if (!ret_) {
                                global_setting.config_plugins.push(ret);
                            }
                            if (ret.enabled) {
                                td5_btn.textContent = t('Enabled');
                                td5_btn.setAttribute('color', 'green');
                            }
                            else {
                                td5_btn.textContent = t('Disabled');
                                td5_btn.setAttribute('color', 'gray');
                            }
                            td5_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                                ret.enabled = !ret.enabled;
                                global_setting.api.saveConfig();
                                if (ret.enabled) {
                                    td5_btn.textContent = t('Enabled');
                                    td5_btn.setAttribute('color', 'green');
                                }
                                else {
                                    td5_btn.textContent = t('Disabled');
                                    td5_btn.setAttribute('color', 'gray');
                                }
                            });
                            return true;
                        },
                    },
                ];
                if (mode === 'card')
                    json2card(dataview, data, data_header);
                else
                    json2table(dataview, data, data_header);
            });
        }
        function getDictData() {
            return __awaiter(this, void 0, void 0, function* () {
                dataview.innerHTML = '';
                dataview.classList.add('am-hide');
                span.classList.remove('am-hide');
                span.textContent = t('Loading');
                let ret = yield global_setting.api.readFolder(global_setting.config.dict_paths, 1);
                ret = ret.filter(path => {
                    var _a;
                    const ext = (_a = path.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                    if (!ext)
                        return false;
                    return ['toml', 'csv', 'txt', 'json', 'yaml', 'yml', 'js'].includes(ext);
                });
                dataview.classList.remove('am-hide');
                span.classList.add('am-hide');
                span.textContent = t('Load successed');
                local_dict_list.length = 0;
                const dir = ret.map(path => {
                    const relPath = path.replace(global_setting.config.dict_paths, '');
                    local_dict_list.push({ path: path, relPath: relPath, isDownloaded: false, isEnabled: false });
                    return {
                        path: path,
                        relPath: relPath
                    };
                });
                local_dict_list_onChange();
                return dir;
            });
        }
    });
}
function initSettingTab_toolbar(tab_nav_container, tab_content_container) {
    const tab_nav = document.createElement('div');
    tab_nav_container.appendChild(tab_nav);
    tab_nav.classList.add('item');
    tab_nav.textContent = t('Toolbar');
    const tab_content = document.createElement('div');
    tab_content_container.appendChild(tab_content);
    tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'toolbar-custom');
    tab_content.setAttribute('index', 'toolbar-custom');
    tab_nav.addEventListener('click', fn_refresh);
    {
        const buttons = document.createElement('div');
        tab_content.appendChild(buttons);
        buttons.classList.add('setting-buttons');
        const text_modi_btn = document.createElement('button');
        buttons.appendChild(text_modi_btn);
        text_modi_btn.textContent = t('Modi by text');
        text_modi_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
            void initSettingTab_modiByText_refresh(global_setting.config.config_paths + 'config.json', global_setting.config);
        });
    }
    const p = document.createElement('div');
    tab_content.appendChild(p);
    p.textContent = t('Toolbar2');
    const el_rows = document.createElement('div');
    tab_content.appendChild(el_rows);
    el_rows.classList.add('setting_row');
    function __sync_dom_indexes() {
        const rows = el_rows.querySelectorAll(':scope > div');
        rows.forEach((row, i) => {
            row.dataset.index = String(i);
        });
    }
    let __drag_from_index = -1;
    for (let i = 0; i < global_setting.config.toolbar_list.length; i++) {
        create_el_row(global_setting.config.toolbar_list[i], i);
    }
    const add_btn = document.createElement('button');
    tab_content.appendChild(add_btn);
    add_btn.classList.add('setting_row-add-btn');
    global_setting.api.saveInnerHTML(add_btn, SVG_ICON_ADD);
    add_btn.title = t('Add');
    add_btn.addEventListener('click', () => {
        const newName = '';
        const newIndex = global_setting.config.toolbar_list.length;
        global_setting.config.toolbar_list.push(newName);
        global_setting.api.saveConfig();
        const { el_row_name } = create_el_row(newName, newIndex);
        el_row_name.focus();
    });
    const refresh_btn = document.createElement('button');
    tab_content.appendChild(refresh_btn);
    refresh_btn.classList.add('setting_row-refresh-btn');
    global_setting.api.saveInnerHTML(refresh_btn, SVG_ICON_REFRESH);
    refresh_btn.title = t('Refresh');
    function fn_refresh() {
        el_rows.innerHTML = '';
        for (let i = 0; i < global_setting.config.toolbar_list.length; i++) {
            create_el_row(global_setting.config.toolbar_list[i], i);
        }
    }
    ;
    refresh_btn.addEventListener('click', fn_refresh);
    function create_el_row(name, index) {
        const el_row = document.createElement('div');
        el_rows.appendChild(el_row);
        el_row.classList.add('item_row');
        el_row.dataset.index = String(index);
        el_row.draggable = true;
        const el_row_drag = document.createElement('span');
        el_row.appendChild(el_row_drag);
        el_row_drag.classList.add('drag-btn');
        global_setting.api.saveInnerHTML(el_row_drag, SVG_ICON_GRIP);
        el_row_drag.title = t('Drag');
        const el_row_name = document.createElement('input');
        el_row.appendChild(el_row_name);
        el_row_name.classList.add('name');
        el_row_name.value = name;
        el_row_name.addEventListener('change', () => {
            const idx = Number(el_row.dataset.index);
            if (Number.isNaN(idx))
                return;
            global_setting.config.toolbar_list[idx] = el_row_name.value;
            global_setting.api.saveConfig();
        });
        const el_row_delete = document.createElement('button');
        el_row.appendChild(el_row_delete);
        el_row_delete.classList.add('delete-btn');
        global_setting.api.saveInnerHTML(el_row_delete, SVG_ICON_DELETE);
        el_row_delete.title = t('Delete');
        el_row_delete.addEventListener('click', () => {
            const idx = Number(el_row.dataset.index);
            if (Number.isNaN(idx))
                return;
            if (idx < 0 || idx >= global_setting.config.toolbar_list.length)
                return;
            global_setting.config.toolbar_list.splice(idx, 1);
            global_setting.api.saveConfig();
            el_row.remove();
            __sync_dom_indexes();
        });
        {
            el_row.addEventListener('dragstart', (e) => {
                var _a;
                const idx = Number(el_row.dataset.index);
                if (Number.isNaN(idx)) {
                    e.preventDefault();
                    return;
                }
                __drag_from_index = idx;
                el_row.classList.add('dragging');
                try {
                    (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', String(idx));
                }
                catch (_b) { }
                if (e.dataTransfer)
                    e.dataTransfer.effectAllowed = 'move';
            });
            el_row.addEventListener('dragend', () => {
                __drag_from_index = -1;
                el_row.classList.remove('dragging');
            });
            el_row.addEventListener('dragenter', (e) => {
                e.preventDefault();
            });
            el_row.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer)
                    e.dataTransfer.dropEffect = 'move';
                const toIndex = Number(el_row.dataset.index);
                const fromIndex = __drag_from_index;
                if (fromIndex < 0 || Number.isNaN(toIndex) || fromIndex == toIndex)
                    return;
                if (fromIndex < toIndex) {
                    el_row.classList.add('drag-over-bottom');
                }
                else {
                    el_row.classList.add('drag-over-top');
                }
            });
            el_row.addEventListener('dragleave', (_) => {
                el_row.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            el_row.addEventListener('drop', (e) => {
                e.preventDefault();
                el_row.classList.remove('drag-over-top', 'drag-over-bottom');
                const toIndex = Number(el_row.dataset.index);
                const fromIndex = __drag_from_index;
                if (Number.isNaN(toIndex))
                    return;
                if (fromIndex < 0)
                    return;
                if (fromIndex === toIndex)
                    return;
                if (fromIndex >= global_setting.config.toolbar_list.length)
                    return;
                const [moved] = global_setting.config.toolbar_list.splice(fromIndex, 1);
                global_setting.config.toolbar_list.splice(toIndex, 0, moved);
                global_setting.api.saveConfig();
                const fromRow = el_rows.querySelector(`:scope > div[data-index="${fromIndex}"]`);
                if (fromRow) {
                    el_rows.insertBefore(fromRow, (fromIndex < toIndex) ? el_row.nextSibling : el_row);
                }
                __sync_dom_indexes();
            });
        }
        return { el_row, el_row_name };
    }
}
function initSettingTab_contextMenu(tab_nav_container, tab_content_container) {
    const tab_nav = document.createElement('div');
    tab_nav_container.appendChild(tab_nav);
    tab_nav.classList.add('item');
    tab_nav.textContent = t('Menu');
    const tab_content = document.createElement('div');
    tab_content_container.appendChild(tab_content);
    tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'context-menu-custom');
    tab_content.setAttribute('index', 'context-menu-custom');
    tab_nav.addEventListener('click', fn_refresh);
    {
        const buttons = document.createElement('div');
        tab_content.appendChild(buttons);
        buttons.classList.add('setting-buttons');
        const text_modi_btn = document.createElement('button');
        buttons.appendChild(text_modi_btn);
        text_modi_btn.textContent = t('Modi by text');
        text_modi_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
            void initSettingTab_modiByText_refresh(global_setting.config.config_paths + 'config.json', global_setting.config);
        });
    }
    const p = document.createElement('div');
    tab_content.appendChild(p);
    p.textContent = t('Menu2');
    const el_rows = document.createElement('div');
    tab_content.appendChild(el_rows);
    el_rows.classList.add('setting_row');
    function __sync_dom_indexes() {
        const rows = el_rows.querySelectorAll(':scope > div');
        rows.forEach((row, i) => {
            row.dataset.index = String(i);
        });
    }
    let __drag_from_index = -1;
    for (let i = 0; i < global_setting.config.context_menu_list.length; i++) {
        create_el_row(global_setting.config.context_menu_list[i], i);
    }
    const add_btn = document.createElement('button');
    tab_content.appendChild(add_btn);
    add_btn.classList.add('setting_row-add-btn');
    global_setting.api.saveInnerHTML(add_btn, SVG_ICON_ADD);
    add_btn.title = t('Add');
    add_btn.addEventListener('click', () => {
        const newName = '';
        const newIndex = global_setting.config.context_menu_list.length;
        global_setting.config.context_menu_list.push(newName);
        global_setting.api.saveConfig();
        const { el_row_name } = create_el_row(newName, newIndex);
        el_row_name.focus();
    });
    const refresh_btn = document.createElement('button');
    tab_content.appendChild(refresh_btn);
    refresh_btn.classList.add('setting_row-refresh-btn');
    global_setting.api.saveInnerHTML(refresh_btn, SVG_ICON_REFRESH);
    refresh_btn.title = t('Refresh');
    function fn_refresh() {
        el_rows.innerHTML = '';
        for (let i = 0; i < global_setting.config.context_menu_list.length; i++) {
            create_el_row(global_setting.config.context_menu_list[i], i);
        }
    }
    ;
    refresh_btn.addEventListener('click', fn_refresh);
    function create_el_row(name, index) {
        const el_row = document.createElement('div');
        el_rows.appendChild(el_row);
        el_row.classList.add('item_row');
        el_row.dataset.index = String(index);
        el_row.draggable = true;
        const el_row_drag = document.createElement('span');
        el_row.appendChild(el_row_drag);
        el_row_drag.classList.add('drag-btn');
        global_setting.api.saveInnerHTML(el_row_drag, SVG_ICON_GRIP);
        el_row_drag.title = t('Drag');
        const el_row_name = document.createElement('input');
        el_row.appendChild(el_row_name);
        el_row_name.classList.add('name');
        el_row_name.value = name;
        el_row_name.addEventListener('change', () => {
            const idx = Number(el_row.dataset.index);
            if (Number.isNaN(idx))
                return;
            global_setting.config.context_menu_list[idx] = el_row_name.value;
            global_setting.api.saveConfig();
        });
        const el_row_delete = document.createElement('button');
        el_row.appendChild(el_row_delete);
        el_row_delete.classList.add('delete-btn');
        global_setting.api.saveInnerHTML(el_row_delete, SVG_ICON_DELETE);
        el_row_delete.title = t('Delete');
        el_row_delete.addEventListener('click', () => {
            const idx = Number(el_row.dataset.index);
            if (Number.isNaN(idx))
                return;
            if (idx < 0 || idx >= global_setting.config.context_menu_list.length)
                return;
            global_setting.config.context_menu_list.splice(idx, 1);
            global_setting.api.saveConfig();
            el_row.remove();
            __sync_dom_indexes();
        });
        {
            el_row.addEventListener('dragstart', (e) => {
                var _a;
                const idx = Number(el_row.dataset.index);
                if (Number.isNaN(idx)) {
                    e.preventDefault();
                    return;
                }
                __drag_from_index = idx;
                el_row.classList.add('dragging');
                try {
                    (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', String(idx));
                }
                catch (_b) { }
                if (e.dataTransfer)
                    e.dataTransfer.effectAllowed = 'move';
            });
            el_row.addEventListener('dragend', () => {
                __drag_from_index = -1;
                el_row.classList.remove('dragging');
            });
            el_row.addEventListener('dragenter', (e) => {
                e.preventDefault();
            });
            el_row.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer)
                    e.dataTransfer.dropEffect = 'move';
                const toIndex = Number(el_row.dataset.index);
                const fromIndex = __drag_from_index;
                if (fromIndex < 0 || Number.isNaN(toIndex) || fromIndex == toIndex)
                    return;
                if (fromIndex < toIndex) {
                    el_row.classList.add('drag-over-bottom');
                }
                else {
                    el_row.classList.add('drag-over-top');
                }
            });
            el_row.addEventListener('dragleave', (_) => {
                el_row.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            el_row.addEventListener('drop', (e) => {
                e.preventDefault();
                el_row.classList.remove('drag-over-top', 'drag-over-bottom');
                const toIndex = Number(el_row.dataset.index);
                const fromIndex = __drag_from_index;
                if (Number.isNaN(toIndex))
                    return;
                if (fromIndex < 0)
                    return;
                if (fromIndex === toIndex)
                    return;
                if (fromIndex >= global_setting.config.context_menu_list.length)
                    return;
                const [moved] = global_setting.config.context_menu_list.splice(fromIndex, 1);
                global_setting.config.context_menu_list.splice(toIndex, 0, moved);
                global_setting.api.saveConfig();
                const fromRow = el_rows.querySelector(`:scope > div[data-index="${fromIndex}"]`);
                if (fromRow) {
                    el_rows.insertBefore(fromRow, (fromIndex < toIndex) ? el_row.nextSibling : el_row);
                }
                __sync_dom_indexes();
            });
        }
        return { el_row, el_row_name };
    }
}
function initSettingTab_style(tab_nav_container, tab_content_container) {
    const tab_nav = document.createElement('div');
    tab_nav_container.appendChild(tab_nav);
    tab_nav.classList.add('item');
    tab_nav.textContent = t('Style variables');
    const tab_content = document.createElement('div');
    tab_content_container.appendChild(tab_content);
    tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'custom-style');
    tab_content.setAttribute('index', 'custom-style');
    tab_nav.addEventListener('click', () => init(tab_content));
    function init(tab_content) {
        tab_content.innerHTML = '';
        {
            const buttons = document.createElement('div');
            tab_content.appendChild(buttons);
            buttons.classList.add('setting-buttons');
            const text_modi_btn = document.createElement('button');
            buttons.appendChild(text_modi_btn);
            text_modi_btn.textContent = t('Modi by text');
            text_modi_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                void initSettingTab_modiByText_refresh(global_setting.config.config_paths + 'config_css_vars.json', global_setting.config_css_vars);
            });
        }
        new SettingItem(tab_content)
            .setHeading(t('Appearance'));
        new SettingItem(tab_content)
            .setName(t('Theme'))
            .setDesc('暂时使用纯文本标识，等以后主题系统支持了再改成下拉框')
            .addText(text => text
            .setValue(global_setting.config.theme)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            document.documentElement.setAttribute('data-am-theme', value);
            global_setting.config.theme = value;
            yield global_setting.api.saveConfig();
        })));
        const isDark_by_auto = global_setting.api.getSystemIsDark();
        new SettingItem(tab_content)
            .setName(t('LightDarkMode'))
            .setDesc(t('LightDarkMode2') + (isDark_by_auto ? "Dark" : "Light"))
            .addDropdown(dropdown => {
            dropdown.addOption('auto', 'Auto');
            dropdown.addOption('light', 'Light');
            dropdown.addOption('dark', 'Dark');
            dropdown.setValue(global_setting.config.darkmode);
            dropdown.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                global_setting.config.darkmode = value;
                yield global_setting.api.saveConfig();
                init(tab_content);
            }));
        });
        new SettingItem(tab_content)
            .setHeading('CSS 变量便携编辑模块');
        new SettingItem(tab_content)
            .setDesc('(该模块开发中，暂不可用)');
        new SettingItem(tab_content)
            .setDesc('可视化修改 css 变量。\
直接修改 config_css_vars.json 文件也是一样的。\n\
避免直接修改 css 文件，避免 css 文件更新后覆盖配置。');
        const isDark = global_setting.state.isDark;
        const variables = global_setting.config_css_vars;
        for (const item of variables) {
            const setting = new SettingItem(tab_content);
            if (item.name) {
                setting.setName(item.name).setDesc(item.varName);
            }
            else {
                setting.setDesc(item.varName);
            }
            const isColor = /^(#[0-9a-fA-F]{3,8}|rgb|rgba|hsl|hsla)/.test(item.value);
            '--am-bright-color';
            if (isColor) {
                setting.addColorPicker(colorPicker => colorPicker
                    .setValue((isDark && item.darkValue) ? item.darkValue : item.value)
                    .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    if (isDark && item.darkValue)
                        item.darkValue = value;
                    else
                        item.value = value;
                    yield global_setting.api.saveConfig();
                })));
            }
            else {
                setting.addText(text => text
                    .setValue((isDark && item.darkValue) ? item.darkValue : item.value)
                    .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    if (isDark && item.darkValue)
                        item.darkValue = value;
                    else
                        item.value = value;
                    yield global_setting.api.saveConfig();
                })));
            }
        }
    }
}
function initSettingTab_configUI(tab_nav_container, tab_content_container) {
    const tab_nav = document.createElement('div');
    tab_nav_container.appendChild(tab_nav);
    tab_nav.classList.add('item');
    tab_nav.textContent = t('Config');
    const tab_content = document.createElement('div');
    tab_content_container.appendChild(tab_content);
    tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'setting-ui');
    tab_content.setAttribute('index', 'setting-ui');
    tab_nav.addEventListener('click', () => init(tab_content));
    function init(tab_content) {
        tab_content.innerHTML = '';
        {
            const buttons = document.createElement('div');
            tab_content.appendChild(buttons);
            buttons.classList.add('setting-buttons');
            const text_modi_btn = document.createElement('button');
            buttons.appendChild(text_modi_btn);
            text_modi_btn.textContent = t('Modi by text');
            text_modi_btn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                void initSettingTab_modiByText_refresh(global_setting.config.config_paths + 'config.json', global_setting.config);
            });
        }
        new SettingItem(tab_content)
            .setDesc(t('Config2'));
        new SettingItem(tab_content)
            .setHeading(t('Path config'));
        new SettingItem(tab_content)
            .setName(t('Config path'))
            .setDesc(t('Config path2'))
            .addText(text => text
            .setValue(global_setting.config.config_paths)
            .setDisabled(true));
        new SettingItem(tab_content)
            .setName(t('Dict path'))
            .setDesc(t('Dict path2'))
            .addText(text => text
            .setValue(global_setting.config.dict_paths)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.dict_paths = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Note path'))
            .setDesc(t('Note path2'))
            .addText(text => text
            .setValue(global_setting.config.note_paths)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.note_paths = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Cache path'))
            .setDesc(t('Cache path2'))
            .addText(text => text
            .setValue(global_setting.config.cache_paths)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.cache_paths = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setHeading(t('Dict config'));
        new SettingItem(tab_content)
            .setName(t('Dict online source'))
            .setDesc(t('Dict online source2'))
            .addDropdown(dropdown => {
            dropdown.addOption('gitee', 'Gitee');
            dropdown.addOption('github', 'GitHub');
            dropdown.setValue(global_setting.config.dict_online_source);
            dropdown.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                global_setting.config.dict_online_source = value;
                yield global_setting.api.saveConfig();
            }));
        });
        new SettingItem(tab_content)
            .setHeading(t('Dict index config'));
        new SettingItem(tab_content)
            .setName(t('Pinyin index'))
            .setDesc(t('Pinyin index2'))
            .addToggle(toggle => toggle
            .setValue(global_setting.config.pinyin_index)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.pinyin_index = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Pinyin first index'))
            .setDesc(t('Pinyin first index2'))
            .addToggle(toggle => toggle
            .setValue(global_setting.config.pinyin_first_index)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.pinyin_first_index = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Index engine'))
            .setDesc(t('Index engine2'))
            .addDropdown(dropdown => {
            dropdown.addOption('reverse', 'Reverse');
            dropdown.addOption('trie', 'Trie');
            dropdown.setValue(global_setting.config.search_engine);
            dropdown.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                global_setting.config.search_engine = value;
                yield global_setting.api.saveConfig();
            }));
        });
        new SettingItem(tab_content)
            .setHeading(t('Other config'));
        new SettingItem(tab_content)
            .setName(t('Show panel: preset 1'))
            .addText(text => text
            .setValue(JSON.stringify(global_setting.config.panel_preset2[0].list))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.panel_preset2[0].list = JSON.parse(value);
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Show panel: preset 2'))
            .addText(text => text
            .setValue(JSON.stringify(global_setting.config.panel_preset2[1].list))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.panel_preset2[1].list = JSON.parse(value);
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Show panel: preset 3'))
            .addText(text => text
            .setValue(JSON.stringify(global_setting.config.panel_preset2[2].list))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.panel_preset2[2].list = JSON.parse(value);
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Debug mode'))
            .setDesc(t('Debug mode2'))
            .addToggle(toggle => toggle
            .setValue(global_setting.isDebug)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.isDebug = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Auto append to contextmenu'))
            .setDesc(t('Auto append to contextmenu2'))
            .addDropdown(dropdown => {
            dropdown.addOption('disable', 'Disable');
            dropdown.addOption('right', 'Right');
            dropdown.addOption('bottom', 'Bottom');
            dropdown.addOption('both', 'Both');
            dropdown.setValue(global_setting.config.auto_append_to_contextmenu);
            dropdown.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                global_setting.config.auto_append_to_contextmenu = value;
                yield global_setting.api.saveConfig();
            }));
        });
        new SettingItem(tab_content)
            .setName(t('Auto show toolbar on select'))
            .setDesc(t('Auto show toolbar on select2'))
            .addToggle(toggle => toggle
            .setValue(global_setting.config.auto_show_toolbar_on_select)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            global_setting.config.auto_show_toolbar_on_select = value;
            yield global_setting.api.saveConfig();
        })));
        new SettingItem(tab_content)
            .setName(t('Server port'))
            .setDesc(t('Server port2'))
            .addText(text => text
            .setType('number')
            .setValue(String(global_setting.config.server_port))
            .onChange((value, el) => __awaiter(this, void 0, void 0, function* () {
            const port = Number(value);
            if (Number.isNaN(port) || port <= 0 || port >= 65536) {
                el.value = String(global_setting.config.server_port);
                console.error('Invalid port number ' + port + ', reset to', global_setting.config.server_port);
                global_setting.api.notify('Invalid port number: ' + port);
                return;
            }
            global_setting.config.server_port = port;
            yield global_setting.api.saveConfig();
        })));
        if (global_setting.platform === 'app') {
            new SettingItem(tab_content)
                .setHeading(t('App config'));
            new SettingItem(tab_content)
                .setName(t('Send text method'))
                .setDesc(t('Send text method2'))
                .addDropdown(dropdown => {
                dropdown.addOption('clipboard', 'Clipboard');
                dropdown.addOption('keyboard', 'Keyboard');
                dropdown.addOption('auto', 'Auto');
                dropdown.setValue(global_setting.config.send_text_method);
                dropdown.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    global_setting.config.send_text_method = value;
                    yield global_setting.api.saveConfig();
                }));
            });
            new SettingItem(tab_content)
                .setName(t('Is use ad shortcut'))
                .setDesc(t('Is use ad shortcut2'))
                .addToggle(toggle => toggle
                .setValue(global_setting.config.app_ad_shortcut)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                global_setting.config.app_ad_shortcut = value;
                yield global_setting.api.saveConfig();
            })));
        }
    }
}
function initSettingTab_modiByText(tab_nav_container, tab_content_container) {
    const tab_nav = document.createElement('div');
    tab_nav_container.appendChild(tab_nav);
    tab_nav.classList.add('item');
    tab_nav.textContent = t('Modi config files');
    const tab_content = document.createElement('div');
    tab_content_container.appendChild(tab_content);
    tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'setting-modi-files');
    tab_content.setAttribute('index', 'setting-modi-files');
    initSettingTab_modiByText_el = tab_nav;
    if (initSettingTab_modiByText_span)
        return;
    initSettingTab_modiByText_span = document.createElement('span');
    tab_content.appendChild(initSettingTab_modiByText_span);
    initSettingTab_modiByText_span.innerText = 'There are currently no files.';
    if (initSettingTab_modiByText_textarea)
        return;
    initSettingTab_modiByText_textarea = document.createElement('textarea');
    tab_content.appendChild(initSettingTab_modiByText_textarea);
}
let initSettingTab_modiByText_el;
let initSettingTab_modiByText_span;
let initSettingTab_modiByText_textarea;
function initSettingTab_modiByText_refresh(file_path, bindObj) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!initSettingTab_modiByText_el)
            return;
        if (!initSettingTab_modiByText_span)
            return;
        if (!initSettingTab_modiByText_textarea)
            return;
        const textarea = initSettingTab_modiByText_textarea;
        initSettingTab_modiByText_el.click();
        initSettingTab_modiByText_span.innerText = file_path;
        textarea.value = 'Loading...';
        let file_content = yield global_setting.api.readFile(file_path);
        if (!file_content) {
            textarea.value = 'Error: Load config failed';
            return;
        }
        textarea.value = file_content;
        textarea.oninput = (_) => __awaiter(this, void 0, void 0, function* () {
            const value = textarea.value;
            if (value === file_content) {
                textarea.classList.remove('no-save');
                textarea.classList.remove('error-save');
            }
            else {
                textarea.classList.add('no-save');
                textarea.classList.remove('error-save');
            }
        });
        textarea.onchange = (_) => __awaiter(this, void 0, void 0, function* () {
            const value = textarea.value;
            if (bindObj) {
                try {
                    const obj = JSON.parse(value);
                    Object.assign(bindObj, obj);
                }
                catch (e) {
                    textarea.classList.remove('no-save');
                    textarea.classList.add('error-save');
                    console.error('Save config error: invalid json format', e);
                    return;
                }
            }
            textarea.classList.remove('no-save');
            textarea.classList.remove('error-save');
            file_content = value;
            yield global_setting.api.writeFile(file_path, value);
        });
    });
}
const SVG_ICON_GRIP = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-icon lucide-grip">
  <circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="5" r="1"/>
  <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  <circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="19" r="1"/>
</svg>`;
const SVG_ICON_DELETE = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash">
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
  <path d="M3 6h18"/>
  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</svg>`;
const SVG_ICON_ADD = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
  <path d="M5 12h14"/>
  <path d="M12 5v14"/>
</svg>`;
const SVG_ICON_REFRESH = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw-icon lucide-refresh-cw">
  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
</svg>`;
function json2table(container, data, data_header) {
    container.innerHTML = '';
    container.dataset.viewmode = 'table';
    const table = document.createElement('table');
    container.appendChild(table);
    table.classList.add('dataview-table');
    const table_thead = document.createElement('thead');
    table.appendChild(table_thead);
    const tr = document.createElement('tr');
    table_thead.appendChild(tr);
    for (const header_item of data_header) {
        const td = document.createElement('td');
        tr.appendChild(td);
        td.textContent = header_item.name;
    }
    const table_tbody = document.createElement('tbody');
    table.appendChild(table_tbody);
    data.forEach(item => {
        const tr = document.createElement('tr');
        table_tbody.appendChild(tr);
        tr.setAttribute('target-id', item.id);
        for (const header_item of data_header) {
            const td = document.createElement('td');
            tr.appendChild(td);
            header_item.callback(td, item);
        }
    });
}
function json2card(container, data, data_header) {
    container.innerHTML = '';
    container.dataset.viewmode = 'card';
    const div = document.createElement('div');
    container.appendChild(div);
    div.classList.add('dataview-card');
    data.forEach(item => {
        const card = document.createElement('div');
        div.appendChild(card);
        card.classList.add('card');
        for (const header_item of data_header) {
            const card_content = document.createElement('span');
            const ret = header_item.callback(card_content, item);
            if (ret) {
                const card_item = document.createElement('div');
                card.appendChild(card_item);
                const card_span = document.createElement('span');
                card_item.appendChild(card_span);
                card_item.appendChild(card_content);
                if (header_item.name == t('Name')) {
                    card_item.classList.add('name');
                }
                else if (header_item.name == t('Uninstall')) {
                    card_item.classList.add('uninstall');
                }
                else if (header_item.name == t('Is enabled')) {
                    card_item.classList.add('isenabled');
                }
                else if (header_item.name == t('Is downloaded')) {
                    card_item.classList.add('isdownload');
                }
                else if (header_item.name == t('Description')) { }
                else {
                    card_span.innerText = header_item.name + ': ';
                }
            }
        }
    });
}
