/** 通用的游标/选区数据工具集 */

/** 获取选区所在的 el
 * 可基于此实现 isInPanel (无法判断也返回 false)
 * 
 * 主要是选区变化时调用
 */
export function get_selection_el(): HTMLElement | null {
  // b1. 处理原生 `<input>` 或 `<textarea>` 的选中文本
  const activeEl = document.activeElement as HTMLElement|null
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    return activeEl
  }

  // b2. 标准 Selection / Range API (无法处理 `textarea` 等内部元素隐藏的元素)
  // 备注: 此时的 activeEl 一般会是 `body`。我们不用那个，而是找更具体的
  else {
    const selection = document.getSelection(); // 无法获取 textarea 等元素的选中
    // 获取选区变化时的目标元素
    let el: HTMLElement|null
    // 有选区时，取选区所在容器判断
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const node = range.commonAncestorContainer
      el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
    }
    // 无选区时（例如单纯聚焦），检查当前活动元素
    else {
      el = activeEl
    }
    return el
  }
}

/**
 * 获取当前选区或光标的屏幕矩形坐标
 * - 适用于 contenteditable 及普通文档选区
 * - 也兼容原生 <input> / <textarea>（使用镜像法估算）
 * 
 * @returns 矩形位置对象，或 null 表示无法获取
 */
export function get_selection_rect(): {
  left: number; top: number; right: number; bottom: number
} | null {
  // b1. 处理原生 `<input>` 或 `<textarea>` 的选中文本
  const activeEl = document.activeElement as HTMLElement|null
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    const ret = get_selection_rect__in_inputEl(activeEl)
    return ret
  }

  // b2. 标准 Selection / Range API (无法处理 `textarea` 等内部元素隐藏的元素)
  // 备注: 此时的 activeEl 一般会是 `body`。我们不用那个，而是找更具体的
  {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (range) {
        const rect = range.getBoundingClientRect()
        // 即使是折叠选区，rect 也有有效的 left/top 值
        if (rect) {
          return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
          }
        }
      }
    }
    return null
  }
}

/**
 * 通过镜像法获取 `<input>` / `<textarea>` 光标的坐标
 */
