import { invoke } from "@tauri-apps/api/core"

// 注意api/window里的功能很多都需要开启权限
import { getCurrentWindow } from '@tauri-apps/api/window'
import { cursorPosition } from '@tauri-apps/api/window'

// #region 默认的表单功能

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
    e.preventDefault();
    greet();
  });
});

// #endregion

// #region 全局快捷键

import { register } from '@tauri-apps/plugin-global-shortcut'

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

// #endregion

/** 窗口控制函数 */
async function toggleWindow() {
  const appWindow = getCurrentWindow()
  
  try {
    const isVisible = await appWindow.isVisible() // 检查窗口是否可见
    const isFocused = await appWindow.isFocused() // 窗口是否聚焦
    
    if (isFocused) {
      await appWindow.hide()
    } else {
      const cursor = await cursorPosition() // 光标位置
      cursor.x += 5
      cursor.y += 5
      await appWindow.setPosition(cursor)

      await appWindow.show()
      await appWindow.setFocus() // 聚焦窗口
        // 这是必须的，否则不会显示/置顶窗口。注意作为菜单窗口而言，窗口消失时要恢复聚焦与光标

      // await appWindow.setAlwaysOnTop(true)  // 置顶窗口
      // await appWindow.setAlwaysOnTop(false) // 取消置顶但保持在前台
    }
  } catch (error) {
    console.error('Window show fail:', error)
  }
}
