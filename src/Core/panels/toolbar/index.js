import { global_setting } from "../../shared/setting";
import { init_item } from "../shared/PanelItem";
import { AbsAmPanel } from "../abs";
export class AMToolbar extends AbsAmPanel {
    static factory(p_panel) {
        return new AMToolbar(p_panel);
    }
    constructor(p_panel) {
        const el = document.createElement('div');
        p_panel.el.appendChild(el);
        el.classList.add('am-toolbar');
        super(el, p_panel.el, p_panel);
        this.isShow = true;
        this.panel_hide();
    }
    append_data(toolbarItems) {
        const li_list = () => {
            toolbarItems.forEach((item) => {
                var _a;
                if (global_setting.config.toolbar_list.length == 0) { }
                else if (global_setting.config.toolbar_list.includes(item.label)) {
                    const index = global_setting.config.toolbar_list.indexOf(item.label);
                    item.order = index;
                }
                else {
                    return;
                }
                const li = document.createElement('div');
                li.classList.add('am-toolbar-item');
                const order = (_a = item.order) !== null && _a !== void 0 ? _a : 1000;
                li.dataset.order = order.toString();
                let inserted = false;
                for (const child of Array.from(this.el.children)) {
                    const childOrderAttr = child.dataset.order;
                    const childOrder = childOrderAttr !== undefined ? parseInt(childOrderAttr, 10) : 1000;
                    if (childOrder > order) {
                        this.el.insertBefore(li, child);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    this.el.appendChild(li);
                }
                void init_item(this, li, item, 'icon');
            });
        };
        li_list();
    }
    panel_show() {
        var _a;
        this.el.classList.remove('am-hide');
        this.isShow = true;
        this.el.classList.add('visible');
        (_a = this.el) === null || _a === void 0 ? void 0 : _a.classList.remove('show-altkey');
    }
    panel_hide() {
        this.el.classList.add('am-hide');
        this.isShow = false;
    }
    panel_toggle() {
        var _a;
        if ((_a = this.el) === null || _a === void 0 ? void 0 : _a.classList.contains('am-hide')) {
            this.panel_show();
        }
        else {
            this.panel_hide();
        }
    }
}
