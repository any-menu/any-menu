/**
 * 这里采用的 api 实现是 OPFS
 * 优点：无后端 + 持久化，除了适合快速本地调试，还适合线上演示
 */

import type { EditorApi, UrlResponse, UrlRequestConfig, UrlResponseData } from "../../../Type";
import { global_setting } from "@/Core/shared/setting";
import { activeAMPanel } from '@/Core/panels/MulPanel';
import { EditorTools } from "@/Core/modules/editor/cursor";

export async function initApi() {
  global_setting.platform = 'browser'
  
  // 浏览器 App 版本的某些默认配置有所不同
  {
    // 路径
    // ...

    // 语言环境
    if (global_setting.config.language == 'auto') {
      global_setting.state.language = navigator.language;
      if (global_setting.state.language == 'zh-CN') global_setting.state.language = 'zh'
    } else {
      global_setting.state.language = global_setting.config.language
    }

    // 明暗模式
    global_setting.api.getSystemIsDark = () => {
      if (window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false; // 获取不到明或暗，则默认明亮
    }
  }

  global_setting.other.editor_get = (): null | EditorApi => {
    let ret = initApi_editor_get_from_textarea()
    if (ret) return ret
    ret = initApi_editor_get_from_editableEl()
    if (ret) return ret
    return null
  }

  global_setting.api.sendText = async (text: string) => {
    activeAMPanel?.panel_hide()
    const ret = EditorTools.recoverCursor(text)
    if (!ret) return
    if (global_setting.state.selectedText) global_setting.state.selectedText = text
    return
  }

  global_setting.api.pin = async (isPin?: boolean) => {
    if (isPin === undefined) {
      global_setting.state.isPin = !global_setting.state.isPin
    } else {
      global_setting.state.isPin = isPin
    }

    if (global_setting.state.isPin) {
      activeAMPanel?.el.classList.add('am-pin-active')
    }
    else {
      activeAMPanel?.el.classList.remove('am-pin-active')
    }
  }
}

/** 有本地服务器的版本 */
export async function initApi_with_server() {
  // 向后端请求，使用后端 api
  async function request<T>(action: string, params: Record<string, any>): Promise<T> {
    const res = await fetch(`/__api/fs${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Request failed');
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Unknown error');
    }
    return json.data as T;
  }

  // ------- 文件操作 API -------
  global_setting.api.isFolder = (relPath: string): Promise<boolean> => {
    return request<boolean>('/isFolder', { relPath });
  };

  global_setting.api.readFile = async (relPath: string): Promise<string | null> => {
    try {
      return await request<string>('/readFile', { relPath });
    } catch {
      return null;
    }
  };

  global_setting.api.readFolder = async (
    relPath: string,
    recursion_depth?: number
  ): Promise<string[]> => {
    try {
      return await request<string[]>('/readFolder', {
        relPath,
        recursion_depth: recursion_depth ?? 0,
      });
    } catch {
      return [];
    }
  };

  global_setting.api.writeFile = async (
    relPath: string,
    content: string,
    is_append?: boolean
  ): Promise<boolean> => {
    if (is_append === undefined) is_append = false

    try {
      await request<boolean>('/writeFile', {
        relPath,
        content,
        is_append,
      });
      return true;
    } catch {
      return false;
    }
  };

  global_setting.api.deleteFile = async (relPath: string): Promise<boolean> => {
    try {
      await request<boolean>('/deleteFile', { relPath });
      return true;
    } catch {
      return false;
    }
  };

  // ------- 通用网络请求 -------
  global_setting.api.urlRequest = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      isParseJson = true,
      isStream,
      onChunk,
      onDone,
    } = conf;

    try {
      // 流式模式（SSE 或 chunk 回调）
      if (isStream) {
        const response = await fetch(url, { method, headers, body });
        if (!response.ok || !response.body) {
          return { code: -1, msg: `HTTP error ${response.status}` };
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            onChunk?.(chunk);
          }
          done = streamDone;
        }
        onDone?.();
        return null; // 流式模式不返回完整响应体
      }

      // 普通模式
      const response = await fetch(url, { method, headers, body });
      const text = await response.text();
      let json: any = undefined;
      if (isParseJson) {
        try {
          json = JSON.parse(text);
        } catch {
          /* 忽略解析错误 */
        }
      }

      const data: UrlResponseData = {
        text,
        json,
        originalResponse: response,
      };

      return {
        code: response.ok ? 0 : -1,
        data,
        msg: response.ok ? '' : `HTTP error ${response.status}`,
      };
    } catch (err: any) {
      return {
        code: -1,
        msg: err.message || 'Network error',
      };
    }
  }
}

/** 使用 OPFS 和虚拟文件系统的版本 */
export async function initApi_with_opfs() {
  // #region OPFS 准备

  // 获取 OPFS 根目录句柄
  const root = await navigator.storage.getDirectory();

  /* ---------- 路径与句柄工具 ---------- */

  // 将相对路径拆分为段（自动忽略空段和首尾 '/'）
  const splitPath = (relPath: string): string[] =>
    relPath.split('/').filter(seg => seg.length > 0);

  // 逐级获取目录句柄。create = true 时自动创建不存在的目录。
  const getDirectoryHandle = async (
    segments: string[],
    create = false
  ): Promise<FileSystemDirectoryHandle | null> => {
    let current = root;
    for (const seg of segments) {
      try {
        current = await current.getDirectoryHandle(seg, { create });
      } catch {
        return null;
      }
    }
    return current;
  };

  // 获取文件句柄。create = true 时会自动创建父目录及文件本身。
  const getFileHandle = async (
    relPath: string,
    create = false
  ): Promise<FileSystemFileHandle | null> => {
    const segments = splitPath(relPath);
    if (segments.length === 0) return null;   // 根目录不能视为文件
    const dirSegments = segments.slice(0, -1);
    const fileName = segments[segments.length - 1];
    const dirHandle = await getDirectoryHandle(dirSegments, create);
    if (!dirHandle) return null;
    try {
      return await dirHandle.getFileHandle(fileName, { create });
    } catch (e) {
      console.warn('Get file handle error', e);
      return null;
    }
  };

  // #endregion

  // #region 调试工具：打印文件树
  const printFileTree = async () => {
    console.group('🌳 OPFS File Tree');
    const printRecursive = async (
      handle: FileSystemDirectoryHandle,
      prefix: string = ''
    ) => {
      for await (const [name, child] of (handle as any).entries()) {
        if (child.kind === 'directory') {
          console.log(`${prefix}📁 ${name}/`);
          await printRecursive(child, prefix + '  ');
        } else {
          console.log(`${prefix}📄 ${name}`);
        }
      }
    };
    await printRecursive(root);
    console.groupEnd();
  };
  // #endregion

  // // #region 可选的初始化文件夹内容
  // // 定义你想初始创建的目录与文件结构
  // const DEMO_STRUCTURE = {
  //   // 目录使用对象表示，文件使用字符串表示（key 是文件名，value 是文件内容）
  //   'demo-folder': {
  //     type: 'dir',
  //     children: {
  //       'readme.txt': 'Welcome to the demo!',
  //       'config.json': JSON.stringify({ theme: 'dark', version: 1 }),
  //       'sub': {
  //         type: 'dir',
  //         children: {
  //           'note.md': '# Subfolder note',
  //         },
  //       },
  //     },
  //   },
  //   'example.txt': 'This is an example file.',
  //   'data': {
  //     type: 'dir',
  //     children: {
  //       'numbers.csv': '1,2,3\n4,5,6',
  //     },
  //   },
  // };

  //   const initDemoStructure = async (
  //   baseHandle: FileSystemDirectoryHandle,
  //   structure: any
  // ) => {
  //   for (const [name, descriptor] of Object.entries(structure)) {
  //     if (typeof descriptor === 'string') {
  //       // 是文件
  //       const fileHandle = await baseHandle.getFileHandle(name, { create: true });
  //       const writable = await fileHandle.createWritable();
  //       await writable.write(descriptor);
  //       await writable.close();
  //     } else if (descriptor && descriptor.type === 'dir') {
  //       // 是目录
  //       const dirHandle = await baseHandle.getDirectoryHandle(name, { create: true });
  //       await initDemoStructure(dirHandle, descriptor.children || {});
  //     }
  //   }
  // };
  // // #endregion

  global_setting.api.readFolder = async (relPath: string, recursion_depth?: number): Promise<string[]> => {
    const segments = splitPath(relPath);
    const dirHandle = await getDirectoryHandle(segments, false);
    if (!dirHandle) return [];

    const depth = recursion_depth ?? 1;       // 默认仅直接子项
    const result: string[] = [];

    const collect = async (
      handle: FileSystemDirectoryHandle,
      prefix: string,
      level: number
    ) => {
      if (level > depth) return;
      for await (const [name, child] of (handle as any).entries()) {
        const childPath = prefix ? `${prefix}/${name}` : name;
        if (child.kind === 'file') {
          result.push(childPath);
        } else if (child.kind === 'directory') {
          // 目录本身也作为条目返回
          result.push(childPath);
          // 若未达到深度限制则继续递归
          if (level < depth) {
            await collect(child, childPath, level + 1);
          }
        }
      }
    };

    await collect(dirHandle, '', 1);
    return result;
  }

  global_setting.api.readFile = async (relPath: string): Promise<string | null> => {
    const fileHandle = await getFileHandle(relPath, false);
    if (!fileHandle) return null;
    try {
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  global_setting.api.writeFile = async (
    relPath: string,
    content: string,
    is_append?: boolean
  ): Promise<boolean> => {
    if (is_append === undefined) is_append = false

    try {
      const fileHandle = await getFileHandle(relPath, true);
      if (!fileHandle) return false;

      let finalContent = content;
      if (is_append) {
        const existing = await global_setting.api.readFile(relPath);
        finalContent = (existing ?? '') + content;
      }

      const writable = await fileHandle.createWritable();
      await writable.write(finalContent);
      await writable.close();
      return true;
    } catch (e) {
      console.error('OPFS writeFile error:', e);
      return false;
    }
  }

  // --- 初始化时进行调试打印与演示结构创建 ---
  // 1. 打印当前文件系统
  console.log('🔍 Before init demo structure:');
  await printFileTree();

  // 2. （可选）初始化演示目录/文件。如果已有则不覆盖。
  //    这里简单判断：如果根目录下不存在 "demo-folder" 则创建。
  try {
    await root.getDirectoryHandle('demo-folder');
    console.log('ℹ️ Demo structure already exists, skipping creation.');
  } catch {
    console.log('📦 Creating demo structure...');
    console.log('✅ Demo structure created.');
  }

  // 3. 再次打印文件树，确认结构
  console.log('🔍 After init:');
  await printFileTree();
  // --- 初始化结束 ---
}

type EditorRange = {start: number, end: number}

function initApi_editor_get_from_textarea(): null | EditorApi {
  const el = document.activeElement;
  if (!(el instanceof HTMLTextAreaElement)) return null;
  const textarea = el;

  // 适配: React 等受控组件需要用原生 setter 改 value，否则状态会被覆盖
  const nativeValueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value'
  )?.set;
  const setValue = (value: string): void => {
    if (nativeValueSetter) {
      nativeValueSetter.call(textarea, value);
    } else {
      textarea.value = value;
    }
    // 通知框架内容已变化
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // 避免字符串索引溢出出错
  const clamp = (n: number, max: number): number => Math.max(0, Math.min(n, max));

  const editorApi: EditorApi = {
    getRange: (range?: EditorRange): string => {
      // TODO
      // 注意: 这里会将 `\r\n` 换行符规范化为 `\n`，而 selectionText 那边不转换。
      // 这会导致冲突。

      if (!range) return textarea.value

      const value = textarea.value;
      const len = value.length;
      const start = clamp(range.start, len);
      const end = clamp(range.end, len);
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      return value.slice(from, to)
    },

    replaceRange: (text: string, range?: EditorRange): void => {
      const len = textarea.value.length;
      if (range) { // 提供范围时，替换对应范围
        const start = clamp(range.start, len);
        const end = clamp(range.end, len);
        const from = Math.min(start, end);
        const to = Math.max(start, end);

        const value = textarea.value;
        const newValue = value.slice(0, from) + text + value.slice(to);
        setValue(newValue);

        // 将光标放到插入文本的末尾 (TODO 临时，未含光标自动继承并校正)
        const caret = from + text.length;
        textarea.setSelectionRange(caret, caret);
      }
      else { // 未提供范围时，替换整篇内容
        setValue(text);
        const caret = text.length;
        textarea.setSelectionRange(caret, caret);
      }
    },

    replaceRanges(list: {text: string, range: EditorRange}[]) {
      // 从后往前替换，每次修改只影响已处理过的后半部分
      let value = textarea.value;
      const sorted = [...list].sort((a, b) => b.range.start - a.range.start);
      for (const { text, range } of sorted) {
        const start = clamp(Math.min(range.start, range.end), value.length);
        const end = clamp(Math.max(range.start, range.end), value.length);
        value = value.slice(0, start) + text + value.slice(end);
      }
      setValue(value); // 最后统一写回并派发一次 input 事件
    },

    getSelections: (): EditorRange[] => {
      // textarea 只支持单一选区
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // 策略1: 光标为非选中状态时，也认为存在选区
      // if (start === end) return []; // 策略2: 认为无选中内容
      return [{ start, end }];
    },

    setSelection: (selection: EditorRange): void => {
      const len = textarea.value.length;
      const start = clamp(selection.start, len);
      const end = clamp(selection.end, len);
      textarea.setSelectionRange(Math.min(start, end), Math.max(start, end));
      textarea.focus();
    },

    setSelections: (selections: EditorRange[]): void => {
      // textarea 不支持多选区，退化为使用最后一个
      if (selections.length === 0) return;
      editorApi.setSelection(selections[selections.length - 1]);
    },
  };

  return editorApi;
}

function initApi_editor_get_from_editableEl(): null | EditorApi {
  const el = document.activeElement;
  // contenteditable 元素本身或其后代获得焦点时，activeElement 指向宿主元素
  if (!(el instanceof HTMLElement) || !el.isContentEditable) return null;
  const root = el;

  // 偏移量 <-> DOM Range 互转
  // 将 root 内某个 (node, offset) 位置换算成「相对 root 纯文本起点」的字符偏移
  const nodeToOffset = (node: Node, offset: number): number => {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    return range.toString().length;
  };

  // 将绝对字符偏移换算回 `(node, offset)`
  const offsetToNode = (target: number): { node: Node; offset: number } => {
    let remaining = Math.max(0, target);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let last: Text | null = null;

    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      const len = text.data.length;
      if (remaining <= len) {
        return { node: text, offset: remaining };
      }
      remaining -= len;
      last = text;
    }
    // 超出末尾时定位到最后一个文本节点末尾
    if (last) return { node: last, offset: last.data.length };
    // 没有任何文本节点，落到 root 起点
    return { node: root, offset: 0 };
  };

  // 创建 Range 类型选区
  const buildRange = (start: number, end: number): Range => {
    const s = offsetToNode(Math.min(start, end));
    const e = offsetToNode(Math.max(start, end));
    const range = document.createRange();
    range.setStart(s.node, s.offset);
    range.setEnd(e.node, e.offset);
    return range;
  };

  /* TODO 修改内容并保持可撤销（execCommand 会进入 undo 栈）
  const insertText = (text: string): void => {
    const sel = window.getSelection();
    if (!sel) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    // 光标放到插入文本之后
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);
  }; */

  const editorApi: EditorApi = {
    getRange: (range?: EditorRange): string => {
      if (!range) return root.innerText;

      return buildRange(range.start, range.end).toString();
    },

    replaceRange: (text: string, editor_range?: EditorRange): void => {
      if (editor_range) { // 提供范围时，替换对应范围
        const range = buildRange(editor_range.start, editor_range.end);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // 将光标放到插入文本的末尾 (TODO 临时，未含光标自动继承并校正)
        const sel = window.getSelection();
        if (sel) {
          const caret = document.createRange();
          caret.setStartAfter(textNode);
          caret.collapse(true);
          sel.removeAllRanges();
          sel.addRange(caret);
        }

        root.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
      else { // 未提供范围时，替换整篇内容
        root.innerText = text;

        root.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
    },

    replaceRanges(list: {text: string, range: EditorRange}[]) {
      // 从后往前替换，每次修改只影响已处理过的后半部分
      const sorted = [...list].sort((a, b) => b.range.start - a.range.start);
      let lastInserted: Text | null = null;

      for (const { text, range } of sorted) {
        const r = buildRange(range.start, range.end);
        r.deleteContents();
        const textNode = document.createTextNode(text);
        r.insertNode(textNode);
        lastInserted = textNode;
      }

      // 将光标放到最后一个插入的文本末尾（即原文档中 start 最小的那个）
      // if (lastInserted) {
      //   const sel = window.getSelection();
      //   if (sel) {
      //     const caret = document.createRange();
      //     caret.setStartAfter(lastInserted);
      //     caret.collapse(true);
      //     sel.removeAllRanges();
      //     sel.addRange(caret);
      //   }
      // }

      // root.dispatchEvent(new InputEvent('input', { bubbles: true }));
    },

    getSelections: (): EditorRange[] => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return [];
      const ranges: EditorRange[] = [];
      for (let i = 0; i < sel.rangeCount; i++) {
        const range = sel.getRangeAt(i);
        // 只保留落在当前可编辑元素内的选区
        if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
          continue;
        }
        const start = nodeToOffset(range.startContainer, range.startOffset);
        const end = nodeToOffset(range.endContainer, range.endOffset);
        // 策略1: 光标为非选中状态时，也认为存在选区
        // if (start === end) continue; // 策略2: 认为无选中内容
        ranges.push({ start: Math.min(start, end), end: Math.max(start, end) });
      }
      return ranges;
    },

    setSelection: (editor_range: EditorRange): void => {
      root.focus();
      const range = buildRange(editor_range.start, editor_range.end);
      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(range);
    },

    setSelections: (editor_range_list: EditorRange[]): void => {
      const sel = window.getSelection();
      if (!sel) return;
      root.focus();
      sel.removeAllRanges();
      // 浏览器对同一元素内的多 Range 支持有限，逐个 addRange 尝试
      for (const s of editor_range_list) {
        try {
          sel.addRange(buildRange(s.start, s.end));
        } catch {
          // 部分浏览器不支持多 Range，忽略
        }
      }
    },
  };

  return editorApi;
}
