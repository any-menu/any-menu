var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { create_panelManger_panel } from "../../modules/panelManager";
import { global_setting } from "../../shared/setting";
import { AbsAmPanel } from "../abs";
import { activeAMPanel } from ".";
import { AMPin } from './pin/index';
import { add_drag_handle } from "../shared/drag_tool";
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
        this.fold_btn = null;
        AMPin.factory(this, amPanel);
        this.createFoldBtn();
        this.createHideBtn();
        this.createPanelManagerBtn();
        this.createReverseBtn();
        if (global_setting.platform == 'app')
            this.createRefreshBtn();
        if (global_setting.platform == 'app')
            global_setting.other.app_createTitlebar(this.el);
        this.panel_hide();
        add_drag_handle(this.el, amPanel.el);
    }
    panel_hide() {
        this.el.classList.add('am-hide');
    }
    panel_show() {
        this.el.classList.remove('am-hide');
    }
    createFoldBtn() {
        this.fold_btn = document.createElement('button');
        this.el.appendChild(this.fold_btn);
        this.fold_btn.classList.add('am-titlebar-btn', 'am-titlebar-fold');
        this.fold_btn.title = '折叠或展开';
        this.toggle_fold(false);
        add_drag_handle(this.fold_btn, activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.el, (is_move) => {
            if (is_move)
                return;
            this.toggle_fold();
        });
    }
    toggle_fold(is_fold) {
        if (!activeAMPanel)
            return;
        if (is_fold === undefined) {
            const current_fold = activeAMPanel.el.classList.contains('am-panel-fold');
            is_fold = !current_fold;
        }
        if (is_fold) {
            activeAMPanel.el.classList.add('am-panel-fold');
            if (this.fold_btn) {
                const UNFOLD_HTML_STR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-down preview-icon">' +
                    '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>' +
                    '展开';
                global_setting.api.safeInnerHTML(this.fold_btn, UNFOLD_HTML_STR);
            }
        }
        else {
            activeAMPanel.el.classList.remove('am-panel-fold');
            if (this.fold_btn) {
                const FOLD_HTML_STR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-down-up preview-icon">' +
                    '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/></svg>' +
                    '折叠';
                global_setting.api.safeInnerHTML(this.fold_btn, FOLD_HTML_STR);
            }
        }
    }
    createHideBtn() {
        const btn = document.createElement('button');
        this.el.appendChild(btn);
        btn.classList.add('am-titlebar-btn', 'am-titlebar-minimize');
        btn.title = '隐藏';
        btn.innerText = '隐藏';
        add_drag_handle(btn, activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.el, (is_move) => {
            if (is_move)
                return;
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide([], true);
        });
    }
    createPanelManagerBtn() {
        const btn = document.createElement('button');
        this.el.appendChild(btn);
        btn.classList.add('am-titlebar-btn', 'am-titlebar-manager');
        btn.title = '面板管理';
        global_setting.api.safeInnerHTML(btn, '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-blocks">' +
            '<path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect x="14" y="2" width="8" height="8" rx="1"/></svg>' +
            '面板');
        let el_panel_list = document.createElement('div');
        btn.appendChild(el_panel_list);
        el_panel_list.classList.add('am-hide');
        let is_show = false;
        add_drag_handle(btn, activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.el, (is_move) => {
            if (is_move)
                return;
            if (!is_show) {
                is_show = true;
                btn.classList.add('active');
                el_panel_list.classList.remove('am-hide');
                el_panel_list.innerHTML = '';
                create_panelManger_panel(el_panel_list);
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
        global_setting.api.safeInnerHTML(btn, '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-vertical">' +
            '<path d="M12 2v20"/><path d="m8 18 4 4 4-4"/><path d="m8 6 4-4 4 4"/></svg>' +
            '翻转');
        add_drag_handle(btn, activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.el, (is_move) => {
            if (is_move)
                return;
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
        global_setting.api.safeInnerHTML(btn, '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw">' +
            '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>' +
            '更新');
        add_drag_handle(btn, activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.el, (is_move) => __awaiter(this, void 0, void 0, function* () {
            if (is_move)
                return;
            yield global_setting.other.app_hide(undefined, true);
            window.setTimeout(() => {
                void global_setting.other.app_show();
            }, 200);
        }));
    }
}
