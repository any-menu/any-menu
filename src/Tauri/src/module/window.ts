/**
 * 与窗口相关的工作
 * 
 * 窗口显示/隐藏相关
 */

// 注意api/window里的功能很多都需要开启权限，否则控制台会报错告诉你应该开启哪个权限
import {
  getCurrentWindow, cursorPosition, PhysicalPosition, Window as TauriWindow
} from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

import { AMPanel, global_el } from '../../../Core/panel/'
import { global_setting } from '../../../Core/setting'

import { setupAppChangeListener } from './focus'
setupAppChangeListener()

export const global_state: {
  isWindowVisible: boolean // 当前窗口是否可见 (可以去掉而是实时获取)
  hideTimeout: number | null // 定时器，用于延时隐藏、防抖 (感觉不太需要? 延时加多了反而有种性能差的感觉)
} = {
  isWindowVisible: false,
  hideTimeout:  null
}

// #region 窗口自动隐藏 / 鼠标穿透相关

/** 事件组、全局快捷键 */
window.addEventListener("DOMContentLoaded", () => {
  // 决定了当面板或窗口显示后，在什么条件下会自动隐藏
  initAutoHide_focus()
  initAutoHide_esc()
  initAutoHide_cursorIgnore()

  // initClickThroughBehavior()
})

/** 自动隐藏 - 失焦后隐藏面板
 * 
 * 聚焦级别 (只通过聚焦判断，不通过鼠标位置判断)
 */
function initAutoHide_focus() {
  // 监听窗口焦点切换事件
  const appWindow = getCurrentWindow()
  appWindow.onFocusChanged(({ payload: focused }) => {
    // 失焦，则隐藏窗口
    if (!focused) {
      global_state.hideTimeout = window.setTimeout(() => {
        hideWindow()
      }, 1)
    }
    // 重新获得焦点，则清除计数器
    else if (focused && global_state.hideTimeout) {
      clearTimeout(global_state.hideTimeout)
      global_state.hideTimeout = null
    }
  })
}

/** 自动隐藏 - 按Esc隐藏面板 */
function initAutoHide_esc() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideWindow()
    }
  })
}

/* 自动隐藏 - 点击面板特定区域隐藏面板 (伪点击穿透)
 * 
 * 当点击窗口以内，面板以外的区域，隐藏该区域
 * 
 * @deprecated 弃用，该逻辑迁移到了 panel 类中 (非 App 环境也会用到)
 *   而在 App 环境中，由于设置了悬浮穿透功能，
 *   这种情况 (点击窗口以内面板以外区域) 一般不会发生。
 *   此功能更只作为安全冗余设计进行兜底
 */
/*function _initAutoHide_clickArea() {}*/

/* 自动隐藏 - 非悬浮隐藏
 * 
 * 当鼠标不再悬浮于窗口/面板上时，自动隐藏窗口和面板
 * 
 * @deprecated 目前并不存在使用场景，且还未开发
 */
/*function _initAutoHide_noOver() {
  // 监听鼠标点击事件（检测点击外部）
  document.addEventListener('click', (event) => {
    // 阻止事件冒泡，确保点击窗口内部不会触发隐藏
    event.stopPropagation()
  })

  // 监听全局鼠标事件（通过窗口边界检测）
  document.addEventListener('mouseleave', () => {
    if (!global_state.isWindowVisible) return
    // 鼠标离开窗口区域时延迟隐藏
    global_state.hideTimeout = window.setTimeout(() => {
      hideWindow()
    }, 200) // 给用户一点时间重新进入窗口
  })

  // 鼠标重新进入窗口时取消隐藏
  document.addEventListener('mouseenter', () => {
    if (global_state.hideTimeout) {
      clearTimeout(global_state.hideTimeout)
      global_state.hideTimeout = null
    }
  })
}*/

let intervalId: ReturnType<typeof setInterval> | null = null // 定时器ID
let currentInterval = 66 // 当前轮询间隔，初始为66ms (~15fps)，根据状态动态调整
  // 例如稳定时降频省资源，状态变化时立即恢复高频
