/**
 * 与窗口相关的工作
 * 
 * 窗口显示/隐藏相关
 */

import { register } from '@tauri-apps/plugin-global-shortcut'
// 注意api/window里的功能很多都需要开启权限，否则控制台会报错告诉你应该开启哪个权限
import { getCurrentWindow, cursorPosition } from '@tauri-apps/api/window'

import { SEARCH_DB } from '../../../Core/seach/SearchDB'

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
  cacheMenuSize()
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
    // event.stopPropagation() // 阻止事件冒泡，确保点击窗口内部不会触发隐藏 // 不要阻止，会有按钮和点击事件
    return
  })

  // // 策略二：监听鼠标移动事件 (缺点: 穿透后就无法再有mouseover事件了，无法恢复不穿透状态)
  // // document.addEventListener('mousemove', (event) => {
  // document.addEventListener('mouseover', (event) => {
  //   const target = event.target as Node
    
  //   console.log('mouseover', target)
    
  //   // b1. 满足所有条件则点击穿透
  //   if (!mainElement) {}
  //   else if (target === mainElement || !mainElement.contains(target)) { // 自己是否包含自己会返回true，要多判断一下
  //     console.log('through')
  //     // event.preventDefault()
  //     appWindow.setIgnoreCursorEvents(true) // 临时开启点击穿透
  //     // hideWindow()
  //     return
  //   }
  //   // b2. 否则不穿透
  //   appWindow.setIgnoreCursorEvents(false)
  //   return
  // })

  // // 策略三: 策略二 + 定时器重新启用鼠标事件
  // // 缺点: 可能导致异常频繁刷新。所以可能要用其他方法进一步约束 (有改进空间)
  // document.addEventListener('mousemove', (event) => {
  //   const target = event.target as Node
    
  //   console.log('mouseover', target)
    
  //   // b1. 满足所有条件则点击穿透
  //   if (!mainElement) {}
  //   else if (target === mainElement || !mainElement.contains(target)) { // 自己是否包含自己会返回true，要多判断一下
  //     console.log('through')
  //     // event.preventDefault()
  //     appWindow.setIgnoreCursorEvents(true) // 临时开启点击穿透
  //     setTimeout(() => { // 临时恢复并重新检测
  //       document.body.style.pointerEvents = 'auto'
  //       appWindow.setIgnoreCursorEvents(false)
  //     }, 200)
  //     // hideWindow()
  //     return
  //   }
  //   // b2. 否则不穿透
  //   appWindow.setIgnoreCursorEvents(false)
  //   return
  // })

  // 策略四：点击事件的基础上去再模拟一个同坐标的点击事件 (需要 rust 后端配合)

  // 策略五：局限于自带的菜单系统

  // 策略六：全局监听鼠标位置 (需要 rust 后端配合)
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

  // // 监听鼠标点击事件（检测点击外部）
  // document.addEventListener('click', (event) => {
  //   // 阻止事件冒泡，确保点击窗口内部不会触发隐藏
  //   event.stopPropagation()
  // })

  // // 监听全局鼠标事件（通过窗口边界检测）
  // document.addEventListener('mouseleave', () => {
  //   if (!global_state.isWindowVisible) return
  //   // 鼠标离开窗口区域时延迟隐藏
  //   global_state.hideTimeout = window.setTimeout(() => {
  //     hideWindow()
  //   }, 200) // 给用户一点时间重新进入窗口
  // })

  // // 鼠标重新进入窗口时取消隐藏
  // document.addEventListener('mouseenter', () => {
  //   if (global_state.hideTimeout) {
  //     clearTimeout(global_state.hideTimeout)
  //     global_state.hideTimeout = null
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
export async function hideWindow() {
  if (!global_state.isWindowVisible) return // 可注释
  if (global_state.isPin) return

  const appWindow = getCurrentWindow()

  await appWindow.hide(); global_state.isWindowVisible = false;
}

import { invoke } from "@tauri-apps/api/core"
import { global_setting } from '../../../Core/Setting'

global_setting.api.getCursorXY = async () => {
  const pos: any = await invoke("get_caret_xy");
  if (typeof pos === 'string') return { x: -1, y: -1 }
  return { x: pos[0], y: pos[1] }
}
global_setting.api.getScreenSize = async () => {
  const pos: any = await invoke("get_screen_size");
  if (typeof pos === 'string') return { width: -1, height: -1 }
  return { width: pos[0], height: pos[1] }
}

/** 缓存菜单尺寸 (仅一级菜单) */
let menuSize = { width: -1, height: -1 }
async function cacheMenuSize() {
  await new Promise(resolve => setTimeout(resolve, 500)) // 延时等待渲染完成
  const el_search = document.querySelector('#main>.am-search');
  const el_menu = document.querySelector('#main>.ab-context-menu');

  menuSize.height = (el_search?.clientHeight ?? 0) + (el_menu?.clientHeight ?? 0)
  menuSize.width = Math.max(el_search?.clientWidth ?? 0, el_menu?.clientWidth ?? 0)
  // console.log('菜单尺寸:', menuSize);
}

/** 显示窗口，并自动定位到光标/鼠标位置 */
async function showWindow() {
  // s1. 鼠标位置 (类似于quciker app)
  const appWindow = getCurrentWindow()
  const cursor = await cursorPosition()
  cursor.x += 0
  cursor.y += 2
  // console.log('鼠标坐标:', cursor);

  // s2. 光标位置 (类似于windows自带的 `win+.` 面板)
  let cursor2 = await global_setting.api.getCursorXY()
  // console.log('光标坐标:', cursor);
  if (cursor2.x < 0 || cursor2.y < 0) {
    console.error('getCursorXY failed, use mouse position instead')
    cursor2 = cursor
  }
  else {
    cursor.x = cursor2.x; cursor.y = cursor2.y;
  }
   
  // s3. 屏幕中间位置计算 (类似于 wox/utools app)
  
  // 屏幕尺寸
  // 这里需要注意这里的屏幕尺寸，暂时为窗口所在的屏幕尺寸 (若有需要，可以将该api修改成其他含义)
  const screenSize = await global_setting.api.getScreenSize()
  // console.log('屏幕尺寸:', screenSize);

  // 最终坐标 (优先用光标，其次用鼠标坐标，然后坐标纠正避免溢出屏幕)
  // 目前仅纠正y轴坐标，默认预留windows状态栏高度48px
  // TODO 纠正x轴坐标
  // TODO 若采用光标模式，应该不是触底生成，而是在光标上方生成
  if (menuSize.height > 0) {
    if (screenSize.height - 48 - cursor.y < menuSize.height) {
      cursor.y = screenSize.height - 48 - menuSize.height
    }
  }
  console.log('最终坐标:', cursor);

  await appWindow.setPosition(cursor) // 先移动再显示，await应该不用删
  await appWindow.setIgnoreCursorEvents(false) // 关闭点击穿透 (点击透明部分可能会临时打开)
  await appWindow.show(); global_state.isWindowVisible = true;
  await appWindow.setFocus() // 聚焦窗口
    // 这是必须的，否则不会显示/置顶窗口。注意作为菜单窗口而言，窗口消失时要恢复聚焦与光标

  if (SEARCH_DB.el_search != null) SEARCH_DB.el_search.show() // 显示&聚焦搜索框
}
