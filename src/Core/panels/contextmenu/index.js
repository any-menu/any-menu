import { global_setting } from "../../shared/setting";
import { input_suggestion } from "./suggestion_old";
import { activeAMPanel } from "../MulPanel/index";
import { init_item } from "../shared/PanelItem";
import { AbsAmPanel } from "../abs";
export const all_append_data = [];
export class AMContextMenu extends AbsAmPanel {
    static factory(p_panel, menuItems, el_input) {
        const abContextMenu = new AMContextMenu(p_panel, menuItems);
        if (el_input)
            abContextMenu.vFocus_bind_arrowKeyArea(el_input);
        return abContextMenu;
    }
    constructor(p_panel, menuItems) {
        const el = document.createElement('div');
        p_panel.el.appendChild(el);
        el.classList.add('am-context-menu', 'root-menu');
        super(el, p_panel.el, p_panel);
        this.menu_el_data_root = { el: null, parent: null, children: [], vFocus_index: -1 };
        this.menu_el_data_current = this.menu_el_data_root;
        this.panel_hide();
        window.addEventListener('mousedown', (ev) => {
            if (this.el.contains(ev.target))
                return;
            if (ev.button != 2)
                return;
            ev.preventDefault();
        });
        if (menuItems)
            this.append_data(menuItems);
    }
    panel_show() {
        this.el.classList.remove('am-hide');
        this.el.classList.add('visible');
        this.el.classList.remove('show-altkey');
        this.menu_el_data_root.el = null;
        this.menu_el_data_current = this.menu_el_data_root;
        this.vFocus_update('clean');
    }
    panel_hide() {
        this.el.classList.add('am-hide');
        this.el.classList.remove('visible');
        this.vFocus_update('clean');
    }
    panel_toggle() {
        if (this.el.classList.contains('am-hide')) {
            this.panel_show();
        }
        else {
            this.panel_hide();
        }
    }
    append_data(menuItems) {
        all_append_data.push(...menuItems);
        AMContextMenu.li_list(this.el, menuItems, this.menu_el_data_root, true);
    }
    static li_list(ul, menuItems, current_node, is_root = false) {
        let sub_node;
        let alt_key_index = current_node.children.length;
        menuItems.forEach((item) => {
            var _a;
            if (is_root) {
                if (global_setting.config.context_menu_list.length == 0) { }
                else if (global_setting.config.context_menu_list.includes(item.label)) {
                    const index = global_setting.config.context_menu_list.indexOf(item.label);
                    item.order = index;
                }
                else {
                    return;
                }
            }
            let alt_key_key = get_alt_key_key(alt_key_index);
            function get_alt_key_key(alt_key_index) {
                if (alt_key_index < 9) {
                    return (alt_key_index + 1).toString();
                }
                else if (alt_key_index == 9) {
                    return "0";
                }
                else if (alt_key_index < 36) {
                    return String.fromCharCode(97 + alt_key_index - 10);
                }
                else
                    return "";
            }
            alt_key_index++;
            const li = document.createElement('li');
            li.classList.add('am-context-menu-item');
            sub_node = { el: li, parent: current_node, children: [], vFocus_index: -1 };
            current_node.children.push(sub_node);
            if (is_root) {
                const order = (_a = item.order) !== null && _a !== void 0 ? _a : 1000;
                li.dataset.order = order.toString();
                let inserted = false;
                for (const child of Array.from(ul.children)) {
                    const childOrderAttr = child.dataset.order;
                    const childOrder = childOrderAttr !== undefined ? parseInt(childOrderAttr, 10) : 1000;
                    if (childOrder > order) {
                        ul.insertBefore(li, child);
                        inserted = true;
                        break;
                    }
                }
                if (inserted) {
                    for (let alt_key_index = 0; alt_key_index < ul.children.length; alt_key_index++) {
                        const child = ul.children[alt_key_index];
                        child.setAttribute('data-altkey', get_alt_key_key(alt_key_index));
                    }
                }
                else {
                    ul.appendChild(li);
                    li.setAttribute('data-altkey', alt_key_key);
                }
            }
            else {
                ul.appendChild(li);
                li.setAttribute('data-altkey', alt_key_key);
            }
            void init_item(undefined, li, item, 'label');
            if (item.children) {
                li.classList.add('has-children');
                const li_ul = document.createElement('div');
                li.appendChild(li_ul);
                li_ul.classList.add('am-context-menu', 'sub-menu');
                AMContextMenu.li_list(li_ul, item.children, sub_node);
                li.addEventListener('mouseenter', () => {
                    li_ul.classList.add('visible');
                });
                li.addEventListener('mouseleave', () => {
                    li_ul.classList.remove('visible');
                });
            }
        });
    }
    append_el(el) {
        this.el.appendChild(el);
    }
    append_headerEditor(header_old, header_callback) {
        const header_r = document.createElement('div');
        header_r.classList.add('am-context-menu-header');
        const header_span = document.createElement('span');
        header_r.appendChild(header_span);
        header_span.classList.add('left');
        header_span.textContent = 'header: ';
        const header_input = document.createElement('input');
        header_r.appendChild(header_input);
        header_input.value = header_old;
        input_suggestion(header_input, header_r);
        header_input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                header_callback(header_input.value);
                this.panel_hide();
            }
        });
        this.append_el(header_r);
    }
    vFocus_bind_arrowKeyArea(el_input) {
        el_input.addEventListener('keydown', (ev) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            if (el_input.value.trim() != '') {
                return;
            }
            if (!this.menu_el_data_current.el)
                this.menu_el_data_current.el = this.el;
            if (!this.menu_el_data_current.el)
                return;
            if (ev.key == 'ArrowDown') {
                this.vFocus_update('down');
            }
            else if (ev.key == 'ArrowUp') {
                this.vFocus_update('up');
            }
            else if (ev.key == 'ArrowRight') {
                const mouseEvent = new MouseEvent('mouseenter', {
                    cancelable: true,
                    view: window,
                });
                (_b = (_a = this.menu_el_data_current.children[this.menu_el_data_current.vFocus_index]) === null || _a === void 0 ? void 0 : _a.el) === null || _b === void 0 ? void 0 : _b.dispatchEvent(mouseEvent);
                const menu_el_data_next = this.menu_el_data_current.children[this.menu_el_data_current.vFocus_index];
                if (menu_el_data_next && menu_el_data_next.children.length > 0) {
                    this.menu_el_data_current = menu_el_data_next;
                    this.vFocus_update(0);
                }
            }
            else if (ev.key == 'ArrowLeft' || ev.key == 'Backspace') {
                const mouseEvent = new MouseEvent('mouseleave', {
                    cancelable: true,
                    view: window,
                });
                (_c = this.menu_el_data_current.el) === null || _c === void 0 ? void 0 : _c.dispatchEvent(mouseEvent);
                if (this.menu_el_data_current.parent) {
                    this.menu_el_data_current = this.menu_el_data_current.parent;
                }
            }
            else if (ev.key == 'Enter') {
                if (this.menu_el_data_current.vFocus_index > -1) {
                    ev.preventDefault();
                    (_e = (_d = this.menu_el_data_current.children[this.menu_el_data_current.vFocus_index]) === null || _d === void 0 ? void 0 : _d.el) === null || _e === void 0 ? void 0 : _e.click();
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
                if (index > this.menu_el_data_current.children.length - 1)
                    return;
                const target_node = this.menu_el_data_current.children[index];
                if (!target_node)
                    return;
                this.vFocus_update(index);
                ev.preventDefault();
                ev.stopPropagation();
                if (target_node.children.length > 0) {
                    const mouseEvent = new MouseEvent('mouseenter', {
                        cancelable: true,
                        view: window,
                    });
                    (_g = (_f = this.menu_el_data_current.children[this.menu_el_data_current.vFocus_index]) === null || _f === void 0 ? void 0 : _f.el) === null || _g === void 0 ? void 0 : _g.dispatchEvent(mouseEvent);
                    const menu_el_data_next = this.menu_el_data_current.children[this.menu_el_data_current.vFocus_index];
                    if (menu_el_data_next && menu_el_data_next.children.length > 0) {
                        this.menu_el_data_current = menu_el_data_next;
                        this.vFocus_update(0);
                    }
                }
                else {
                    if (activeAMPanel) {
                        activeAMPanel.state.alt_virtual_flag = false;
                        (_h = activeAMPanel.el) === null || _h === void 0 ? void 0 : _h.classList.remove('show-altkey');
                    }
                    (_j = this.menu_el_data_current.children[this.menu_el_data_current.vFocus_index].el) === null || _j === void 0 ? void 0 : _j.click();
                }
            }
        });
    }
    vFocus_update(flag) {
        var _a, _b, _c, _d, _e, _f;
        const list = this.menu_el_data_current.children;
        if (list.length == 0)
            return false;
        if (this.menu_el_data_current.vFocus_index >= 0 && list[this.menu_el_data_current.vFocus_index]) {
            const mouseEvent = new MouseEvent('mouseleave', {
                cancelable: true,
                view: window,
            });
            (_b = (_a = list[this.menu_el_data_current.vFocus_index]) === null || _a === void 0 ? void 0 : _a.el) === null || _b === void 0 ? void 0 : _b.dispatchEvent(mouseEvent);
        }
        removeVFocus(list);
        function removeVFocus(list) {
            var _a, _b;
            for (let i = 0; i < list.length; i++) {
                (_b = (_a = list[i]) === null || _a === void 0 ? void 0 : _a.el) === null || _b === void 0 ? void 0 : _b.classList.remove("focus-active");
            }
        }
        if (flag === '0')
            this.menu_el_data_current.vFocus_index = 0;
        else if (flag === 'down')
            this.menu_el_data_current.vFocus_index++;
        else if (flag === 'up')
            this.menu_el_data_current.vFocus_index--;
        else if (flag === 'clean')
            this.menu_el_data_current.vFocus_index = -1;
        else if (typeof flag === 'number') {
            if (flag > list.length - 1)
                this.menu_el_data_current.vFocus_index = -1;
            else
                this.menu_el_data_current.vFocus_index = flag;
        }
        else
            throw new Error("unreachable");
        if (flag === 'clean') {
            this.menu_el_data_current.vFocus_index = -1;
            return;
        }
        if (this.menu_el_data_current.vFocus_index == -1 || this.menu_el_data_current.vFocus_index == list.length) {
            this.menu_el_data_current.vFocus_index = -1;
            return;
        }
        else if (this.menu_el_data_current.vFocus_index >= list.length)
            this.menu_el_data_current.vFocus_index = 0;
        else if (this.menu_el_data_current.vFocus_index < 0)
            this.menu_el_data_current.vFocus_index = (list.length - 1);
        (_d = (_c = list[this.menu_el_data_current.vFocus_index]) === null || _c === void 0 ? void 0 : _c.el) === null || _d === void 0 ? void 0 : _d.classList.add("focus-active");
        (_f = (_e = list[this.menu_el_data_current.vFocus_index]) === null || _e === void 0 ? void 0 : _e.el) === null || _f === void 0 ? void 0 : _f.scrollIntoView({ block: 'nearest' });
    }
}
