var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { global_setting } from "../../shared/setting";
import { activeAMPanel } from "../../panels/MulPanel";
import { get_selection_rect, get_selection_el, EditorTools } from "./cursor";
export class DocumentListeners {
    constructor() {
        this.isContextOpening = false;
        this.isKeyboardSelection = false;
        this.isMouseSelecting = false;
        this.isMouseDown = false;
        this.pointerX = 0;
        this.pointerY = 0;
        this.previewSelection = null;
        this.onContextMenu = () => {
            this.isContextOpening = true;
        };
        this.onKeyDown = (ev) => {
            this.isKeyboardSelection = true;
            this.isMouseSelecting = false;
            this.isMouseDown = false;
            if (ev.key === 'Escape') {
                activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide([]);
                return;
            }
            if (!(ev.target instanceof Element))
                return;
            if (ev.target.matches('.am-panel *'))
                return;
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide([]);
        };
        this.onKeyUp = (event) => {
            this.isMouseDown = false;
            if (!(event.target instanceof Element))
                return;
            if (event.target.closest('.am-panel'))
                return;
            if (event.key === 'Shift' || event.key === 'Alt') {
                if (this.isKeyboardSelection)
                    window.setTimeout(() => void this.getMsg_and_showPanel(), 10);
            }
        };
        this.onDoubleClick = (event) => __awaiter(this, void 0, void 0, function* () {
            this.isKeyboardSelection = false;
            this.isMouseSelecting = true;
            if (!(event.target instanceof Element))
                return;
            if (event.target.closest('.am-panel'))
                return;
            window.setTimeout(() => void this.getMsg_and_showPanel(), 10);
        });
        this.onMouseDown = (event) => {
            this.isKeyboardSelection = false;
            this.isMouseSelecting = true;
            this.isMouseDown = true;
            if (!(event.target instanceof Element))
                return;
            if (event.target.closest('.am-panel'))
                return;
            activeAMPanel === null || activeAMPanel === void 0 ? void 0 : activeAMPanel.panel_hide([]);
        };
        this.onMouseUp = (event) => __awaiter(this, void 0, void 0, function* () {
            this.isMouseDown = false;
            if (!global_setting.config.auto_show_toolbar_on_select)
                return;
            if (!this.previewSelection)
                return;
            if (!(event.target instanceof Element))
                return;
            if (event.target.closest('.am-panel'))
                return;
            if (this.isMouseSelecting)
                window.setTimeout(() => void this.getMsg_and_showPanel(), 10);
            this.isMouseSelecting = false;
        });
        this.onMouseMove = (event) => {
            this.pointerX = event.clientX;
            this.pointerY = event.clientY;
            if (this.isMouseDown) {
                this.isKeyboardSelection = false;
                this.isMouseSelecting = true;
            }
        };
        this.onSelectionChange = (_event) => {
            this.updateSelectedText();
        };
        this.selection_whiteList = null;
        this.show_whiteList = null;
    }
    register() {
        if (!global_setting.config.auto_show_toolbar_on_select)
            return;
        document.addEventListener('contextmenu', this.onContextMenu);
        document.addEventListener('dblclick', this.onDoubleClick);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('selectionchange', this.onSelectionChange);
    }
    unregister() {
        document.removeEventListener('contextmenu', this.onContextMenu);
        document.removeEventListener('dblclick', this.onDoubleClick);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('selectionchange', this.onSelectionChange);
    }
    setSelection_whiteList(className) {
        this.selection_whiteList = className;
    }
    setShow_whiteList(className) {
        this.show_whiteList = className;
    }
    updateSelectedText() {
        const el = get_selection_el();
        {
            if (!el)
                return;
            else if (el.closest(`.am-panel`) !== null) {
                return;
            }
            else if (this.selection_whiteList && !el.classList.contains(this.selection_whiteList)) {
                return;
            }
        }
        EditorTools.saveCurrentCursor(el);
        const selection = document.getSelection();
        if (!selection || selection.toString() === '') {
            this.previewSelection = null;
            global_setting.state.selectedText = undefined;
        }
        else {
            this.previewSelection = selection;
            global_setting.state.selectedText = selection.toString();
        }
    }
    getMsg_and_showPanel() {
        return __awaiter(this, void 0, void 0, function* () {
            {
                if (!global_setting.config.auto_show_toolbar_on_select)
                    return;
                if (!this.previewSelection)
                    return;
                const el = EditorTools.state.el;
                if (!el)
                    return;
                if (el.closest(`.am-panel`) !== null) {
                    return;
                }
                if (this.show_whiteList && !el.classList.contains(this.show_whiteList)) {
                    return;
                }
                if (!activeAMPanel)
                    return;
            }
            let panel_list;
            let final_pos;
            {
                panel_list = global_setting.config.panel_preset2[1].list;
                const selectionRect = get_selection_rect();
                if (!selectionRect) {
                    console.warn('获取光标位置失败');
                    return;
                }
                const screen_size = { width: window.innerWidth, height: window.innerHeight };
                const panel_size = activeAMPanel.get_size(panel_list);
                final_pos = activeAMPanel.fix_position(screen_size, panel_size, selectionRect, "side", "center", "top");
            }
            {
                if (global_setting.state.isPin)
                    return;
                activeAMPanel.panel_hide();
                activeAMPanel.panel_show({ x: final_pos.x, y: final_pos.y, is_reverse: final_pos.is_reverse }, panel_list, false);
            }
        });
    }
}
