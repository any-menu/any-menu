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
            var _a, _b;
            if (!is_show) {
                is_show = true;
                btn.classList.add('active');
                el_panel_list.classList.remove('am-hide');
                el_panel_list.innerHTML = '';
                for (const item of ((_a = activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.state.show_panel_list) !== null && _a !== void 0 ? _a : [])) {
                    const el_item = document.createElement('div');
                    el_panel_list.appendChild(el_item);
                    el_item.innerText = item;
                    el_item.title = item;
                    el_item.onclick = () => {
                        activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide([item], undefined, false);
                        el_item.remove();
                        el_item.onclick = null;
                    };
                }
                const el_hr = document.createElement('hr');
                el_panel_list.appendChild(el_hr);
                const all_panel_list = [
                    'search', 'toolbar', 'menu', 'miniEditor', 'info',
                    ...Object.keys((_b = activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.custom_sub_panel) !== null && _b !== void 0 ? _b : {})
                ];
                for (const item_name of all_panel_list) {
                    const el_item = document.createElement('div');
                    el_panel_list.appendChild(el_item);
                    el_item.innerText = item_name;
                    el_item.title = item_name;
                    el_item.onclick = () => {
                    };
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
}
