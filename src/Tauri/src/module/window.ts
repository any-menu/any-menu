/**
 * 与窗口相关的工作
 * 
 * 窗口显示/隐藏相关
 */

// 注意api/window里的功能很多都需要开启权限，否则控制台会报错告诉你应该开启哪个权限
import {
  getCurrentWindow, cursorPosition, Window as TauriWindow, type PhysicalPosition
} from '@tauri-apps/api/window'
import { AMPanel } from '../../../Core/panel/'

import { setupAppChangeListener } from './focus'
setupAppChangeListener()

export const global_state: {
  isWindowVisible: boolean // 当前窗口是否可见 (可以去掉而是实时获取)
  hideTimeout: number | null // 定时器，用于延时隐藏、防抖 (感觉不太需要? 延时加多了反而有种性能差的感觉)
} = {
  isWindowVisible: false,
  hideTimeout:  null
}

/** 窗口切换是否显示 */
export async function toggleWindow(panel_list?: string[]) {  
  try {
    const appWindow = getCurrentWindow()
    // const isVisible = await appWindow.isVisible() // 检查窗口是否可见
    const isFocused = await appWindow.isFocused() // 窗口是否聚焦
    
    if (isFocused) {
      await hideWindow()
    } else {
      await showWindow('cursor', panel_list)
    }
  } catch (error) {
    console.error('Window show fail:', error)
  }
}

// #region 窗口隐藏相关

/** 事件组、全局快捷键 */
window.addEventListener("DOMContentLoaded", () => {
  initAutoHide()
  // initClickThroughBehavior()
})

///** 点击穿透逻辑。点击 #main内的元素不穿透，否则穿透
// * @deprecated 废弃
// *   替代方案: 为 Core 模块实现 app_hide，由 Panel 模块控制，Paenl 穿透事件时进行窗口隐藏
// *   废弃原因: 这里只能检测一个 "矩形减矩形" (#main 减 .am-panel) 的区域
// *     而交于 Panel 检测区域更灵活: "矩形减矩形" 加上 .am-panel 中没有并子面板填充的地方，可检测更复杂的区域
// */
/*function initClickThroughBehavior() {
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
}*/

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

// #endregion

import { global_setting } from '../../../Core/setting'

// /** 缓存菜单尺寸 (仅一级菜单)
//  * 
//  * 弃用: 目前的面板通过包含的子面板去计算，而非固定的
//  */
// let menuSize = { width: -1, height: -1 }
// async function cacheMenuSize() {
//   await new Promise(resolve => setTimeout(resolve, 500)) // 延时等待渲染完成
//   const el_search = document.querySelector('#main>.am-search');
//   const el_menu = document.querySelector('#main>.am-context-menu');
// 
//   menuSize.height = (el_search?.clientHeight ?? 0) + (el_menu?.clientHeight ?? 0)
//   menuSize.width = Math.max(el_search?.clientWidth ?? 0, el_menu?.clientWidth ?? 0)
//   // console.log('菜单尺寸:', menuSize);
// }

