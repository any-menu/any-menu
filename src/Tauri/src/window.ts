/**
 * 与窗口相关的工作
 * 
 * 窗口显示/隐藏相关
 */

import { register } from '@tauri-apps/plugin-global-shortcut'
import { invoke } from "@tauri-apps/api/core"
// 注意api/window里的功能很多都需要开启权限，否则控制台会报错告诉你应该开启哪个权限
import { getCurrentWindow, cursorPosition } from '@tauri-apps/api/window'

export const global_state: {
  isPin: boolean // 是否置顶
  isWindowVisible: boolean // 当前窗口是否可见 (可以去掉而是实时获取)
  hideTimeout: number | null // 定时器，用于延时隐藏、防抖 (感觉不太需要? 延时加多了反而有种性能差的感觉)
} = {
  isPin: false,
  isWindowVisible: false,
  hideTimeout:  null
}

/** 事件组、全局快捷键 */
window.addEventListener("DOMContentLoaded", () => {
  initAutoHide()
  initClickThroughBehavior()
  initTrayKeyboardShortcuts()
})
registerShortcuts()

/** 注册全局快捷键 */
function registerShortcuts() {
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
}

/** 添加类似托盘的键盘快捷键 */
function initTrayKeyboardShortcuts() {
  // 为没有系统托盘的情况添加快捷键
  register('CommandOrControl+Alt+Q', (event) => {
    if (event.state !== 'Pressed') return
    
    console.log('Quit application shortcut triggered')
    quitApp()
  })
  
  register('CommandOrControl+Alt+H', (event) => {
    if (event.state !== 'Pressed') return
    
    console.log('Hide window shortcut triggered')
    hideWindow()
  })
  
  register('CommandOrControl+Alt+S', (event) => {
    if (event.state !== 'Pressed') return
    
    console.log('Show window shortcut triggered')
    showWindow()
  })
}

/** 窗口切换是否显示 - 使用 Rust 后端 */
async function toggleWindow() {  
  try {
    await invoke("toggle_window")
    // 更新本地状态
    const appWindow = getCurrentWindow()
    const isVisible = await appWindow.isVisible()
    global_state.isWindowVisible = isVisible
  } catch (error) {
    console.error('Toggle window failed:', error)
  }
}

/** 显示窗口 - 使用 Rust 后端 */
async function showWindow() {
  try {
    const appWindow = getCurrentWindow()
    appWindow.setIgnoreCursorEvents(false) // 关闭点击穿透
    
    // 设置窗口位置到光标位置
    const cursor = await cursorPosition()
    cursor.x += 0
    cursor.y += 2
    await appWindow.setPosition(cursor)
    
    await invoke("show_window")
    global_state.isWindowVisible = true
  } catch (error) {
    console.error('Show window failed:', error)
  }
}

/** 隐藏窗口 - 使用 Rust 后端 */
export async function hideWindow() {
  if (!global_state.isWindowVisible) return
  if (global_state.isPin) return

  try {
    await invoke("hide_window")
    global_state.isWindowVisible = false
  } catch (error) {
    console.error('Hide window failed:', error)
  }
}

/** 退出应用程序 - 类似托盘的退出功能 */
async function quitApp() {
  try {
    await invoke("quit_app")
  } catch (error) {
    console.error('Quit app failed:', error)
  }
}

/** 点击穿透逻辑。点击 #main内的元素不穿透，否则穿透 */
function initClickThroughBehavior() {
  const appWindow = getCurrentWindow()
  const mainElement = document.querySelector('#main')

  // 有多种策略实现，最后选用性能最好，实现最简单的策略一。虽然效果不是最佳的

  // 策略一：监听点击事件 (缺点: 点击的那一下无法穿透，只是能起隐藏窗口的作用)
  // document.addEventListener('click', (event) => {
  document.addEventListener('mousedown', (event) => {
    const target = event.target as Node
    
    // b1. 满足所有条件则点击穿透
    if (!mainElement) {}
    else if (target === mainElement || !mainElement.contains(target)) { // 自己是否包含自己会返回true，要多判断一下
      console.log('click through')
      event.preventDefault()
      document.body.style.pointerEvents = 'none'
      appWindow.setIgnoreCursorEvents(true) // 临时开启点击穿透
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto'
        appWindow.setIgnoreCursorEvents(false)
      }, 100)
      hideWindow()
      return
    }
    // b2. 否则不穿透
    event.stopPropagation() // 阻止事件冒泡，确保点击窗口内部不会触发隐藏
    return
  })
}

/** 自动隐藏功能、鼠标穿透功能 */
function initAutoHide() {
  // 监听窗口失焦事件
  const appWindow = getCurrentWindow()
  appWindow.onFocusChanged(({ payload: focused }) => {
    // 失焦
    if (!focused) {
      global_state.hideTimeout = window.setTimeout(() => {
        hideWindow() // 该行可临时注释以进行调试
      }, 1)
    }
    // 重新获得焦点
    else if (focused && global_state.hideTimeout) {
      clearTimeout(global_state.hideTimeout)
      global_state.hideTimeout = null
    }
  })

  // ESC键隐藏窗口
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideWindow()
    }
  })
}
