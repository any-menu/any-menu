import { OuterEditor } from "@editableblock/cm/dist/EditableBlock/src/OuterEditor";
import { EditableBlock_Cm } from "@editableblock/cm/dist/EditableBlock_Cm/src/";
import { EditableBlock_Code } from "@editableblock/code/dist/EditableBlock_Code/src/";
import { global_setting } from "../../shared/setting";
import { AbsAmPanel } from "../abs";
export class AMMiniEditor extends AbsAmPanel {
    static factory(p_panel) {
        const amMiniEditor = new AMMiniEditor(p_panel);
        return amMiniEditor;
    }
    constructor(p_panel) {
        const el = document.createElement('div');
        p_panel.el.appendChild(el);
        el.classList.add('am-mini-editor');
        super(el, p_panel.el, p_panel);
        this.cache_text = '';
        this.isShow = true;
        this.flag = '';
        this.visual_listener_keydown = (ev) => {
            if (ev.key === 'Enter' && ev.ctrlKey) {
                if (this.cache_text.endsWith('\n'))
                    this.cache_text = this.cache_text.slice(0, -1);
                global_setting.api.sendText(this.cache_text);
                return;
            }
        };
        this.panel_hide();
        this.cache_text = 'test Mini Editor2';
        const rangeSpec_None = {
            type: 'none',
            fromPos: 0,
            toPos: 0,
            text_content: this.cache_text,
            text_lang: '',
            parent_prefix: '',
        };
        const outterEditor = new OuterEditor();
        outterEditor.save = (str_with_prefix) => {
            this.cache_text = str_with_prefix;
            return Promise.resolve();
        };
        let editableblock_p = document.createElement('div');
        this.el.appendChild(editableblock_p);
        editableblock_p.classList.add('editable-codeblock-p');
        this.editableBlock_code = new EditableBlock_Code(rangeSpec_None, editableblock_p, outterEditor);
        this.editableBlock_code.emit_render();
        editableblock_p = document.createElement('div');
        this.el.appendChild(editableblock_p);
        editableblock_p.classList.add('editable-codeblock-p');
        this.editableBlock_cm = new EditableBlock_Cm(rangeSpec_None, editableblock_p, outterEditor);
        this.editableBlock_cm.emit_render();
        if (global_setting.state.editor_engine === 'codeblock') {
            this.editableBlock = this.editableBlock_code;
            this.editableBlock_code.el.classList.remove('am-hide');
            this.editableBlock_cm.el.classList.add('am-hide');
        }
        else {
            this.editableBlock = this.editableBlock_cm;
            this.editableBlock_cm.el.classList.remove('am-hide');
            this.editableBlock_code.el.classList.add('am-hide');
        }
        const buttons = document.createElement('div');
        this.el.appendChild(buttons);
        buttons.classList.add('am-mini-editor-buttons');
        const btn_send = document.createElement('button');
        buttons.appendChild(btn_send);
        btn_send.textContent = 'Send';
        btn_send.title = 'Ctrl+Enter';
        btn_send.onclick = () => {
            global_setting.api.sendText(this.cache_text);
        };
        const btn_save = document.createElement('button');
        buttons.appendChild(btn_save);
        btn_save.textContent = 'Save';
        btn_send.title = 'Ctrl+S';
        btn_save.onclick = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
            const dir_path = global_setting.config.note_paths;
            global_setting.api.writeFile(`${dir_path}${year}-${month}-${day}.md`, `## ${hours}:${minutes}:${seconds}.${milliseconds}\n\n${this.cache_text}\n\n`, true).catch(err => {
                console.error('MiniEditor 保存笔记失败', err);
            });
            this.panel_hide();
        };
        const btn_md_mode = document.createElement('button');
        buttons.appendChild(btn_md_mode);
        if (global_setting.state.editor_engine === 'codeblock') {
            btn_md_mode.textContent = 'Md mode';
        }
        else {
            btn_md_mode.textContent = 'Source mode';
        }
        btn_md_mode.onclick = () => {
            this.changeEngine(btn_md_mode);
        };
    }
    set_flag(mode) {
        if (mode === 'miniEditor') {
            this.el.classList.remove('am-mini-editor-mode-info');
            this.el.classList.add('am-mini-editor-mode-minieditor');
        }
        else {
            this.el.classList.remove('am-mini-editor-mode-minieditor');
            this.el.classList.add('am-mini-editor-mode-info');
        }
        this.flag = mode;
    }
    changeEngine(btn_md_mode, engine) {
        if (!engine) {
            if (this.editableBlock instanceof EditableBlock_Code) {
                engine = 'cm';
            }
            else {
                engine = 'codeblock';
            }
        }
        if (engine === 'codeblock') {
            global_setting.state.editor_engine = 'codeblock';
            btn_md_mode.textContent = 'Md mode';
            this.editableBlock_code.el.classList.remove('am-hide');
            this.editableBlock_cm.el.classList.add('am-hide');
            this.editableBlock = this.editableBlock_code;
            this.editableBlock.rangeSpec.text_content = this.cache_text;
            this.editableBlock.outerInfo.source = this.cache_text;
            this.editableBlock.innerInfo.source_old = this.cache_text;
            this.editableBlock.re_render();
        }
        else {
            global_setting.state.editor_engine = 'cm';
            btn_md_mode.textContent = 'Source mode';
            this.editableBlock_cm.el.classList.remove('am-hide');
            this.editableBlock_code.el.classList.add('am-hide');
            this.editableBlock = this.editableBlock_cm;
            this.editableBlock.rangeSpec.text_content = this.cache_text;
            this.editableBlock.outerInfo.source = this.cache_text;
            this.editableBlock.innerInfo.source_old = this.cache_text;
            this.editableBlock.update_content(this.cache_text);
        }
    }
    panel_show(new_text, is_focus = false) {
        this.el.classList.remove('am-hide');
        this.isShow = true;
        if (new_text)
            this.cache_text = new_text;
        else {
            this.cache_text = '';
        }
        this.editableBlock.rangeSpec.text_content = this.cache_text;
        this.editableBlock.outerInfo.source = this.cache_text;
        this.editableBlock.innerInfo.source_old = this.cache_text;
        if (this.editableBlock instanceof EditableBlock_Code) {
            this.editableBlock.re_render();
        }
        else {
            this.editableBlock.update_content(this.cache_text);
        }
        ;
        (() => {
            if (!is_focus)
                return;
            if (!global_setting.focusStrategy)
                return;
            this.editableBlock.focus(0, this.cache_text.length + 2);
        })();
        window.addEventListener('keydown', this.visual_listener_keydown);
    }
    panel_hide() {
        this.el.classList.add('am-hide');
        this.isShow = false;
        window.removeEventListener('keydown', this.visual_listener_keydown);
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
