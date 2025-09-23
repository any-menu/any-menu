import { global_state, hideWindow } from './window'

// #region 项目模板 默认的表单功能、与后端沟通

import { invoke } from "@tauri-apps/api/core"

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

// 前端模块
import { ABContextMenu } from "./contextmenu"
import { root_menu_demo } from "./contextmenu/demo"
window.addEventListener("DOMContentLoaded", () => {
  const main: HTMLDivElement | null = document.querySelector("#main")
  if (!main) return
  const myMenu = new ABContextMenu(main)
  myMenu.append_data([
    {
      label: 'Markdown',
      children: [
        { label: "表格" },
        { label: "引用" },
        { label: "代码块" },
        { label: "公式块" },
        { label: "有序列表" },
        { label: "无序列表" },
        { label: "---" },
        { label: "标题" },
        { label: "分割线" },
        { label: "粗体" },
        { label: "斜体" },
      ]
    },
    {
      label: 'AnyBlock',
      children: root_menu_demo
    },
    {
      label: 'Callout',
      children: []
    },
    {
      label: 'Mermaid',
      children: []
    },
    {
      label: 'Plantuml',
      children: []
    },
    {
      label: 'Emoji',
      children: []
    },
    {
      label: '颜表情',
      children: []
    }
  ])
  // myMenu.attach(main)

  // 黏贴测试 paste test
  const paste_btn = document.createElement('button'); main.appendChild(paste_btn); paste_btn.classList.add('btn-2');
    paste_btn.textContent = 'Paste Test'
  paste_btn.onclick = async () => {
    const appWindow = getCurrentWindow()
    appWindow.emit('paste-event', { message: 'paste from button' }) // 无效
    try {
      hideWindow()
      await new Promise(resolve => setTimeout(resolve, 2)) // 等待一小段时间确保窗口已隐藏且焦点已切换
      await invoke("paste", { text: 'paste from button' })
    } catch (error) {
      console.error("Failed to insert text:", error);
    }
    console.log('emit paste-event')
  }

  // 置顶按钮
  const pin_btn = document.createElement('button'); main.appendChild(pin_btn); pin_btn.classList.add('btn-1');
  // https://lucide.dev/icons/pin
  pin_btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`
  pin_btn.onclick = async () => {
    const appWindow = getCurrentWindow()
    global_state.isPin = !global_state.isPin
    if (global_state.isPin) {
      pin_btn.classList.add('active')
      await appWindow.setAlwaysOnTop(true)  // 置顶窗口
    }
    else {
      pin_btn.classList.remove('active')
      await appWindow.setAlwaysOnTop(false) // 取消置顶但保持在前台
    }
  }

  // 退出程序按钮 - 类似系统托盘的退出功能
  const quit_btn = document.createElement('button'); main.appendChild(quit_btn); quit_btn.classList.add('btn-1');
  quit_btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>`
  quit_btn.title = "退出程序 (Ctrl+Alt+Q)"
  quit_btn.onclick = async () => {
    if (confirm('确定要退出程序吗？')) {
      await invoke("quit_app")
    }
  }

  // 添加托盘功能说明
  const info_div = document.createElement('div'); main.appendChild(info_div); info_div.classList.add('tray-info');
  info_div.innerHTML = `
    <div style="font-size: 12px; color: #666; margin: 10px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
      <div><strong>托盘式操作:</strong></div>
      <div>• 关闭窗口 = 隐藏到后台</div>
      <div>• Ctrl+Space / Alt+A = 显示/隐藏</div>
      <div>• Ctrl+Alt+Q = 完全退出程序</div>
      <div>• Ctrl+Alt+H = 隐藏窗口</div>
      <div>• Ctrl+Alt+S = 显示窗口</div>
    </div>
  `
})
