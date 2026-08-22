import { global_setting } from '../../shared/setting';
import { AbsAmPanel } from '../abs';
export * from '../contextmenu/index';
export * from '../search/index';
import { AMSearch } from '../search/index';
import { AMToolbar } from '../toolbar/index';
import { AMContextMenu } from '../contextmenu/index';
import { AMMiniEditor } from '../miniEditor/index';
import { AMPin } from './pin/index';
import { AMTitlebar } from './titlebar';
import { AMDebug } from '../debug';
export let activeAMPanel = null;
const amPanel_list = [];
export class AMPanel extends AbsAmPanel {
    static factory(p_el) {
        if (activeAMPanel) {
            console.error('临时调试: 当前创建了多个 AMPanel 实例。首个实例目前会存在引用丢失');
        }
        const amPanel = new AMPanel(p_el);
        activeAMPanel = amPanel;
        amPanel_list.push(amPanel);
        amPanel.initSubPanels();
        return amPanel;
    }
    constructor(p_el) {
        const el = document.createElement('div');
        p_el.appendChild(el);
        el.classList.add('am-panel');
        super(el, p_el, null);
        this.sub_panels = {
            amTitlebar: null,
            amPin: null,
            amSearch: null,
            amToolbar: null,
            amContextMenu: null,
            amMiniEditor: null,
            amDebug: null,
            amCustom: null,
        };
        this.state = {
            alt_virtual_flag: false,
            alt_key_flag: false,
            show_panel_list: [],
        };
        this.custom_sub_panel = {};
        this.visual_listener_mousedown = (ev) => {
            if (!(ev.target instanceof Element))
                return;
            if (global_setting.platform == 'app') {
                if (ev.target.matches('.am-panel *') || ev.target.closest('.windows-pin'))
                    return;
                global_setting.other.app_hide(undefined, true);
            }
            else {
                if (ev.target.matches('.am-panel *'))
                    return;
                this.panel_hide();
            }
        };
        this.visual_listener_keydown = (ev) => {
            if (ev.key === 'Escape') {
                ev.preventDefault();
                if (global_setting.platform == 'app') {
                    global_setting.other.app_hide(undefined, true);
                }
                else {
                    this.panel_hide();
                }
                return;
            }
        };
        el.classList.add('am-hide');
    }
    initSubPanels() {
        var _a, _b;
        const el = this.el;
        const sub_panels = this.sub_panels;
        sub_panels.amTitlebar = AMTitlebar.factory(this);
        if (!sub_panels.amSearch) {
            sub_panels.amSearch = AMSearch.factory(this);
        }
        if (!sub_panels.amToolbar) {
            sub_panels.amToolbar = AMToolbar.factory(this);
        }
        if (!sub_panels.amContextMenu) {
            sub_panels.amContextMenu = AMContextMenu.factory(this, undefined, (_b = (_a = sub_panels.amSearch) === null || _a === void 0 ? void 0 : _a.el_input) !== null && _b !== void 0 ? _b : undefined);
        }
        if (!sub_panels.amMiniEditor) {
            sub_panels.amMiniEditor = AMMiniEditor.factory(this);
        }
        if (!sub_panels.amDebug) {
            sub_panels.amDebug = AMDebug.factory(this);
        }
        if (!sub_panels.amCustom) {
            sub_panels.amCustom = document.createElement('div');
            el.appendChild(sub_panels.amCustom);
            sub_panels.amCustom.classList.add('am-custom-panel');
        }
        {
            sub_panels.amPin = AMPin.factory(this, this);
            sub_panels.amPin.el.classList.add('am-panel-out');
        }
        {
            el.addEventListener('keydown', (ev) => {
                if (ev.key === 'Alt') {
                    this.state.alt_key_flag = false;
                    ev.preventDefault();
                    el.classList.add('show-altkey');
                }
                if (ev.altKey) {
                    if (ev.key != 'Alt')
                        this.state.alt_key_flag = true;
                }
            });
            el.addEventListener('keyup', (ev) => {
                if (ev.key === 'Alt') {
                    if (this.state.alt_key_flag) {
                        this.state.alt_key_flag = false;
                        this.state.alt_virtual_flag = false;
                        ev.preventDefault();
                    }
                    else {
                        this.state.alt_virtual_flag = !this.state.alt_virtual_flag;
                    }
                    if (this.state.alt_virtual_flag) {
                        ev.preventDefault();
                        el.classList.add('show-altkey');
                    }
                    else {
                        ev.preventDefault();
                        el === null || el === void 0 ? void 0 : el.classList.remove('show-altkey');
                    }
                }
            });
        }
    }
    destroy() {
        activeAMPanel = null;
        const index = amPanel_list.indexOf(this);
        if (index !== -1) {
            amPanel_list.splice(index, 1);
        }
    }
    panel_show(pos, append_list, is_focus = true, is_show_container = true) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        {
            if (pos === undefined) {
            }
            else if (global_setting.platform == 'app') {
                if (!pos.is_reverse) {
                    ;
                    this.el['sty' + 'le'].left = `0px`;
                    this.el['sty' + 'le'].top = `0px`;
                    this.el['sty' + 'le'].bottom = 'unset';
                    this.el.classList.remove('am-reverse');
                }
                else {
                    ;
                    this.el['sty' + 'le'].left = `0px`;
                    this.el['sty' + 'le'].top = 'unset';
                    this.el['sty' + 'le'].bottom = `0px`;
                    this.el.classList.add('am-reverse');
                }
            }
            else {
                ;
                this.el['sty' + 'le'].left = `${pos.x}px`;
                this.el['sty' + 'le'].top = `${pos.y}px`;
                this.el['sty' + 'le'].bottom = 'unset';
                if (!pos.is_reverse) {
                    ;
                    this.el['sty' + 'le'].transform = `translate(0, 0)`;
                    this.el.classList.remove('am-reverse');
                }
                else {
                    ;
                    this.el['sty' + 'le'].transform = `translate(0, -100%)`;
                    this.el.classList.add('am-reverse');
                }
            }
        }
        {
            if (!append_list) {
                if (this.state.show_panel_list.length === 0) {
                    this.state.show_panel_list = global_setting.config.panel_preset2[0].list;
                }
                append_list = this.state.show_panel_list;
            }
            else {
                for (const item of append_list) {
                    if (this.state.show_panel_list.includes(item))
                        continue;
                    this.state.show_panel_list.push(item);
                }
            }
        }
        {
            activeAMPanel = this;
            this.state.alt_key_flag = true;
        }
        if (is_show_container) {
            this.el.classList.remove('am-hide');
        }
        let is_focued = !is_focus;
        for (const item of append_list) {
            if (item == 'search') {
                (_a = this.sub_panels.amSearch) === null || _a === void 0 ? void 0 : _a.panel_show(!is_focued);
                is_focued = true;
            }
            else if (item == 'toolbar') {
                (_b = this.sub_panels.amToolbar) === null || _b === void 0 ? void 0 : _b.panel_show();
            }
            else if (item == 'menu') {
                (_c = this.sub_panels.amContextMenu) === null || _c === void 0 ? void 0 : _c.panel_show();
            }
            else if (item == 'miniEditor') {
                (_d = this.sub_panels.amMiniEditor) === null || _d === void 0 ? void 0 : _d.set_flag('miniEditor');
                (_e = this.sub_panels.amMiniEditor) === null || _e === void 0 ? void 0 : _e.panel_show(global_setting.state.selectedText, !is_focued);
                is_focued = true;
            }
            else if (item == 'info') {
                (_f = this.sub_panels.amMiniEditor) === null || _f === void 0 ? void 0 : _f.set_flag('info');
                (_g = this.sub_panels.amMiniEditor) === null || _g === void 0 ? void 0 : _g.panel_show(global_setting.state.infoText, !is_focued);
                is_focued = true;
                global_setting.api.getInfo().then((info_text) => {
                    var _a;
                    global_setting.state.infoText += '[info]\n' + (info_text !== null && info_text !== void 0 ? info_text : "null") + "\n\n";
                    (_a = this.sub_panels.amMiniEditor) === null || _a === void 0 ? void 0 : _a.panel_show(global_setting.state.infoText, false);
                });
            }
            else if (item == 'debug') {
                (_h = this.sub_panels.amDebug) === null || _h === void 0 ? void 0 : _h.panel_show();
            }
            else {
                const target_custom_el = (_j = this.custom_sub_panel) === null || _j === void 0 ? void 0 : _j[item];
                if (target_custom_el)
                    target_custom_el.classList.remove('am-hide');
                else
                    console.warn(`No sub panel found for item ${item}. Please confirm if the panel has been registered.`);
            }
        }
        window.removeEventListener('mousedown', this.visual_listener_mousedown);
        window.removeEventListener('keydown', this.visual_listener_keydown);
        window.addEventListener('mousedown', this.visual_listener_mousedown);
        window.addEventListener('keydown', this.visual_listener_keydown);
    }
    panel_hide(list, focusHide = false, is_hide_container = true) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (global_setting.state.isPin && !focusHide) {
            if (!list || list.length === 0) {
                this.el.blur();
                return;
            }
        }
        window.removeEventListener('mousedown', this.visual_listener_mousedown);
        window.removeEventListener('keydown', this.visual_listener_keydown);
        {
            if (list == undefined) {
                this.state.show_panel_list = [];
            }
            else {
                for (const item of list) {
                    const index = this.state.show_panel_list.indexOf(item);
                    if (index !== -1) {
                        this.state.show_panel_list.splice(index, 1);
                    }
                }
            }
        }
        if (is_hide_container) {
            this.el.classList.add('am-hide');
        }
        if (list == undefined) {
            (_a = this.sub_panels.amSearch) === null || _a === void 0 ? void 0 : _a.panel_hide();
            (_b = this.sub_panels.amToolbar) === null || _b === void 0 ? void 0 : _b.panel_hide();
            (_c = this.sub_panels.amContextMenu) === null || _c === void 0 ? void 0 : _c.panel_hide();
            (_d = this.sub_panels.amMiniEditor) === null || _d === void 0 ? void 0 : _d.panel_hide();
            (_e = this.sub_panels.amDebug) === null || _e === void 0 ? void 0 : _e.panel_hide();
            for (const key in this.custom_sub_panel) {
                this.custom_sub_panel[key].classList.add('am-hide');
            }
        }
        else {
            for (const item of list) {
                if (item == 'search')
                    (_f = this.sub_panels.amSearch) === null || _f === void 0 ? void 0 : _f.panel_hide();
                else if (item == 'toolbar')
                    (_g = this.sub_panels.amToolbar) === null || _g === void 0 ? void 0 : _g.panel_hide();
                else if (item == 'menu')
                    (_h = this.sub_panels.amContextMenu) === null || _h === void 0 ? void 0 : _h.panel_hide();
                else if (item == 'miniEditor')
                    (_j = this.sub_panels.amMiniEditor) === null || _j === void 0 ? void 0 : _j.panel_hide();
                else if (item == 'info')
                    (_k = this.sub_panels.amMiniEditor) === null || _k === void 0 ? void 0 : _k.panel_hide();
                else if (item == 'debug')
                    (_l = this.sub_panels.amDebug) === null || _l === void 0 ? void 0 : _l.panel_hide();
                else {
                    for (const key in this.custom_sub_panel) {
                        if (key == item) {
                            this.custom_sub_panel[key].classList.add('am-hide');
                            break;
                        }
                    }
                }
            }
            return;
        }
    }
    panel_toggle(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const index = this.state.show_panel_list.indexOf(item);
        if (index !== -1) {
            this.state.show_panel_list.splice(index, 1);
        }
        else {
            this.state.show_panel_list.push(item);
        }
        if (item == 'search')
            (_a = this.sub_panels.amSearch) === null || _a === void 0 ? void 0 : _a.panel_toggle();
        else if (item == 'toolbar')
            (_b = this.sub_panels.amToolbar) === null || _b === void 0 ? void 0 : _b.panel_toggle();
        else if (item == 'menu')
            (_c = this.sub_panels.amContextMenu) === null || _c === void 0 ? void 0 : _c.panel_toggle();
        else if (item == 'miniEditor') {
            (_d = this.sub_panels.amMiniEditor) === null || _d === void 0 ? void 0 : _d.set_flag('miniEditor');
            (_e = this.sub_panels.amMiniEditor) === null || _e === void 0 ? void 0 : _e.panel_toggle();
        }
        else if (item == 'info') {
            (_f = this.sub_panels.amMiniEditor) === null || _f === void 0 ? void 0 : _f.set_flag('info');
            (_g = this.sub_panels.amMiniEditor) === null || _g === void 0 ? void 0 : _g.panel_toggle();
        }
        else if (item == 'debug')
            (_h = this.sub_panels.amDebug) === null || _h === void 0 ? void 0 : _h.panel_toggle();
        else {
            const target_custom_el = this.custom_sub_panel[item];
            if (!target_custom_el) {
                console.warn(`No sub panel found for item ${item}. Please confirm if the panel has been registered.`);
                return;
            }
            if (target_custom_el.classList.contains('am-hide')) {
                target_custom_el.classList.remove('am-hide');
            }
            else {
                target_custom_el.classList.add('am-hide');
            }
        }
    }
    register_sub_panel(id, el) {
        var _a, _b;
        if (this.custom_sub_panel[id]) {
            console.warn(`SubPanel with id ${id} already exists. It will be replaced.`);
            this.custom_sub_panel[id].remove();
        }
        if (typeof el === 'function') {
            const container = document.createElement('div');
            container.classList.add(`am-sub-panel-${id}`);
            this.custom_sub_panel[id] = container;
            (_a = this.sub_panels.amCustom) === null || _a === void 0 ? void 0 : _a.appendChild(container);
            el(container);
        }
        else {
            this.custom_sub_panel[id] = el;
            (_b = this.sub_panels.amCustom) === null || _b === void 0 ? void 0 : _b.appendChild(el);
        }
    }
    unregister_sub_panel(id) {
        if (!this.custom_sub_panel[id]) {
            console.warn(`SubPanel with id ${id} does not exist.`);
            return;
        }
        this.custom_sub_panel[id].remove();
        delete this.custom_sub_panel[id];
    }
    get_size(append_list) {
        const list = [...this.state.show_panel_list];
        {
            const append_list2 = append_list !== null && append_list !== void 0 ? append_list : [];
            if (!append_list2) { }
            else {
                for (const item of append_list2) {
                    if (list.includes(item))
                        continue;
                    list.push(item);
                }
            }
        }
        const isSameList = this.state.show_panel_list.length === list.length &&
            list.every((item, index) => item === this.state.show_panel_list[index]);
        if (isSameList) {
            if (activeAMPanel) {
                const rect = activeAMPanel.el.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                if (width > 0 && height > 0) {
                    return { width, height };
                }
            }
        }
        let width_list = [0];
        let height = 0;
        let min_height = 0;
        for (const item of list) {
            if (item == 'search') {
                height += 32;
                width_list.push(500);
                min_height = min_height > height + 260 ? min_height : height + 260;
            }
            else if (item == 'menu') {
                height += 248;
            }
            else if (item == 'miniEditor') {
                height += 276;
            }
            else if (item == 'info') {
                height += 276;
            }
            else if (item == 'debug') {
                height += 300;
            }
            else if (item == 'toolbar') {
                height += 32;
            }
            else {
                continue;
            }
        }
        if (height < min_height) {
            height = min_height;
        }
        const width = Math.max(...width_list);
        return { width, height };
    }
    fix_position(screen_size, panel_size, selection_rect, mode = "side", x_dire = "right", y_dire = "bottom") {
        const side_gap = 4;
        selection_rect = {
            left: selection_rect.left - 2,
            top: selection_rect.top - 2,
            right: selection_rect.right + 2,
            bottom: selection_rect.bottom + 2
        };
        const target_pos = { x: -1, y: -1 };
        const panel_rect = { left: -1, top: -1, right: -1, bottom: -1 };
        {
            if (x_dire == "center") {
                target_pos.x = selection_rect.right - panel_size.width / 2;
                panel_rect.left = target_pos.x;
                panel_rect.right = target_pos.x + panel_size.width;
            }
            else {
                target_pos.x = selection_rect.right;
                panel_rect.left = target_pos.x;
                panel_rect.right = target_pos.x + panel_size.width;
            }
            if (y_dire == "top") {
                target_pos.y = selection_rect.top;
                panel_rect.top = target_pos.y - panel_size.height;
                panel_rect.bottom = target_pos.y;
            }
            else {
                target_pos.y = selection_rect.bottom;
                panel_rect.top = target_pos.y;
                panel_rect.bottom = target_pos.y + panel_size.height;
            }
        }
        {
            if (panel_rect.bottom > screen_size.height) {
                if (mode == "side") {
                    y_dire = "bottom";
                    target_pos.y = screen_size.height - side_gap - panel_size.height;
                }
                else {
                    y_dire = "top";
                    target_pos.y = selection_rect.top;
                }
            }
            if (panel_rect.top < 0) {
                if (mode == "side") {
                    y_dire = "top";
                    target_pos.y = side_gap + panel_size.height;
                }
                else {
                    y_dire = "bottom";
                    target_pos.y = side_gap;
                }
            }
            if (panel_rect.right > screen_size.width) {
                if (mode == "side") {
                    target_pos.x = screen_size.width - side_gap - panel_size.width;
                }
                else {
                    target_pos.x = selection_rect.left - panel_size.width;
                }
            }
            if (panel_rect.left < 0) {
                if (mode == "side") {
                    target_pos.x = side_gap;
                }
                else {
                    target_pos.x = target_pos.x + panel_size.width;
                }
            }
        }
        return { x: target_pos.x, y: target_pos.y, is_reverse: y_dire == "top" };
    }
    static fix_position_when_move(screen_size, panel_size, target_pos) {
        const maxX = screen_size.width - panel_size.width - 26;
        const minX = -panel_size.width;
        const maxY = screen_size.height - 26;
        const minY = 0;
        target_pos.x = Math.max(minX, Math.min(target_pos.x, maxX));
        target_pos.y = Math.max(minY, Math.min(target_pos.y, maxY));
        return target_pos;
    }
}
