import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from '@tauri-apps/api/window';

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

// #region 全局快捷键

import { register } from '@tauri-apps/plugin-global-shortcut'

register('CommandOrControl+Space', (event) => { // CommandOrControl+Shift+Space
  if (event.state !== 'Pressed') return // Pressed/Released

  console.log('Shortcut triggered', event)
  toggleWindow()
})

// #endregion

/** 窗口控制函数 */
async function toggleWindow() {
  const appWindow = getCurrentWindow();
  
  try {
    // 检查窗口是否可见
    const isVisible = await appWindow.isVisible();
    
    if (isVisible) {
      // 如果窗口可见，则隐藏窗口
      await appWindow.hide()
    } else {
      // 如果窗口隐藏，则显示窗口
      await appWindow.show()
      await appWindow.setFocus() // 聚焦窗口
        // 这是必须的，否则不会显示/置顶窗口。注意作为菜单窗口而言，窗口消失时要恢复聚焦与光标

      // await appWindow.setAlwaysOnTop(true)  // 置顶窗口
      // await appWindow.setAlwaysOnTop(false) // 取消置顶但保持在前台
    }
  } catch (error) {
    console.error('Window show fail:', error);
  }
}
