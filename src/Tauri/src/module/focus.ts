import { global_setting } from '../../../Core/setting'
import { listen } from '@tauri-apps/api/event'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import { toggleWindow } from './window'
import { global_el } from '../../../Core/panel'

// 显示面板: 搜索框+菜单
const SHORTCUT_1 = 'Alt+A'
const SHORTCUT_1_EVENT = async () => {
  await register(SHORTCUT_1, (event) => {
    if (event.state !== 'Pressed') return // Pressed/Released
    void toggleWindow()
  })
}

// 显示面板: 迷你编辑器
const SHORTCUT_2 = 'Alt+S'
const SHORTCUT_2_EVENT = async () => {
  await register(SHORTCUT_2, (event) => {
    if (event.state !== 'Pressed') return // Pressed/Released
    void toggleWindow(["miniEditor"])
  })
}

// 显示面板: 当前窗口信息 (仅debug模式开启)
const SHORTCUT_3 = 'Alt+D'
const SHORTCUT_3_EVENT = async () => {
  if (global_setting.isDebug == false) {
    console.warn('Debug mode is off, shortcut Alt+D will not be registered')
    return
  }
  await register(SHORTCUT_3, (event) => {
    if (event.state !== 'Pressed') return // Pressed/Released
    global_setting.state.infoText = ''
    void toggleWindow(["info"])
  })
}

/** 注册事件监听 - 聚焦窗口改变 */
export function setupAppChangeListener() {
  listen('active-app-changed', (event) => {
    const appName = event.payload
    if (typeof appName !== 'string') {
      console.error('Invalid app name format')
      return
    }

    // console.log('Active app changed:', appName)
    updateShortcuts(appName)
  })
  // 启动时手动触发一次 (或让后端启动时发送一次)
  updateShortcuts('')

  // 后端通知前端显示 (超级快捷键)
  listen('active-window-toggle', (v: any) => {
    const payload: any = v.payload // 临时: 2|null

    if (payload === null) { // 对应rust返回 `()`
      void toggleWindow()
    }
    else if (typeof payload == 'number' && payload === 2) {
      void toggleWindow(["miniEditor"])
    }
    else if (typeof payload == 'object') {
      // 异步添加 info 内容
      const json_str = JSON.stringify(payload, null, 2)
      // console.log('Parsed JSON payload:', json_str, '\n---\n', global_setting.state.infoText)
      global_setting.state.infoText += '[info.slow]\n' + json_str + '\n\n'
      if (global_el.amMiniEditor && global_el.amMiniEditor.isShow) {
        global_el.amMiniEditor.show(undefined, undefined, global_setting.state.infoText, false)
      }
    }
    else {
      console.error('Unknown payload for active-window-toggle:', payload)
    }
  })
}

/**
 * 根据当前激活的应用，动态管理全局快捷键
 * @param {string | null} appName - 当前激活的应用名称 (来自 Rust)
 */
async function updateShortcuts(appName: string) {
  // 检查是否在黑名单内
  let isInBlacklist = false
  for (const app_block of global_setting.config.app_black_list) {
    if (appName.includes(app_block)) {
      isInBlacklist = true
      break
    }
  }

  // 动态注册或注销全局快捷键
  try {
    const is_shortcut_registered1 = await isRegistered(SHORTCUT_1) as boolean
    const is_shortcut_registered2 = await isRegistered(SHORTCUT_2) as boolean
    const is_shortcut_registered3 = await isRegistered(SHORTCUT_3) as boolean

    // 在黑名单 (不应注册快捷键)，如果快捷键已注册，则取消注册
    if (isInBlacklist) {
      if (is_shortcut_registered1) await unregister(SHORTCUT_1)
      if (is_shortcut_registered2) await unregister(SHORTCUT_2)
      if (is_shortcut_registered3) await unregister(SHORTCUT_3)
    }
    // 不在黑名单 (应注册快捷键)，如果快捷键未注册，则注册它
    else {
      if (!is_shortcut_registered1) { void SHORTCUT_1_EVENT() }
      if (!is_shortcut_registered2) { void SHORTCUT_2_EVENT() }
      if (!is_shortcut_registered3) { void SHORTCUT_3_EVENT() }
    }
  } catch (err) {
    console.error('Failed to update shortcut state:', err)
  }
}

// registerShortcuts()
// /** 注册全局快捷键
//  * @deprecated 现在改为在后端 focus.rs 里动态注册和注销
//  *   原因是要支持白名单和黑名单功能，当聚焦切换到黑/白名单窗口时动态注册/注销快捷键
//  */
// function registerShortcuts() {
//   register('CommandOrControl+Space', (event) => { // CommandOrControl+Shift+Space
//     if (event.state !== 'Pressed') return // Pressed/Released
// 
//     console.log('Shortcut triggered1', event)
//     void toggleWindow()
//   })
//   register('Alt+A', (event) => {
//     if (event.state !== 'Pressed') return // Pressed/Released
// 
//     console.log('Shortcut triggered2', event)
//     void toggleWindow()
//   })
// }
