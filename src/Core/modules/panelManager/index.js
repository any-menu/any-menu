import { global_setting } from "../../shared/setting";
import { activeAMPanel } from "../../panels/MulPanel";
export function create_panelManger_panel(el) {
    var _a;
    el.classList.add('am-panel-manager');
    const all_panel_list = ['search', 'toolbar', 'menu', 'miniEditor', 'info', 'debug'];
    const custom_sub_panel_list = Object.keys((_a = activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.custom_sub_panel) !== null && _a !== void 0 ? _a : {});
    if (custom_sub_panel_list.length > 0) {
        all_panel_list.push('hr', ...custom_sub_panel_list);
    }
    for (const item_name of all_panel_list) {
        if (item_name === 'hr') {
            const el_hr = document.createElement('hr');
            el.appendChild(el_hr);
            continue;
        }
        const el_item = document.createElement('div');
        el.appendChild(el_item);
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