function get_selection_rect__in_inputEl(
  input: HTMLInputElement | HTMLTextAreaElement
): { left: number; top: number; right: number; bottom: number } | null {
  // 1. 准备 - 创建一个隐藏的镜像元素，用于计算文本偏移
  const input_p = input.parentNode
  if (!input_p) return null
  const textareaRect = input.getBoundingClientRect(); // 必须在插入镜像元素前获取，避免触发 "Forced Synchronous Layout"
  const is_debug_mirror = false // 仅开始时使用。可能需要临时查看镜像元素，否则该元素通常是隐藏的
  if (is_debug_mirror) {
    document.querySelectorAll('.am-mirror-temp').forEach(el => el.remove())
  }
  const mirror = document.createElement('div'); input_p.insertBefore(mirror, input) // input el 前插入 mirror
    mirror.classList.add('am-mirror-temp')

  // 2.1. 保持一致性 - 复制所有影响文本排布的样式（列表可根据需要扩展）
  const style = window.getComputedStyle(input);
  const copyStyles = [
    'font-family', 'font-size', 'font-style', 'font-weight', 'font-variant',
    'letter-spacing', 'word-spacing', 'text-transform', 'text-indent',
    'white-space', 'word-wrap', 'overflow-wrap',
    'padding', 'border',
    'line-height', 'text-align',
    // 后面定位时使用的 getBoundingClientRect 是 border-box 模型，这里可以与原来的不同
    // 所以这些属性虽然影响排布，但也不同步：
    // 'box-sizing', 'width',
  ];
  for (const prop of copyStyles) {
    (mirror.style as any)[prop] = style.getPropertyValue(prop);
  }

  // 2.2. 保持一致性 - 保证文本换行、溢出等行为
  mirror.style.visibility = 'hidden';
  mirror.style.overflow = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.pointerEvents = 'none'; // 避免遮挡操作

  // 2.3. 保持一致性 - 一些非 css 属性，如视觉尺寸和位置等
  mirror.style.position = 'fixed'; // 必须先 fixed
  mirror.style.boxSizing = 'border-box'
  mirror.style.width = textareaRect.width + 'px';
  mirror.style.height = textareaRect.height + 'px';
  mirror.style.top = textareaRect.top - input.scrollTop + 'px';
  mirror.style.left = textareaRect.left - input.scrollLeft + 'px';
  // mirror.style.bottom = textareaRect.bottom + 'px';
  // mirror.style.right = textareaRect.right + 'px';

  // 2.4. 保持一致性 - (特殊) 可观察性
  if (is_debug_mirror) { // 处理 debug 与正常模式的显示差异
    mirror.style.visibility = 'visible'; // 覆盖之前的
    mirror.style.opacity = '0.2';
    mirror.style.zIndex = '99999';
    mirror.style.backgroundColor = 'white'; // 颜色区分一下
    mirror.style.color = 'black';
    mirror.style.borderColor = 'red';
  }

  // 3.1. 插入光标标志符。拆分为 `前文本 前插入标识 选择文本 后插入标识 后文本` 五个节点
  const startNum = input.selectionStart ?? 0
  const endNum = input.selectionEnd ?? 0
  const textBefore = input.value.substring(0, startNum)
  const textMid = input.value.substring(startNum, endNum)
  const textAfter = input.value.substring(endNum)
  mirror.innerHTML = escapeHtml(textBefore) +
    '<span id="mirror-caret">&#x200B;</span>' +
    escapeHtml(textMid) +
    '<span id="mirror-caret-end">&#x200B;</span>' +
    escapeHtml(textAfter)
  const caretSpan = mirror.querySelector('#mirror-caret') as HTMLSpanElement
  const caretSpanEnd = mirror.querySelector('#mirror-caret-end') as HTMLSpanElement
  if (!caretSpan || !caretSpanEnd) { // 理论上不会走这里。如是，则直接返回输入框矩形
    const left = textareaRect.left
    const right = textareaRect.right
    const top = textareaRect.top
    const height = textareaRect.height

    mirror.remove()
    return {
      left,
      top,
      right: right,
      bottom: top + height,
    }
  }

  // 3.2. 获取插入的光标标志符位置
  // 其中 scroll 值和 textareaRect 偏移，都已放在 mirror el 上了，这里就不用再算那些偏移了
  let left = 0, right = 0, top = 0, height = 0
  const caretRect = caretSpan.getBoundingClientRect()
  const caretRectEnd = caretSpanEnd.getBoundingClientRect()
  left = caretRect.left
  right = caretRectEnd.right
  top = caretRect.top
  height = caretRect.height || parseFloat(style.lineHeight) || parseFloat(style.fontSize) || 16
  // console.log('debug 情况 x', caretRect.left, textareaRect.left, input.scrollLeft)
  // console.log('debug 情况 y', caretRect.top, textareaRect.top, input.scrollTop)

  // 4. 结束 - 清理镜像
  if (!is_debug_mirror) {
    mirror.remove()
  }

  return {
    left,
    top,
    right,
    bottom: top + height,
  }

  /** 简单的 HTML 转义，防止 XSS 和内容干扰
   * 例如将换行符转换为 <br>，以保证 textarea 换行正确
   */
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }
}

// TODO
export function get_selection_text() {

}

// 获取光标选区
function get_selection_range(el: HTMLElement): 
  {start: number, end: number} | Range | null
{
  // b1. 处理原生 `<input>` 或 `<textarea>` 的选中选区
  if (el instanceof HTMLTextAreaElement){
    return {
      start: el.selectionStart,
      end: el.selectionEnd,
    }
  } else if (el instanceof HTMLInputElement) {
    return {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    }
  }

  // b2. editable div、not-editable div 的选中选区
  {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    // 确保选区确实在目标元素内部
    if (el.contains(range.commonAncestorContainer)) {
      return range.cloneRange()
    }
  }

  return null
}