let isIgnoring: boolean | null = null; // 是否忽略鼠标中 (是否点击穿透中)
// 缓存窗口位置，避免每帧都 IPC 查询
let cachedWinX = 0
let cachedWinY = 0
// let lastOverContent = false
// let unchangedCount = 0 // 鼠标长期在同一个元素上时的计数器，大了后会减少刷新频率
// let unlistenMove: (() => void) | null = null

/** 自动隐藏 - 鼠标悬浮穿透功能
 * 
 * 当鼠标悬浮于窗口以内，面板以外的区域时，将窗口设置成穿透状态。
 * 当鼠标悬浮回面板以内区域时，将窗口设置回不穿透状态。
 * 
 * 其他实现细节：
 * 
 * 状态机:
 * 
 * - 不穿透状态: 通过 mousemove 判断鼠标是否脱离指定 div / 脱离非透明区域
 * - 穿透状态: 无法再使用 mousemove 检测到鼠标行为。通过 tauri api `cursorPosition` 判断鼠标是否重新进入
 * - 默认穿透状态 (面板出现位置不一定是鼠标所在位置)
 * 
 * TODO 当遇到置顶、窗口隐藏的行为时，可能需要将状态修改为非穿透状态
 */
function initAutoHide_cursorIgnore() {
  // 检索鼠标移动出面板的可见 (不透明) 区域
  // TODO 可以再优化节流
  document.addEventListener('mousemove', async (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);

    // (二选一) 判断方法一 (通过设置透明区域)    
    // const isTransparent = el === null;
  
    // (二选一) 判断方法二 (假如的你透明区域一定是html/body)
    const isTransparent = ( // 是否为透明区域
      el === null ||
      el === document.documentElement ||  // <html>
      el === document.body                // <body>
    );

    if (isTransparent === isIgnoring) return; // 状态没变就不调用，避免频繁 IPC
    isIgnoring = isTransparent;
    if (isTransparent) into_cursor_ignore_state()
  });

  // 获取窗口位置
  async function refreshWindowPos(is_clear: boolean = false) {
    if (is_clear) {
      cachedWinX = 0
      cachedWinY = 0
      return
    }

    const appWindow = getCurrentWindow()
    const pos = await appWindow.outerPosition()
    cachedWinX = pos.x
    cachedWinY = pos.y
  }

  // 进入穿透状态
  async function into_cursor_ignore_state() {
    const appWindow = getCurrentWindow()
    appWindow.setIgnoreCursorEvents(true); refreshWindowPos(); if (global_setting.isDebug) console.log('进入穿透模式');
    isIgnoring = true;

    if (intervalId !== null) clearInterval(intervalId)
    intervalId = setInterval(poll, currentInterval)

    async function poll() {
      try {
        // 面板不可见时 (如主动隐藏后) 自动解除穿透模式检测
        const panel_el = global_el.amPanel?.el
        if (!panel_el || panel_el.classList.contains('am-hide')) {
          exit_cursor_ignore_state()
        }

        // 位置坐标
        const curPos = await cursorPosition() // 鼠标位置
        const dpr = window.devicePixelRatio || 1
        const logicalX = (curPos.x - cachedWinX) / dpr // 屏幕物理坐标 → 窗口逻辑坐标
        const logicalY = (curPos.y - cachedWinY) / dpr

        const el = document.elementFromPoint(logicalX, logicalY)
        const isTransparent = ( // 是否为透明区域
          el === null ||
          el === document.documentElement ||  // <html>
          el === document.body                // <body>
        );

        if (!isTransparent) {
          exit_cursor_ignore_state()
        } else if (isTransparent && !isIgnoring) { // 一般不会
          into_cursor_ignore_state()
        }
        // else // isTransparent && isIgnoring，忽略，等待下轮循环

        // 自适应轮询频率：稳定时降频省资源，状态变化时立即恢复高频
        // if (overContent === lastOverContent) {
        //   unchangedCount++
        //   const target = unchangedCount > 30 ? 500 : 66
        //   if (target !== currentInterval) {
        //     currentInterval = target
        //     restartInterval()
        //   }
        // } else {
        //   unchangedCount = 0
        //   if (currentInterval !== 66) {
        //     currentInterval = 66
        //     restartInterval()
        //   }
        // }
        // lastOverContent = overContent
      } catch {
        // 窗口销毁 / 坐标不可用时静默忽略
      }
    }
  }

  // 退出穿透状态
  async function exit_cursor_ignore_state() {
    const appWindow = getCurrentWindow()
    appWindow.setIgnoreCursorEvents(false); refreshWindowPos(); if (global_setting.isDebug) console.log('退出穿透模式');
    isIgnoring = false;

    if (intervalId !== null) clearInterval(intervalId)
    intervalId = null
  }
}

