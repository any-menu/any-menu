import { global_setting } from "../../shared/setting";
import { AbsAmPanel } from "../abs";
import { AMSuggestion } from "./AMSuggestion";
export class AMSearch extends AbsAmPanel {
    static factory(p_panel) {
        const instance = new AMSearch(p_panel);
        return instance;
    }
    constructor(p_panel) {
        const el = document.createElement('div');
        p_panel.el.appendChild(el);
        el.classList.add('am-search');
        super(el, p_panel.el, p_panel);
        this.interval = -1;
        this.init_el();
        this.panel_hide();
    }
    init_el() {
        this.el_input = document.createElement('input');
        this.el.appendChild(this.el_input);
        this.el_input.classList.add('am-search-input', 'am-input');
        this.el_input.type = 'search';
        this.el_input.placeholder = 'Search...';
        this.el_input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && this.el_input && this.el_input.value.trim() != "") {
                this.el_input.value = "";
                ev.preventDefault();
                ev.stopPropagation();
            }
        });
        this.amSuggestion = AMSuggestion.factory(this.el_input, this.el);
        return this.el;
    }
    panel_show(is_focus = false) {
        this.el_input.value = '';
        this.amSuggestion.panel_hide();
        if (this.el) {
            this.el.classList.remove('am-hide');
        }
        ;
        (() => {
            if (!is_focus)
                return;
            if (!global_setting.focusStrategy)
                return;
            this.el_input.focus();
        })();
        window.clearInterval(this.interval);
        const len = 6;
        const fn = () => {
            var _a, _b, _c, _d;
            let selectedText_show = global_setting.state.selectedText;
            if (!selectedText_show) {
                selectedText_show = `""`;
            }
            else if (selectedText_show.length > 2 * len + 3) {
                selectedText_show = `"${selectedText_show.slice(0, len)} ... ${selectedText_show.slice(-len)}"`;
            }
            else {
                selectedText_show = `"${selectedText_show}"`;
            }
            const editorApi = (_b = (_a = global_setting.other).editor_get) === null || _b === void 0 ? void 0 : _b.call(_a);
            const editorApi_len = editorApi ? editorApi.getRange().length : 0;
            const selectedText_len = (_d = (_c = global_setting.state.selectedText) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0;
            const len_msg = selectedText_len + '/' + editorApi_len;
            this.el_input.placeholder = 'Search...    ' +
                (new Date().toLocaleTimeString('en-GB')) + '    ' +
                selectedText_show + '    ' +
                len_msg;
        };
        fn();
        this.interval = window.setInterval(fn, 100);
    }
    panel_hide() {
        this.el_input.value = '';
        this.amSuggestion.panel_hide();
        if (this.el.classList.contains('am-hide')) {
            console.warn('Call the hiding method in the hidden state. [Search panel]');
            return;
        }
        this.el.classList.add('am-hide');
        this.el_input.blur();
        (() => {
            if (!global_setting.focusStrategy)
                return;
            if (typeof require == 'undefined')
                return;
            const MarkdownView = require('obsidian').MarkdownView;
            if (!MarkdownView)
                return;
            const plugin = global_setting.other.obsidian_plugin;
            if (!plugin)
                return;
            const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView)
                return;
            const editor = activeView.editor;
            editor.focus();
        })();
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
