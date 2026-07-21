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
    console.log('光标位置2', ret)
    return ret
  }

  return null;
}

/**
 * 通过镜像法获取 <input> / <textarea> 光标的坐标
 */
function getSelectionRect_in_inputEl(
  input: HTMLInputElement | HTMLTextAreaElement
): { left: number; top: number; right: number; bottom: number } | null {
  // 创建一个隐藏的镜像元素，用于计算文本偏移
  const mirror = document.createElement('div');
  const style = window.getComputedStyle(input);

  // 复制所有影响文本排布的样式（列表可根据需要扩展）
  const copyStyles = [
    'font-family', 'font-size', 'font-style', 'font-weight', 'font-variant',
    'letter-spacing', 'word-spacing', 'text-transform', 'text-indent',
    'white-space', 'word-wrap', 'overflow-wrap',
    'box-sizing', 'width', 'padding', 'border',
    'line-height', 'text-align',
  ];

  for (const prop of copyStyles) {
    (mirror.style as any)[prop] = style.getPropertyValue(prop);
  }
  // 对于 textarea，需要支持换行
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap'; // 保留换行
  mirror.style.overflow = 'hidden';
  // 确保不影响页面布局
  mirror.style.top = '0';
  mirror.style.left = '0';
  mirror.style.width = style.width; // 与输入框等宽（尤其对 textarea 重要）
  document.body.appendChild(mirror);

  // 获取光标位置
  const start = input.selectionStart ?? 0;
  // 取光标前的文本，并在末尾插入零宽标记 <span>
  const textBefore = input.value.substring(0, start);
  const textAfter = input.value.substring(start);

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

  // 清理镜像
  document.body.removeChild(mirror);

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