if (global_setting.platform === 'app') {
  global_setting.other.app_show = showWindow
  global_setting.other.app_hide = hideWindow
}
/** 显示窗口，并自动定位到光标/鼠标位置 */
async function showWindow(pos?: 'cursor'|'center', panel_list?: string[]) {
  if (global_setting.isDebug) global_setting.state.infoText = ""

  // 获取当前选择的文本
  // @deprecated 这里应废弃
  // - 这里的 selectedText 会被后面的 getCursorXY 覆盖
  //   前者使用的是剪切板，但剪切板ctrl+c到内容改变之间太慢了，无法判断延时时间
  //   后者使用的是Win32::UI::Accessibility，速度快且准确
  // - 而且应该先获取光标和窗口信息，如果 app_no_use_in_ob/白名单 选项触发，就不应该执行 ctrl+c 及任何操作，避免覆盖操作
  // invoke("get_selected").then((selected: any) => {
  //   if (!selected || typeof selected !== 'string') return
  //   global_setting.state.selectedText = selected.length > 0 ? selected : undefined
  // });

  let appWindow = await TauriWindow.getByLabel('main')
  if (!appWindow) appWindow = getCurrentWindow() // 弱化版，可能会对应应用的多个窗口

  // 计算并应用坐标
  let cursor: PhysicalPosition
  // TODO 设置 class 告知 Panel 目前的外部窗口是居中还是鼠标显示
  if (pos === 'cursor') {
    // step1. 鼠标位置 (类似于quciker app)
    cursor = await cursorPosition()
    if (global_setting.isDebug) global_setting.state.infoText += `[mousePosition]\nx:${cursor.x}, y:${cursor.y}\n\n`
    cursor.x += 0
    cursor.y += 2

    // step2. 光标位置 (类似于windows自带的 `win+.` 面板)
    // 注意: 这里会同时自动更新 selectedText
    let cursor2 = await global_setting.api.getCursorXY()
    if (global_setting.isDebug) global_setting.state.infoText += `[cursorPosition]\nx:${cursor2.x}, y:${cursor2.y}\n\n`
    if (global_setting.isDebug) global_setting.state.infoText += `[selectedText]\ntext:${global_setting.state.selectedText}\n\n`
    let cursor2_flag = false // 是否成功获取到光标坐标
    // console.log('光标坐标:', cursor);
    // -1 表示获取不到光标坐标，可以使用鼠标坐标
    if (cursor2.x < 0 || cursor2.y < 0) {
      console.warn('getCursorXY failed, use mouse position instead')
      // cursor2 = cursor
    }
    // 弃用。改为黑名单注销全局快捷键的方式
    // 其他负数表示不应该使用光标坐标，且不应该显示窗口 (如 app_no_use_in_ob/白名单 选项)
    // else if (cursor2.x < 0 || cursor2.y < 0) {
    //   console.warn('app_no_use_in_ob option enabled, do not show window in Obsidian. but feat in todo')
    //   cursor2 = cursor
    // }
    // 正常获取
    else {
      cursor2_flag = true
      cursor.x = cursor2.x; cursor.y = cursor2.y;
    }

    // step3. 屏幕尺寸
    // 这里需要注意这里的屏幕尺寸，暂时为窗口所在的屏幕尺寸 (若有需要，可以将该api修改成其他含义)
    // 此处也可以计算屏幕中间位置，作为菜单的生成位置 (类似于 wox/utools app)
    let screenSize = await global_setting.api.getScreenSize()
    if (global_setting.isDebug) global_setting.state.infoText += `[screenSize]\nwidth:${screenSize.width}, height:${screenSize.height}\n\n`
    screenSize.height -= 48 // 默认预留windows状态栏高度48px

    // step4. 最终坐标。触底对齐/反向显示 (优先用光标，其次用鼠标坐标，然后坐标纠正避免溢出屏幕)
    // TODO 纠正x轴坐标，目前仅纠正y轴坐标
    const panel_size = AMPanel.get_size(panel_list)
    const over_mode = cursor2_flag ? "revert" : "side"
    const cursor3 = AMPanel.fix_position(screenSize, panel_size, cursor, over_mode)
    cursor.x = cursor3.x; cursor.y = cursor3.y;
    if (global_setting.isDebug) global_setting.state.infoText += `[finialPosition]\nover_mode:${over_mode}, x:${cursor.x}, y:${cursor.y}\n\n`

    await appWindow.setPosition(cursor) // 先移动再显示，await应该不用删
    const el = document.querySelector('#main') as HTMLElement|null
    if (el) el.dataset.positionMode = 'cursor'
  } else if (pos === 'center') {
    cursor = await cursorPosition() // 仅用于提供类型 (含 x,y 以外的信息)

    // 屏幕尺寸
    // 这里需要注意这里的屏幕尺寸，暂时为窗口所在的屏幕尺寸 (若有需要，可以将该api修改成其他含义)
    // 此处也可以计算屏幕中间位置，作为菜单的生成位置 (类似于 wox/utools app)
    let screenSize = await global_setting.api.getScreenSize()
    if (global_setting.isDebug) global_setting.state.infoText += `[screenSize]\nwidth:${screenSize.width}, height:${screenSize.height}\n\n`
    screenSize.height -= 48 // 默认预留windows状态栏高度48px
    // console.log('屏幕尺寸:', screenSize);

    // 窗口大小
    const windowsSize = {
      width: 1000,
      height: 600
    }

    cursor.x = (screenSize.width - windowsSize.width)/2
    cursor.y = (screenSize.height - windowsSize.height)/2 - 50 // 中上会比正中好

    await appWindow.setPosition(cursor) // 先移动再显示，await应该不用删
    const el = document.querySelector('#main') as HTMLElement|null
    if (el) el.dataset.positionMode = 'center'
  } else { // 即 undefined，沿用之前的位置
  }

  // 显示窗口
  await appWindow.setIgnoreCursorEvents(false) // 关闭点击穿透 (点击透明部分可能会临时打开)
  await appWindow.show(); global_state.isWindowVisible = true;

  // 焦点模式/不抢焦点模式，需要 show() 完后运行 TODO 完善
  if (global_setting.config.panel_focus_mode) {
    await appWindow.setFocus() // 聚焦窗口
    // 注意作为菜单窗口而言，窗口消失时要恢复聚焦与光标
  } else {}
  if (global_setting.config.panel_default_always_top) {
    await appWindow.setAlwaysOnTop(true)
  } else {
    await appWindow.setAlwaysOnTop(false)
  }

  // 显示&聚焦搜索框、建议栏，恢复虚拟聚焦状态
  AMPanel.show({x: 0, y: 0}, panel_list)
}

/** 隐藏窗口 */
export async function hideWindow(list?: string[]) {
  if (global_setting.state.isPin) return // 置顶状态
  AMPanel.hide(list) // 隐藏面板&失焦面板

  if (!global_state.isWindowVisible) return // 状态不一定对，可注释掉

  const appWindow = getCurrentWindow()

  await appWindow.hide(); global_state.isWindowVisible = false;  
}
