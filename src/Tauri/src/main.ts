/** 主面板相关 */

import { global_setting } from '../../Core/shared/setting'
import { initApi } from './utils/initApi'
import { invoke } from "@tauri-apps/api/core"

initApi()

// #region 启动时阅读配置文件

let is_init = false
async function init() {
  if (is_init) return
  is_init = true
  const result = await global_setting.api.loadConfig()
  if (!result) { console.error('配置文件读取/初始化失败'); return }
}

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

import { initMenu } from './panels'

// 前端模块
window.addEventListener("DOMContentLoaded", async () => {
  const main_el: HTMLDivElement | null = document.querySelector("#main")
  if (!main_el) return

  await init() // 保证先读取配置再初始化别的

  void initMenu(main_el)

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
})
