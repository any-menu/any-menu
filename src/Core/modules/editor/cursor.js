import { global_setting } from "../../shared/setting";
export function get_selection_el() {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        return activeEl;
    }
    else {
        const selection = document.getSelection();
        let el;
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const node = range.commonAncestorContainer;
            el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        }
        else {
            el = activeEl;
        }
        return el;
    }
}
export function get_selection_rect() {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        const ret = get_selection_rect__in_inputEl(activeEl);
        return ret;
    }
    {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (range) {
                const rect = range.getBoundingClientRect();
                if (rect) {
                    return {
                        left: rect.left,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                    };
                }
            }
        }
        return null;
    }
}
function get_selection_rect__in_inputEl(input) {
    var _a, _b;
    const input_p = input.parentNode;
    if (!input_p)
        return null;
    const textareaRect = input.getBoundingClientRect();
    const is_debug_mirror = false;
    if (is_debug_mirror) {
        document.querySelectorAll('.am-mirror-temp').forEach(el => el.remove());
    }
    const mirror = document.createElement('div');
    input_p.insertBefore(mirror, input);
    mirror.classList.add('am-mirror-temp');
    const style = window.getComputedStyle(input);
    const copyStyles = [
        'font-family', 'font-size', 'font-style', 'font-weight', 'font-variant',
        'letter-spacing', 'word-spacing', 'text-transform', 'text-indent',
        'white-space', 'word-wrap', 'overflow-wrap',
        'padding', 'border',
        'line-height', 'text-align',
    ];
    for (const prop of copyStyles) {
        mirror.style[prop] = style.getPropertyValue(prop);
    }
    mirror.style.visibility = 'hidden';
    mirror.style.overflow = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.pointerEvents = 'none';
    mirror.style.position = 'fixed';
    mirror.style.boxSizing = 'border-box';
    mirror.style.width = textareaRect.width + 'px';
    mirror.style.height = textareaRect.height + 'px';
    mirror.style.top = textareaRect.top - input.scrollTop + 'px';
    mirror.style.left = textareaRect.left - input.scrollLeft + 'px';
    if (is_debug_mirror) {
        mirror.style.visibility = 'visible';
        mirror.style.opacity = '0.2';
        mirror.style.zIndex = '99999';
        mirror.style.backgroundColor = 'white';
        mirror.style.color = 'black';
        mirror.style.borderColor = 'red';
    }
    const startNum = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : 0;
    const endNum = (_b = input.selectionEnd) !== null && _b !== void 0 ? _b : 0;
    const textBefore = input.value.substring(0, startNum);
    const textMid = input.value.substring(startNum, endNum);
    const textAfter = input.value.substring(endNum);
    mirror.innerHTML = escapeHtml(textBefore) +
        '<span id="mirror-caret">&#x200B;</span>' +
        escapeHtml(textMid) +
        '<span id="mirror-caret-end">&#x200B;</span>' +
        escapeHtml(textAfter);
    const caretSpan = mirror.querySelector('#mirror-caret');
    const caretSpanEnd = mirror.querySelector('#mirror-caret-end');
    if (!caretSpan || !caretSpanEnd) {
        const left = textareaRect.left;
        const right = textareaRect.right;
        const top = textareaRect.top;
        const height = textareaRect.height;
        mirror.remove();
        return {
            left,
            top,
            right: right,
            bottom: top + height,
        };
    }
    let left = 0, right = 0, top = 0, height = 0;
    const caretRect = caretSpan.getBoundingClientRect();
    const caretRectEnd = caretSpanEnd.getBoundingClientRect();
    left = caretRect.left;
    right = caretRectEnd.right;
    top = caretRect.top;
    height = caretRect.height || parseFloat(style.lineHeight) || parseFloat(style.fontSize) || 16;
    if (!is_debug_mirror) {
        mirror.remove();
    }
    return {
        left,
        top,
        right,
        bottom: top + height,
    };
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '<br>');
    }
}
export function get_selection_text() {
}
function get_selection_range(el) {
    var _a, _b;
    if (el instanceof HTMLTextAreaElement) {
        return {
            start: el.selectionStart,
            end: el.selectionEnd,
        };
    }
    else if (el instanceof HTMLInputElement) {
        return {
            start: (_a = el.selectionStart) !== null && _a !== void 0 ? _a : 0,
            end: (_b = el.selectionEnd) !== null && _b !== void 0 ? _b : 0,
        };
    }
    {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return null;
        const range = selection.getRangeAt(0);
        if (el.contains(range.commonAncestorContainer)) {
            return range.cloneRange();
        }
    }
    return null;
}
export var EditorTools;
(function (EditorTools) {
    EditorTools.state = {
        el: null,
        range: null
    };
    function saveCurrentCursor(el) {
        const ret = get_selection_range(el);
        if (!ret) {
            EditorTools.state.el = null;
            EditorTools.state.range = null;
        }
        else if (ret instanceof Range) {
            EditorTools.state.el = el;
            EditorTools.state.range = ret;
        }
        else {
            EditorTools.state.el = el;
            EditorTools.state.range = {
                start: ret.start,
                end: ret.end,
            };
        }
    }
    EditorTools.saveCurrentCursor = saveCurrentCursor;
    function recoverCursor(insertText = '') {
        if (!EditorTools.state.el || !document.contains(EditorTools.state.el)) {
            console.warn('No cache editor\'s el or range, can\'t recover range.');
            return false;
        }
        let ret = recoverCursor_textarea(insertText);
        if (ret)
            return true;
        ret = recoverCursor_editableDiv(insertText);
        if (ret)
            return true;
        console.warn('Current el not editable.');
        return false;
    }
    EditorTools.recoverCursor = recoverCursor;
    function recoverCursor_textarea(insertText = '') {
        var _a, _b;
        if (!(EditorTools.state.el instanceof HTMLTextAreaElement || EditorTools.state.el instanceof HTMLInputElement)) {
            return false;
        }
        if (!EditorTools.state.range) {
            console.error('Unreacheable 1');
            return false;
        }
        if (EditorTools.state.range instanceof Range) {
            console.error('Unreacheable 2');
            return false;
        }
        const el = EditorTools.state.el;
        let start, end;
        if (document.activeElement === el) {
            start = (_a = el.selectionStart) !== null && _a !== void 0 ? _a : 0;
            end = (_b = el.selectionEnd) !== null && _b !== void 0 ? _b : 0;
        }
        else {
            start = EditorTools.state.range.start;
            end = EditorTools.state.range.end;
        }
        const currentValue = el.value;
        const newValue = currentValue.substring(0, start) +
            insertText +
            currentValue.substring(end);
        el.value = newValue;
        const newSelectionEnd = start + insertText.length;
        const newSelectionStart = global_setting.state.selectedText ? start : newSelectionEnd;
        el.selectionStart = newSelectionStart;
        el.selectionEnd = newSelectionEnd;
        el.focus();
        EditorTools.state.range.start = newSelectionStart;
        EditorTools.state.range.end = newSelectionEnd;
        return true;
    }
    function recoverCursor_editableDiv(insertText = '') {
        if (!EditorTools.state.el || !EditorTools.state.el.isContentEditable) {
            return false;
        }
        if (!EditorTools.state.range) {
            console.error('Unreacheable 3');
            return false;
        }
        if (!(EditorTools.state.range instanceof Range)) {
            console.error('Unreacheable 4');
            return false;
        }
        const el = EditorTools.state.el;
        if (document.activeElement === el) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const currentRange = selection.getRangeAt(0);
                if (el.contains(currentRange.commonAncestorContainer)) {
                    EditorTools.state.range = currentRange;
                }
            }
        }
        {
            EditorTools.state.range.deleteContents();
            const textNode = document.createTextNode(insertText);
            EditorTools.state.range.insertNode(textNode);
            EditorTools.state.range.setEndAfter(textNode);
            if (global_setting.state.selectedText)
                EditorTools.state.range.setStartBefore(textNode);
            else
                EditorTools.state.range.setStartAfter(textNode);
        }
        const selection = window.getSelection();
        if (selection) {
            if (el.isContentEditable) {
                el.focus();
            }
            selection.removeAllRanges();
            selection.addRange(EditorTools.state.range);
        }
        return true;
    }
})(EditorTools || (EditorTools = {}));
