import { AbsAmPanel } from "../../abs";
import { global_setting } from "../../../shared/setting";
export class AMPin extends AbsAmPanel {
    static factory(p_panel, amPanel) {
        return new AMPin(p_panel, amPanel);
    }
    constructor(p_panel, amPanel) {
        const el = document.createElement('div');
        p_panel.el.appendChild(el);
        el.classList.add('am-pin');
        super(el, p_panel.el, p_panel);
        this.p_panel = p_panel;
        this.amPanel = amPanel;
        global_setting.api.saveInnerHTML(this.el, `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`);
        AMPin.initEvent(this.el, amPanel);
    }
    static initEvent(pinEl, amPanel) {
        const panelEl = amPanel.el;
        let isDragging = false;
        let didDrag = false;
        let startElx = 0;
        let startEly = 0;
        let startElLeft = 0;
        let startElTop = 0;
        let startMouseX = 0;
        let startMouseY = 0;
        const onMouseMove = (e) => {
            if (!isDragging)
                return;
            didDrag = true;
            if (global_setting.platform === 'app')
                return;
            let endMouseX = Math.max(0, Math.min(e.clientX, window.innerWidth));
            let endMouseY = Math.max(0, Math.min(e.clientY, window.innerHeight));
            const dx = endMouseX - startMouseX;
            const dy = endMouseY - startMouseY;
            let endElx = startElx + dx;
            let endEly = startEly + dy;
            const endElLeft = startElLeft + (endElx - startElx);
            const endElTop = startElTop + (endEly - startEly);
            panelEl.style.left = `${endElLeft}px`;
            panelEl.style.top = `${endElTop}px`;
        };
        const onMouseUp = (e) => {
            var _a, _b, _c, _d;
            if (!isDragging)
                return;
            isDragging = false;
            pinEl.classList.remove('am-pin--dragging');
            if (pinEl.classList.contains('am-pin')) {
                if (!didDrag) {
                    global_setting.api.pin();
                }
                else {
                    global_setting.api.pin(true);
                }
                didDrag = false;
                if (global_setting.state.isPin) {
                    (_a = amPanel.sub_panels.amTitlebar) === null || _a === void 0 ? void 0 : _a.panel_show();
                    (_b = amPanel.sub_panels.amPin) === null || _b === void 0 ? void 0 : _b.hide();
                }
                else {
                    (_c = amPanel.sub_panels.amTitlebar) === null || _c === void 0 ? void 0 : _c.panel_hide();
                    (_d = amPanel.sub_panels.amPin) === null || _d === void 0 ? void 0 : _d.show();
                }
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            e.preventDefault();
            e.stopPropagation();
        };
        pinEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0)
                return;
            const startElRect = panelEl.getBoundingClientRect();
            startElx = startElRect.x;
            startEly = startElRect.y;
            const computedStyle = window.getComputedStyle(panelEl);
            startElLeft = parseInt(computedStyle.left) || panelEl.offsetLeft;
            startElTop = parseInt(computedStyle.top) || panelEl.offsetTop;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            isDragging = true;
            didDrag = false;
            pinEl.classList.add('am-pin--dragging');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
            e.stopPropagation();
        });
    }
    hide() {
        this.el.classList.add('am-hide');
    }
    show() {
        this.el.classList.remove('am-hide');
    }
}