/** 自动隐藏 - (仅非聚焦模式下启用)
 * 
 * 由于是非聚焦模式，所以无法自然感知到焦点失去行为，需要额外检测 "伪失焦"
 * 
 * "伪失焦" 的触发条件:
 * 
 * - 鼠标或键盘按下，同时面板不处于聚焦状态
 * 
 * 多平台区别:
 * 
 * - 对于浏览器环境，可以使用 AMPanel 上的失焦逻辑判断，此处不处理
 * - 此处仅处理 App 环境
 */
function autoHide_unFocusMode(is_focus: boolean, appWindow: TauriWindow) {

  if (is_focus) return
  else return into_unFocusMode()

  // 进入无聚焦但置顶状态
  async function into_unFocusMode() {
    // 1. 等待事件发生和后端回调
    listen('on_callback_next_click', (_event) => {
      if (global_setting.isDebug) console.log(' >  特殊 - 退出无聚焦但临时置顶状态')
      exit_unFocusMode()
    })

    // 2. 通知后端
    void invoke<null|string>("emit_callback_next_click")
    if (global_setting.isDebug) console.log(" <  特殊 - 进入无聚焦但临时置顶状态")
  }

  // 退出无聚焦但置顶状态
  async function exit_unFocusMode() {
    // 窗口聚焦切换，可能发生在点击行为之后
    window.setTimeout(async () => {
      // const unlistenFocus = await appWindow.onFocusChanged(async () => { // 监听获得焦点事件
      const focused = await appWindow.isFocused(); // 查看当前是否聚焦回面板
      if (focused) {}
      else {
        AMPanel.panel_hide()
      }
    }, 10);
  }
}

// #endregion

/** 窗口切换是否显示 */
export async function toggleWindow(panel_list?: string[], is_focus?: boolean) {  
  try {
    const appWindow = getCurrentWindow()
    // const isVisible = await appWindow.isVisible() // 检查窗口是否可见
    const isFocused = await appWindow.isFocused() // 窗口是否聚焦
    
    if (isFocused) {
      await hideWindow()
    } else {
      await showWindow('cursor', panel_list, is_focus)
    }
  } catch (error) {
    console.error('Window show fail:', error)
  }
}

/**
 * 显示窗口 (对标 Panel 的 show 方法)
 * 
 * @param pos 显示位置
 * - 'cursor': 使用光标坐标，失败时使用鼠标坐标
 * - 'center': 屏幕中心
 * - undefined: 沿用上次的位置
 * - {x, y}: 使用给定的坐标
 * @param panel_list 同 Panel::show 的参数
 * @param is_focus 同 Panel::show 的参数
 * @param is_reverse 同 Panel::show 的参数
 */
