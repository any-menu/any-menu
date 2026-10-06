import { global_setting } from "../../shared/setting";
export function add_drag_handle(handleEl, targetEl, callback) {
    let isDragging = false;
    let didDrag = false;
    let rawTargetEl = targetEl;
    targetEl = targetEl !== null && targetEl !== void 0 ? targetEl : document.body;
    let startElx = 0;
    let startEly = 0;
    let startElLeft = 0;
    let startElTop = 0;
    let startMouseX = 0;
    let startMouseY = 0;
    handleEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0)
            return;
        const startElRect = targetEl.getBoundingClientRect();
        startElx = startElRect.x;
        startEly = startElRect.y;
        const computedStyle = window.getComputedStyle(targetEl);
        startElLeft = parseInt(computedStyle.left) || targetEl.offsetLeft;
        startElTop = parseInt(computedStyle.top) || targetEl.offsetTop;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        isDragging = true;
        didDrag = false;
        handleEl.classList.add('am-pin--dragging');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
        e.stopPropagation();
    });
    const onMouseMove = (e) => {
        if (!isDragging)
            return;
        didDrag = true;
        if (global_setting.platform === 'app')
            return;
        if (!rawTargetEl)
            return;
        let endMouseX = Math.max(0, Math.min(e.clientX, window.innerWidth));
        let endMouseY = Math.max(0, Math.min(e.clientY, window.innerHeight));
        const dx = endMouseX - startMouseX;
        const dy = endMouseY - startMouseY;
        let endElx = startElx + dx;
        let endEly = startEly + dy;
        const endElLeft = startElLeft + (endElx - startElx);
        const endElTop = startElTop + (endEly - startEly);
        targetEl.style.left = `${endElLeft}px`;
        targetEl.style.top = `${endElTop}px`;
    };
    const onMouseUp = (e) => {
        callback === null || callback === void 0 ? void 0 : callback(didDrag);
        if (!isDragging)
            return;
        isDragging = false;
        handleEl.classList.remove('am-pin--dragging');
        didDrag = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        e.preventDefault();
        e.stopPropagation();
    };
}
