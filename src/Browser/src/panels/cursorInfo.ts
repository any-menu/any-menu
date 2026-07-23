/** 获取游标和选区位置，还有对一些信息的采集 */
export function getCursorInfo(): {
  pos: {left: number, top: number, right: number, bottom: number}
} | null {
  const ret = getSelectionRect()
  return ret ? {pos:ret} : null

  // return {
  //   pos: {
  //     left: 200, top: 200, right: 400, bottom: 400
  //   }
  // }
}

/**
 * 获取当前选区或光标的屏幕矩形坐标
 * - 适用于 contenteditable 及普通文档选区
 * - 也兼容原生 <input> / <textarea>（使用镜像法估算）
 * 
 * @returns 矩形位置对象，或 null 表示无法获取
 */
function getSelectionRect(): {
  left: number; top: number; right: number; bottom: number
} | null {
  // 1) 优先尝试标准 Selection / Range API
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (range) {
      const rect = range.getBoundingClientRect();
      // 即使是折叠选区，rect 也有有效的 left/top 值
      if (rect) {
        console.log('光标位置1', {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        })
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        };
      }
    }
  }

  // 2) 降级：处理原生 `<input>` 或 `<textarea>`
  const activeEl = document.activeElement;
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    const ret = getSelectionRect_in_inputEl(activeEl)
    return ret
  }

  return null;
}

/**
 * 通过镜像法获取 `<input>` / `<textarea>` 光标的坐标
 */
function getSelectionRect_in_inputEl(
  input: HTMLInputElement | HTMLTextAreaElement
): { left: number; top: number; right: number; bottom: number } | null {
  // 1. 准备 - 创建一个隐藏的镜像元素，用于计算文本偏移
  const input_p = input.parentNode
  if (!input_p) return null
  const textareaRect = input.getBoundingClientRect(); // 必须在插入镜像元素前获取，避免触发 "Forced Synchronous Layout"
  const is_debug_mirror = false // 仅开始时使用。可能需要临时查看镜像元素，否则该元素通常是隐藏的
  if (is_debug_mirror) {
    document.querySelectorAll('.am-mirror-temp').forEach(el => el.remove());
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
  mirror.style.top = textareaRect.top + 'px';
  mirror.style.left = textareaRect.left + 'px';
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

  // 3. 获取光标位置
  const start = input.selectionStart ?? 0
  const textBefore = input.value.substring(0, start) // 取光标前的文本，并在末尾插入零宽标记 <span>
  const textAfter = input.value.substring(start)
  // 将换行符转换为 <br>，以保证 textarea 换行正确
  mirror.innerHTML = escapeHtml(textBefore) + '<span id="mirror-caret">&#x200B;</span>' + escapeHtml(textAfter);
  const caretSpan = mirror.querySelector('#mirror-caret') as HTMLSpanElement;

  let left = 0, top = 0, height = 0;
  if (caretSpan) {
    const spanRect = caretSpan.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    // 相对输入框左上角的偏移
    const offsetLeft = spanRect.left - inputRect.left;
    const offsetTop = spanRect.top - inputRect.top;

    left = inputRect.left + offsetLeft;
    top = inputRect.top + offsetTop;
    height = spanRect.height || parseFloat(style.lineHeight) || parseFloat(style.fontSize) || 16;
  } else {
    // 极低概率未找到，直接返回输入框左上角
    const inputRect = input.getBoundingClientRect();
    left = inputRect.left;
    top = inputRect.top;
    height = inputRect.height;
  }

  // 4. 结束 - 清理镜像
  if (!is_debug_mirror) {
    mirror.remove()
  }

  console.log('光标位置2', 'target', input, 'inputRect', textareaRect, 'pos', {
    left,
    top,
    right: left,
    bottom: top + height,
  }
  )

  return {
    left,
    top,
    right: left,   // 光标宽度为 0
    bottom: top + height,
  };

  /** 简单的 HTML 转义，防止 XSS 和内容干扰 */
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }
}
