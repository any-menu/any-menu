var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { activeAMPanel } from ".";
import { global_setting } from "../../shared/setting";
import { AbsAmPanel } from "../abs";
import { AMPin } from './pin/index';
export class AMTitlebar extends AbsAmPanel {
    static factory(amPanel) {
        return new AMTitlebar(amPanel);
    }
    constructor(amPanel) {
        const el = document.createElement('div');
        amPanel.el.appendChild(el);
        el.classList.add('am-titlebar');
        super(el, amPanel.el, amPanel);
        this.amPanel = amPanel;
        AMPin.factory(this, amPanel);
        this.createHideBtn();
        this.createPanelManagerBtn();
        this.createReverseBtn();
        if (global_setting.platform == 'app')
            this.createRefreshBtn();
        if (global_setting.platform == 'app')
            global_setting.other.app_createTitlebar(this.el);
        this.panel_hide();
        AMPin.initEvent(this.el, amPanel);
    }
    panel_hide() {
        this.el.classList.add('am-hide');
    }
    panel_show() {
        this.el.classList.remove('am-hide');
    }
    createHideBtn() {
        const btn = document.createElement('button');
        this.el.appendChild(btn);
        btn.classList.add('am-titlebar-btn', 'am-titlebar-minimize');
        btn.title = '隐藏';
        btn.innerText = '隐藏';
        btn.addEventListener('click', () => {
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide([], true);
        });
    }
    createPanelManagerBtn() {
        const btn = document.createElement('button');
        this.el.appendChild(btn);
        btn.classList.add('am-titlebar-btn', 'am-titlebar-manager');
        btn.title = '面板管理';
        btn.innerText = '面板管理';
        let el_panel_list = document.createElement('div');
        btn.appendChild(el_panel_list);
        el_panel_list.classList.add('am-titlebar-list', 'am-hide');
        let is_show = false;
        btn.addEventListener('click', () => {
            var _a;
            if (!is_show) {
                is_show = true;
                btn.classList.add('active');
                el_panel_list.classList.remove('am-hide');
                el_panel_list.innerHTML = '';
                const all_panel_list = ['search', 'toolbar', 'menu', 'miniEditor', 'info', 'debug'];
                const custom_sub_panel_list = Object.keys((_a = activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.custom_sub_panel) !== null && _a !== void 0 ? _a : {});
                if (custom_sub_panel_list.length > 0) {
                    all_panel_list.push('hr', ...custom_sub_panel_list);
                }
                for (const item_name of all_panel_list) {
                    if (item_name === 'hr') {
                        const el_hr = document.createElement('hr');
                        el_panel_list.appendChild(el_hr);
                        continue;
                    }
                    const el_item = document.createElement('div');
                    el_panel_list.appendChild(el_item);
                    el_item.title = item_name;
                    if (activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.state.show_panel_list.includes(item_name))
                        el_item.classList.add('shown');
                    el_item.onclick = () => {
                        activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_toggle(item_name);
                        el_item.classList.toggle('shown');
                    };
                    const el_left = document.createElement('div');
                    el_item.appendChild(el_left);
                    el_left.classList.add('list-left');
                    global_setting.api.safeInnerHTML(el_left, '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>');
                    const el_content = document.createElement('div');
                    el_item.appendChild(el_content);
                    el_content.classList.add('list-content');
                    el_content.innerText = item_name;
                }
            }
            else {
                is_show = false;
                btn.classList.remove('active');
                el_panel_list.classList.add('am-hide');
            }
        });
    }
    createReverseBtn() {
        const btn = document.createElement('button');
        this.el.appendChild(btn);
        btn.classList.add('am-titlebar-btn', 'am-titlebar-reverse');
        btn.title = '上下翻转';
        btn.innerText = '上下翻转';
        btn.addEventListener('click', () => {
            if (!activeAMPanel)
                return;
            activeAMPanel.el.classList.toggle('am-reverse');
        });
    }
    createRefreshBtn() {
        if (global_setting.platform !== 'app')
            return;
        const btn = document.createElement('button');
        this.el.appendChild(btn);
        btn.classList.add('am-titlebar-btn', 'am-titlebar-refresh');
        btn.title = '更新信息';
        btn.innerText = '更新信息';
        btn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            yield global_setting.other.app_hide(undefined, true);
            window.setTimeout(() => {
                void global_setting.other.app_show();
            }, 200);
        }));
    }
}