/** 简易编辑器管理。
 * 
 * 编辑对象可能是 textarea、input、editable div、not-editable div
 * 
 * 主要管理聚焦转移和恢复时的聚焦状态和光标位置恢复
 */
export namespace EditorTools {

  export const state: {
    el: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null
    range: {start: number, end: number} | Range | null
  } = {
    el: null,
    range: null
  }

  // 保存光标状态
  export function saveCurrentCursor(el: HTMLElement): void {
    const ret = get_selection_range(el)

    // 无法获取
    if (!ret) {
      state.el = null
      state.range = null
    }
    else if (ret instanceof Range) {
      state.el = el
      state.range = ret
    }
    else {
      state.el = el
      state.range = {
        start: ret.start,
        end: ret.end,
      }
    }
  }

  // 恢复光标位置
  // (可选) 可以顺便在光标位置插入文本内容
  export function recoverCursor(insertText: string = ''): void {
    // 1. 获取保存的状态
    if (!state.el || !document.contains(state.el)) {
      console.warn('No cache editor\'s el or range, can\'t recover range.')
      return
    }

    // 职责链模式
    let ret = recoverCursor_textarea(insertText)
    if (ret) return
    ret = recoverCursor_editableDiv(insertText)
    if (ret) return
    console.warn('Current el not editable.')
    return
  }

  function recoverCursor_textarea(insertText: string = ''): boolean {
    if (!(state.el instanceof HTMLTextAreaElement || state.el instanceof HTMLInputElement)) { return false }
    if (!state.range) { console.error('Unreacheable 1'); return false }
    if (state.range instanceof Range) { console.error('Unreacheable 2'); return false }
    const el = state.el

    // 2. 光标原位置信息获取
    // 先查看是否已经是聚焦状态，如果是，则使用当前的光标位置，而非从状态中更新
    let start: number, end: number;
    if (document.activeElement === el) { // 已聚焦 → 使用当前实际光标位置
      start = el.selectionStart ?? 0;
      end = el.selectionEnd ?? 0;
    } else { // 未聚焦 → 使用保存的光标位置
      start = state.range.start;
      end = state.range.end;
    }

    // 3. 获取当前值和新值，设置文本
    const currentValue = el.value;
    const newValue = 
      currentValue.substring(0, start) + 
      insertText + 
      currentValue.substring(end);
    el.value = newValue;

    // 4. 计算新的光标位置，设置光标位置和聚焦状态
    const newCursorPos = start + insertText.length;
    el.selectionStart = newCursorPos;
    el.selectionEnd = newCursorPos;
    el.focus();

    // 5. 清空/更新保存的状态
    state.range.start = newCursorPos
    state.range.end = newCursorPos
    // state.savedCursorState = null; // (可选) 清空以防止重复使用

    return true
  }

  function recoverCursor_editableDiv(insertText: string = ''): boolean {
    if (!state.el || !state.el.isContentEditable) { return false }
    if (!state.range) { console.error('Unreacheable 3'); return false }
    if (!(state.range instanceof Range)) { console.error('Unreacheable 4'); return false }
    const el = state.el

    // 如果当前已聚焦在 contenteditable 且存在有效选区，则优先使用当前选区而非缓存选区
    if (document.activeElement === el) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0)
        if (el.contains(currentRange.commonAncestorContainer)) {
          state.range = currentRange
        }
      }
    }

    // 插入文本、并更新 Range
    if (insertText) {
      state.range.deleteContents()
      const textNode = document.createTextNode(insertText)
      state.range.insertNode(textNode)

      // 将 range 移动到插入文本之后
      state.range.setStartAfter(textNode)
      state.range.setEndAfter(textNode)
      // state.range = state.range.cloneRange()
    }

    // 恢复 selection
    const selection = window.getSelection()
    if (selection) {
      // contenteditable 需要先聚焦，否则选区可能无法正常显示
      if (el.isContentEditable) {
        el.focus()
      }
      selection.removeAllRanges()
      selection.addRange(state.range)
    }

    return true
  }
}
