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
import { SEARCH_DB, SEARCH_DB_img } from "./SearchDB";
import { activeAMPanel } from "../MulPanel/index";
import { PLUGIN_MANAGER, PluginManager } from "../../modules/pluginManager/PluginManager";
export class AMSuggestion {
    static factory(el_input, el_input_parent) {
        const amSuggestion = new AMSuggestion();
        el_input_parent.appendChild(amSuggestion.el_suggestion);
        amSuggestion.bind_input(el_input);
        return amSuggestion;
    }
    constructor() {
        this.currentFocus = -1;
        const el_suggestion = document.createElement('div');
        this.el_suggestion = el_suggestion;
        el_suggestion.classList.add('am-search-suggestion');
        this.panel_hide();
    }
    panel_show() {
        const el_suggestion = this.el_suggestion;
        el_suggestion.innerHTML = '';
        el_suggestion.classList.remove('am-hide');
    }
    panel_hide() {
        const el_suggestion = this.el_suggestion;
        el_suggestion.innerHTML = '';
        el_suggestion.classList.add('am-hide');
    }
    bind_input(el_input) {
        const el_suggestion = this.el_suggestion;
        let search_result = [];
        el_input.addEventListener('input', (ev) => __awaiter(this, void 0, void 0, function* () {
            const target = ev.target;
            search_result = yield this.search(el_suggestion, target.value);
            const el_items = el_suggestion.querySelectorAll(":scope>div.item");
            this.vFocus_update(el_items, '0');
        }));
        el_input.addEventListener('keydown', (ev) => {
            if (el_input.value.trim() === '') {
                this.panel_hide();
                return;
            }
            let el_items = el_suggestion.querySelectorAll(":scope>div.item");
            if (!el_items || el_items.length == 0)
                return;
            if (ev.key == 'ArrowDown') {
                this.vFocus_update(el_items, 'down');
            }
            else if (ev.key == 'ArrowUp') {
                this.vFocus_update(el_items, 'up');
            }
            else if (ev.key == 'Enter') {
                if (this.currentFocus > -1) {
                    ev.preventDefault();
                    el_items[this.currentFocus].click();
                }
            }
            else if (ev.key == 'Tab') {
                if (this.currentFocus > -1) {
                    ev.preventDefault();
                    if (search_result.length)
                        el_input.value = search_result[this.currentFocus].value;
                }
            }
            else if (ev.altKey || (activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.state.alt_virtual_flag)) {
                let index = -1;
                if (ev.key >= '1' && ev.key <= '9') {
                    index = parseInt(ev.key) - 1;
                }
                else if (ev.key == '0') {
                    index = 9;
                }
                else if (ev.key >= 'a' && ev.key <= 'z') {
                    index = ev.key.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
                }
                if (index == -1)
                    return;
                if (index > el_items.length - 1)
                    return;
                const target_el = el_items[index];
                if (!target_el)
                    return;
                ev.preventDefault();
                ev.stopPropagation();
                if (activeAMPanel) {
                    activeAMPanel.state.alt_virtual_flag = false;
                    activeAMPanel.el.classList.remove('show-altkey');
                }
                target_el.click();
            }
        });
    }
    vFocus_update(list, flag) {
        if (flag === '0')
            this.currentFocus = 0;
        else if (flag === 'down')
            this.currentFocus++;
        else if (flag === 'up')
            this.currentFocus--;
        else if (flag === 'clean')
            this.currentFocus = -1;
        else
            throw new Error("unreachable");
        if (!list || list.length == 0)
            return false;
        removeVFocus(list);
        if (flag === 'clean')
            return;
        if (this.currentFocus >= list.length)
            this.currentFocus = 0;
        if (this.currentFocus < 0)
            this.currentFocus = (list.length - 1);
        list[this.currentFocus].classList.add("focus-active");
        list[this.currentFocus].scrollIntoView({ block: 'nearest' });
        function removeVFocus(list) {
            for (let i = 0; i < list.length; i++) {
                list[i].classList.remove("focus-active");
            }
        }
    }
    search(el_suggestion, query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (el_suggestion == null)
                return [];
            if (query.endsWith('.jpg') || query.endsWith('.jpeg') || query.endsWith('.png') || query.endsWith('.gif')) {
                el_suggestion.classList.add('img-mode');
                return yield this.search_img(el_suggestion, query.slice(0, -4));
            }
            else if (query.startsWith(' ')) {
                el_suggestion.classList.add('img-mode');
                return yield this.search_img(el_suggestion, query.trimStart());
            }
            else {
                el_suggestion.classList.remove('img-mode');
            }
            let result = SEARCH_DB.query(query);
            if (result.length === 0) {
                this.panel_hide();
                return [];
            }
            this.panel_show();
            let alt_key_index = 0;
            for (const item of result) {
                let alt_key_key = '';
                if (alt_key_index < 9) {
                    alt_key_key = (alt_key_index + 1).toString();
                }
                else if (alt_key_index == 9) {
                    alt_key_key = "0";
                }
                else if (alt_key_index < 36) {
                    alt_key_key = String.fromCharCode(97 + alt_key_index - 10);
                }
                alt_key_index++;
                const div = document.createElement('div');
                el_suggestion.appendChild(div);
                div.classList.add('item');
                div.setAttribute('data-altkey', alt_key_key);
                const div_value = document.createElement('div');
                div.appendChild(div_value);
                div_value.classList.add('value');
                div_value.textContent = item.value;
                const div_key = document.createElement('div');
                div.appendChild(div_key);
                div_key.classList.add('key');
                div_key.textContent = item.key;
                div.onclick = () => {
                    var _a;
                    if (item.value.startsWith('@am-script: ')) {
                        const script_id = item.value.substring('@am-script: '.length);
                        (_a = PLUGIN_MANAGER.plugin_list[script_id]) === null || _a === void 0 ? void 0 : _a.run(PluginManager.getPluginRunCtx(item.key));
                        this.panel_hide();
                    }
                    else {
                        void global_setting.api.sendText(item.value);
                        this.panel_hide();
                    }
                };
            }
            return result;
        });
    }
    search_img(el_suggestion, query) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = SEARCH_DB_img.query(query);
            if (result.length === 0) {
                this.panel_hide();
                return [];
            }
            this.panel_show();
            let alt_key_index = 0;
            for (const item of result) {
                let alt_key_key = '';
                if (alt_key_index < 9) {
                    alt_key_key = (alt_key_index + 1).toString();
                }
                else if (alt_key_index == 9) {
                    alt_key_key = "0";
                }
                else if (alt_key_index < 36) {
                    alt_key_key = String.fromCharCode(97 + alt_key_index - 10);
                }
                alt_key_index++;
                let img_src = item.value;
                if (global_setting.platform === 'app') {
                    img_src = yield global_setting.other.app_convertFileSrc(img_src);
                }
                const div = document.createElement('div');
                el_suggestion.appendChild(div);
                div.classList.add('item');
                div.setAttribute('data-altkey', alt_key_key);
                const div_img = document.createElement('img');
                div.appendChild(div_img);
                div_img.classList.add('img');
                div_img.src = img_src;
                div_img.alt = item.value;
                const div_key = document.createElement('div');
                div.appendChild(div_key);
                div_key.classList.add('key');
                div_key.textContent = item.key;
                div.title = item.key + '\n\n' + item.value;
                div.onclick = () => __awaiter(this, void 0, void 0, function* () {
                    global_setting.api.sendText(item.value, 'IMG_MODE');
                    this.panel_hide();
                });
            }
            return result;
        });
    }
}
