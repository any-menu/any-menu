import { global_setting, UrlRequestConfig, UrlResponse } from '../../../Core/setting'
import { hideWindow } from '../module/window'
import { invoke } from "@tauri-apps/api/core"
import { fetch as tauri_fetch } from '@tauri-apps/plugin-http';

// api适配 (Ob/App/Other 环境)
export function initApi() {
  global_setting.env = 'app'

  global_setting.api.getCursorXY = async () => {
    const pos: any = await invoke("get_caret");
    if (typeof pos === 'string') return { x: -1, y: -1 }
    global_setting.state.selectedText = pos[2] && pos[2].length > 0 ? pos[2] : undefined
    return { x: pos[0], y: pos[1] }
  }

  global_setting.api.getScreenSize = async () => {
    const pos: any = await invoke("get_screen_size");
    if (typeof pos === 'string') return { width: -1, height: -1 }
    return { width: pos[0], height: pos[1] }
  }

  global_setting.api.sendText = async (str: string) => {
    // 非 Tauri 程序中，我们采用了非失焦的方式展开菜单
    // 但 Tauri 程序中，我们采用了失焦的方式展开菜单
    // 这里应该多一个判断。不过这里恒为后者
    hideWindow()
    await new Promise(resolve => setTimeout(resolve, 2)) // 等待一小段时间确保窗口已隐藏且焦点已切换
    // await invoke("paste", { text: 'paste from button' })
    await invoke("send", { text: str, method: global_setting.config.send_text_method })
  }

  global_setting.api.readFile = async (path: string) => {
    const file_content: string|unknown = await invoke("read_file", { path })
    if (typeof file_content !== 'string') {
      console.error("Invalid file content format")
      return null
    }
    return file_content
  }

  global_setting.api.readFolder = async (path: string) => {
    const files: string[]|null = await invoke("read_folder", { path })
    if (typeof files !== 'object' || !Array.isArray(files)) {
      console.error("Invalid directory listing format", path, files)
      return []
    }
    return files
  }

  // 后端为 Tauri 时使用
  // 参考: https://v2.tauri.app/zh-cn/plugin/http-client/ https://v2.tauri.app/zh-cn/reference/javascript/http/
  // 这里的 tauri_fetch 是一个 rust 后端 api，试图与 fetch web api 尽量接近和兼容，一般情况下可当作 fetch 使用
  global_setting.api.urlRequest = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
    try {
      const response = await tauri_fetch(conf.url, {
        method: conf.method || 'GET',
        headers: conf.headers,
        body: conf.body,
      });

      // 返回值适配
      if (!response.ok) {
        // 处理 HTTP 错误状态 (例如 404, 500)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text(); // .data?
      
      // 尝试解析 JSON，如果失败则回退
      let json = null;
      if (conf.isParseJson) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          json = null;
        }
      }
      return {
        code: 0,
        data: {
          text: text,
          json: json,
          originalResponse: response,
        },
      };
    } catch (error: any) {
      console.error('Fetch request failed:', error);
      return {
        code: -1,
        msg: error?.message || 'An unknown error occurred in fetch request.',
        data: {
          text: '',
          originalResponse: error
        }
      };
    }
  }

  // 后端为 nodejs 时使用 (这里不要使用tauri的fetch)
  const old = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
    try {
      const response = await fetch(conf.url, {
        method: conf.method || 'GET',
        headers: conf.headers,
        body: conf.body,
      });

      // 返回值适配
      if (!response.ok) {
        // 处理 HTTP 错误状态 (例如 404, 500)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      
      // 尝试解析 JSON，如果失败则回退
      let json = null;
      if (conf.isParseJson) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          json = null;
        }
      }
      return {
        code: 0,
        data: {
          text: text,
          json: json,
          originalResponse: response,
        },
      };
    } catch (error: any) {
      console.error('Fetch request failed:', error);
      return {
        code: -1,
        msg: error?.message || 'An unknown error occurred in fetch request.',
        data: {
          text: '',
          originalResponse: error
        }
      };
    }
  }
}