export async function showWindow(
  pos?: 'cursor'|'center'|{x: number, y: number},
  panel_list?: string[],
  is_focus: boolean = true,
  is_reverse: boolean = false,
) {
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
    is_reverse ? cursor.y -= 2 : cursor.y += 2 // 避免与光标重叠

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

    // step4. 最终坐标。触顶/底对齐/反向显示 (优先用光标，其次用鼠标坐标，然后坐标纠正避免溢出屏幕)
    // TODO 纠正x轴坐标，目前仅纠正y轴坐标
    // TODO 触顶纠正逻辑未完善
    if (is_reverse) {
      const winSize = await appWindow.outerSize()
      cursor = new PhysicalPosition(cursor.x, cursor.y - winSize.height)
    }
    const panel_size = AMPanel.get_size(panel_list)
    const over_mode = cursor2_flag ? "revert" : "side"
    const cursor3 = AMPanel.fix_position(screenSize, panel_size, cursor, over_mode)
    cursor.x = cursor3.x; cursor.y = cursor3.y;
    if (global_setting.isDebug) global_setting.state.infoText += `[finialPosition]\nover_mode:${over_mode}, x:${cursor.x}, y:${cursor.y}\n\n`

    await appWindow.setPosition(cursor) // 先移动再显示，await应该不用删
    const el = document.querySelector('#main') as HTMLElement|null
    if (el) {
      el.dataset.positionMode = 'cursor'
      if (is_reverse) el.classList.add('reverse')
      else el.classList.remove('reverse')
    }
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
    if (el) {
      el.dataset.positionMode = 'center'
      if (is_reverse) el.classList.add('reverse')
      else el.classList.remove('reverse')
    }
  } else if (pos === undefined) { // 沿用之前的位置
  } else { // 使用给定的坐标
    if (is_reverse) {
      const winSize = await appWindow.outerSize()
      cursor = new PhysicalPosition(pos.x, pos.y - winSize.height)
    } else {
      cursor = new PhysicalPosition(pos.x, pos.y)
    }

    await appWindow.setPosition(cursor) // 先移动再显示，await应该不用删
    const el = document.querySelector('#main') as HTMLElement|null
    if (el) {
      el.dataset.positionMode = 'xy'
      if (is_reverse) el.classList.add('reverse')
      else el.classList.remove('reverse')
    }
  }

  // 显示窗口
  await appWindow.setIgnoreCursorEvents(false) // 关闭点击穿透 (点击透明部分可能会临时打开)
  await appWindow.show(); global_state.isWindowVisible = true;

  // 焦点模式/不抢焦点模式，需要 show() 完后运行
  const applyFocusMode = async () => {
    if (is_focus) {
      await appWindow.setFocus()
      // 注意作为菜单窗口而言，窗口消失时要恢复聚焦与光标
    } else {
      // Workaround: Tauri 暂无 "显示但不抢焦点且置于最前" 的原生 API
      // 通过瞬间置顶再取消的方式，借助系统的 z-order 变更将窗口浮到最前
      // 加一帧等待，确保系统处理完置顶状态再取消，避免异步竞争
      // TODO fix bug 完善，目前有比较高的概率无法取消置顶
      await appWindow.setAlwaysOnTop(true)
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      await appWindow.setAlwaysOnTop(false)
    }
  }
  void applyFocusMode()

  // 显示&聚焦搜索框、建议栏，恢复虚拟聚焦状态
  AMPanel.panel_show({x: 0, y: 0}, panel_list, is_focus, is_reverse);
  autoHide_unFocusMode(is_focus, appWindow);
}

/** 隐藏窗口
 * 
 * @param forceBlurApp
 *   为什么要用:
 *   虽然隐藏窗口能自动失焦；但窗口有可能处于强制置顶状态，从而无法隐藏，所以还要主动失焦
 * 
 *   为什么不自动用: 
 *   目前 App 主动失焦的实现是模拟 Alt+Esc。
 *   如果这里是由于窗口切换焦点而导致了 hideWindow 事件，
 *   这里再进行一次主动失焦，会导致外部窗口而非该应用窗口的失焦点。
 *   
 *   使用场景：
 *   当主动隐藏窗口时使用，被动隐藏窗口不要用
 */
export async function hideWindow(list?: string[], forceBlurApp: boolean = false) {
  if (global_setting.state.isPin) { // 置顶状态
    if (forceBlurApp) await invoke("release_focus"); 
    return
  }

  AMPanel.panel_hide(list) // 隐藏面板&失焦面板

  if (!global_state.isWindowVisible) return // 状态不一定对，可注释掉

  const appWindow = getCurrentWindow()

  await appWindow.hide(); global_state.isWindowVisible = false;  
}
