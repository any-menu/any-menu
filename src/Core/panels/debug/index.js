import { global_setting } from "../../shared/setting";
import { AbsAmPanel } from "../abs";
export class AMDebug extends AbsAmPanel {
    static factory(p_panel) {
        const instance = new AMDebug(p_panel);
        return instance;
    }
    constructor(p_panel) {
        const el = document.createElement('div');
        p_panel.el.appendChild(el);
        el.classList.add('am-debug');
        super(el, p_panel.el, p_panel);
        this.panel_hide();
    }
    panel_show() {
        if (this.el) {
            this.el.classList.remove('am-hide');
        }
        window.clearInterval(this.interval);
        const fn = () => {
            let showText = global_setting.state.selectedText;
            if (!showText) {
                showText = `""`;
            }
            else if (showText.length > 13) {
                showText = `"${showText.slice(0, 5)} ... ${showText.slice(-5)}"`;
            }
            else {
                showText = `"${showText}"`;
            }
            this.el.textContent =
                (new Date().toLocaleString()) + '\n' +
                    showText;
        };
        fn();
        this.interval = window.setInterval(fn, 500);
    }
    panel_hide() {
        if (this.el.classList.contains('am-hide')) {
            console.warn('Call the hiding method in the hidden state. [Search panel]');
            return;
        }
        this.el.classList.add('am-hide');
        window.clearInterval(this.interval);
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
