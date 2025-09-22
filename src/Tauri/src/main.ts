import { invoke } from "@tauri-apps/api/core"

// 注意api/window里的功能很多都需要开启权限
import { getCurrentWindow } from '@tauri-apps/api/window'
import { cursorPosition } from '@tauri-apps/api/window'

// #region 默认的表单功能、与后端沟通

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

// #region 窗口显示/隐藏相关

import { register } from '@tauri-apps/plugin-global-shortcut'

/** 事件组、全局快捷键 */
window.addEventListener("DOMContentLoaded", () => {
  initAutoHide()
})
register('CommandOrControl+Space', (event) => { // CommandOrControl+Shift+Space
  if (event.state !== 'Pressed') return // Pressed/Released

  console.log('Shortcut triggered1', event)
  toggleWindow()
})
register('Alt+A', (event) => {
  if (event.state !== 'Pressed') return // Pressed/Released

  console.log('Shortcut triggered2', event)
  toggleWindow()
})

/** 窗口切换是否显示 */
async function toggleWindow() {  
  try {
    const appWindow = getCurrentWindow()
    // const isVisible = await appWindow.isVisible() // 检查窗口是否可见
    const isFocused = await appWindow.isFocused() // 窗口是否聚焦
    
    if (isFocused) {
      await hideWindow()
    } else {
      await showWindow()
    }
  } catch (error) {
    console.error('Window show fail:', error)
  }
}

let global_isPin = false // 是否置顶
let global_isWindowVisible = false // 当前窗口是否可见 (可以去掉而是实时获取)
let hideTimeout: number | null = null // 定时器，用于延时隐藏、防抖 (感觉不太需要? 延时加多了反而有种性能差的感觉)

// 自动隐藏功能
function initAutoHide() {
  
  // 监听窗口失焦事件
  const appWindow = getCurrentWindow()
  appWindow.onFocusChanged(({ payload: focused }) => {
    console.log('Focus changed:', focused)
    // 失焦
    if (!focused) {
      hideTimeout = window.setTimeout(() => {
        hideWindow() // 该行可临时注释以进行调试
      }, 1)
    }
    // 重新获得焦点
    else if (focused && hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  })

  // 监听鼠标点击事件（检测点击外部）
  document.addEventListener('click', (event) => {
    // 阻止事件冒泡，确保点击窗口内部不会触发隐藏
    event.stopPropagation();
  })

  // // 监听全局鼠标事件（通过窗口边界检测）
  // document.addEventListener('mouseleave', () => {
  //   if (!global_isWindowVisible) return
  //   // 鼠标离开窗口区域时延迟隐藏
  //   hideTimeout = window.setTimeout(() => {
  //     hideWindow()
  //   }, 200) // 给用户一点时间重新进入窗口
  // })

  // // 鼠标重新进入窗口时取消隐藏
  // document.addEventListener('mouseenter', () => {
  //   if (hideTimeout) {
  //     clearTimeout(hideTimeout)
  //     hideTimeout = null
  //   }
  // })

  // ESC键隐藏窗口
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideWindow()
    }
  })
}

/** 隐藏窗口 */
async function hideWindow() {
  if (!global_isWindowVisible) return // 可注释
  if (global_isPin) return

  const appWindow = getCurrentWindow()

  await appWindow.hide(); global_isWindowVisible = false;
}

/** 显示窗口，并自动定位到光标位置 */ 
async function showWindow() {
  const appWindow = getCurrentWindow()

  const cursor = await cursorPosition() // 光标位置
  cursor.x += 0
  cursor.y += 2
  await appWindow.setPosition(cursor)
  
  // TODO 动态计算大小
  // TODO 动态计算边界，是否超出屏幕，若是，进行位置纠正
  // await appWindow.setSize({ width: 240, height: 320 })

  await appWindow.show(); global_isWindowVisible = true;
  await appWindow.setFocus() // 聚焦窗口
    // 这是必须的，否则不会显示/置顶窗口。注意作为菜单窗口而言，窗口消失时要恢复聚焦与光标

  // await appWindow.setAlwaysOnTop(true)  // 置顶窗口
  // await appWindow.setAlwaysOnTop(false) // 取消置顶但保持在前台
}

// #endregion

// 前端模块
import { ABContextMenu } from "./contextmenu"
import { root_menu_demo } from "./contextmenu/demo"
window.addEventListener("DOMContentLoaded", () => {
  const main: HTMLDivElement | null = document.querySelector("#main")
  if (!main) return
  const myMenu = new ABContextMenu(main)
  myMenu.append_data([
    {
      label: 'AnyBlock',
      children: root_menu_demo
    },
    {
      label: 'mermaid',
      children: []
    },
    {
      label: 'plantuml',
      children: []
    }
  ])
  myMenu.attach(main)

  // 置顶按钮
  const btn = document.createElement('button'); main.appendChild(btn); btn.textContent = 'Pin';
  btn.onclick = async () => {
    global_isPin = !global_isPin
  }
})
