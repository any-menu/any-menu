// #region api适配 (Ob/App/Other 环境)
import { global_setting, UrlRequestConfig, UrlResponse } from '../../Core/setting'
import { global_state, hideWindow } from './module/window'
import { invoke } from "@tauri-apps/api/core"

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

global_setting.api.urlRequest = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
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
    if (!conf.noParseJson) {
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
// #endregion

// #region 启动时阅读配置文件

import { load_config, save_config } from './config'

let is_init = false
async function init() {
  if (!is_init) {
    is_init = true
    const result = await load_config()
    if (result.trim() == '') { console.error('配置文件读取/初始化失败'); return }
    await save_config(result)
  }
}
void init()

// #endregion

// #region Tauri 日志插件

import {
  attachConsole, // 允许使用 webview 查看 rust 日志
  // warn, debug, trace, info, error
} from '@tauri-apps/plugin-log';
window.addEventListener("DOMContentLoaded", async () => {
  await attachConsole();
});

// #endregion

// #region 项目模板 默认的表单功能、与后端沟通

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;

async function greet() {
  if (greetMsgEl && greetInputEl) {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault()
    greet()
  })
})

// #endregion

// 注意api/window里的功能很多都需要开启权限，否则控制台会报错告诉你应该开启哪个权限
import { getCurrentWindow } from '@tauri-apps/api/window'
import { initMenu } from './contextmenu'

// 前端模块
window.addEventListener("DOMContentLoaded", () => {
  const main: HTMLDivElement | null = document.querySelector("#main")
  if (!main) return
  
  void initMenu(main)

  // 黏贴测试 paste test
  /*const paste_btn = document.createElement('button'); main.appendChild(paste_btn); paste_btn.classList.add('btn-2');
    paste_btn.textContent = 'Paste Test'
  paste_btn.onclick = async () => {
    const appWindow = getCurrentWindow()
    appWindow.emit('paste-event', { message: 'paste from button' }) // 无效
    try {
      hideWindow()
      await new Promise(resolve => setTimeout(resolve, 2)) // 等待一小段时间确保窗口已隐藏且焦点已切换
      global_setting.api.sendText('paste from button')
    } catch (error) {
      console.error("Failed to insert text:", error);
    }
    console.log('emit paste-event')
  }*/

  // 置顶按钮 (仅 debug 时显示)
  if (!global_setting.isDebug) return;
  const pin_btn = document.createElement('button'); main.appendChild(pin_btn); pin_btn.classList.add('btn-1');
  // https://lucide.dev/icons/pin
  pin_btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`
  pin_btn.onclick = async () => {
    const appWindow = getCurrentWindow()
    global_state.isPin = !global_state.isPin
    if (global_state.isPin) {
      pin_btn.classList.add('active')
      await appWindow.setAlwaysOnTop(true)  // 置顶窗口
      document.body.setAttribute('style', 'background: rgba(0, 0, 0, 0.5) !important')
    }
    else {
      pin_btn.classList.remove('active')
      await appWindow.setAlwaysOnTop(false) // 取消置顶但保持在前台
      document.body.setAttribute('style', 'background: transparent')
    }
  }
})
