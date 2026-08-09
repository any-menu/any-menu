/**
 * 这里采用的 api 实现是 OPFS
 * 优点：无后端 + 持久化，除了适合快速本地调试，还适合线上演示
 */

import type { UrlResponse, UrlRequestConfig, UrlResponseData } from "../../../Type";
import { global_setting } from "@/Core/shared/setting";
import { activeAMPanel } from '@/Core/panels/MulPanel';

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

  // const old_sendText = global_setting.api.sendText
  global_setting.api.sendText = async (text: string) => {
    activeAMPanel?.panel_hide()
    EditorTools.recoverCursor(text)
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
    try {
      await request<boolean>('/writeFile', {
        relPath,
        content,
        is_append: is_append ?? false,
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

  global_setting.api.writeFile = async (relPath: string, content: string, isAppend?: boolean): Promise<boolean> => {
    try {
      const fileHandle = await getFileHandle(relPath, true);
      if (!fileHandle) return false;

      let finalContent = content;
      if (isAppend) {
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

/** textarea 简易编辑器管理
 * 主要管理聚焦转移和恢复时的聚焦状态和光标位置恢复
 */
export namespace EditorTools {

  // 召唤面板时对应的文本编辑器
  // 包括: 要保存的光标状态
  interface TextInputCursorState {
    element: HTMLTextAreaElement | HTMLInputElement; // 目标元素
    // selectedText // 这个直接保存到状态中
    start: number;
    end: number;
  }

  export const state: {
    savedCursorState: TextInputCursorState | null
  } = {
    savedCursorState: null
  }
  
  // 保存光标状态
  export function saveCurrentCursor(element: HTMLTextAreaElement): void {
    // 选中文本，两方法:
    // - getSelection 版 (当前)
    // - selectionStart 和 selectionEnd 获取版
    //   - 仅表单元素、仅纯文本

    // 不保存选中状态，因为这里是失焦点触发，失焦时选中项会丢失，为空。但我们要保留之前的选中状态
    // const selection = document.getSelection()
    // global_setting.state.selectedText = selection?.toString() ?? undefined

    // 其他状态
    state.savedCursorState = {
      element,
      start: element.selectionStart,
      end: element.selectionEnd,
    }
  }

  // 恢复光标位置
  // (可选) 可以顺便在光标位置插入文本内容
  export function recoverCursor(insertText: string = '') {
    // 1. 获取保存的状态
    if (!state.savedCursorState || !document.contains(state.savedCursorState.element)) {
      return;
    }
    let { element } = state.savedCursorState;

    // 2. 光标原位置信息获取
    // 先查看是否已经是聚焦状态，如果是，则使用当前的光标位置，而非从状态中更新
    let start: number, end: number;
    if (document.activeElement === element) { // 已聚焦 → 使用当前实际光标位置
      start = element.selectionStart ?? 0;
      end = element.selectionEnd ?? 0;
    } else { // 未聚焦 → 使用保存的光标位置
      start = state.savedCursorState.start;
      end = state.savedCursorState.end;
    }

    // 3. 获取当前值和新值，设置文本
    const currentValue = element.value;
    const newValue = 
      currentValue.substring(0, start) + 
      insertText + 
      currentValue.substring(end);
    element.value = newValue;

    // 4. 计算新的光标位置，设置光标位置和聚焦状态
    const newCursorPos = start + insertText.length;
    element.selectionStart = newCursorPos;
    element.selectionEnd = newCursorPos;
    element.focus();

    // 5. 清空/更新保存的状态
    state.savedCursorState.start = newCursorPos
    state.savedCursorState.end = newCursorPos
    // state.savedCursorState = null; // (可选) 清空以防止重复使用
  }
}
