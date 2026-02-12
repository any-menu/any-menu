import TurndownService from 'turndown' // html2md(clipboard_selectedText_html) // html2md 库太老了，使用更现代的html2md库: turndown
import { listen } from '@tauri-apps/api/event'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import { global_setting } from '../../../Core/setting'
import { toggleWindow } from './window'
import { global_el } from '../../../Core/panel'

// 显示面板: 搜索框+菜单
const SHORTCUT_1 = global_setting.key_panel.key1
const SHORTCUT_1_EVENT = async () => {
  await register(SHORTCUT_1, (event) => {
    if (event.state !== 'Pressed') return // Pressed/Released
    void toggleWindow(global_setting.key_panel.panel1)
  })
}

// 显示面板: 迷你编辑器
const SHORTCUT_2 = global_setting.key_panel.key2
const SHORTCUT_2_EVENT = async () => {
  await register(SHORTCUT_2, (event) => {
    if (event.state !== 'Pressed') return // Pressed/Released
    void toggleWindow(global_setting.key_panel.panel2)
  })
}

// 显示面板: 当前窗口信息 (仅debug模式开启)
const SHORTCUT_3 = global_setting.key_panel.key3
const SHORTCUT_3_EVENT = async () => {
  if (global_setting.isDebug == false) {
    console.warn('Debug mode is off, shortcut Alt+D will not be registered')
    return
  }
  await register(SHORTCUT_3, (event) => {
    if (event.state !== 'Pressed') return // Pressed/Released
    global_setting.state.infoText = ''
    void toggleWindow(global_setting.key_panel.panel3)
  })
}

// html2md 库的配置
const turndownService = new TurndownService({
  // option docs: https://github.com/mixmark-io/turndown#options
  headingStyle: 'atx',      // 标题样式 (默认setext，会用 === 和 --- 表示h1和h2)
  hr: '---',                // 水平线样式 (默认 * * *)
  bulletListMarker: '-',    // 列表符号 (默认*)
  codeBlockStyle: 'fenced', // 代码围栏风格 (默认 indented 缩进)
  fence: '```',             // 代码块围栏标识 (默认值)
  emDelimiter: '*',         // 斜体标识 (默认_)
  strongDelimiter: '**',    // 加粗标识 (默认值)
  linkStyle: 'inlined',     // 链接样式 (默认值，`[]()` 形式而非注脚形式)
  linkReferenceStyle: 'full', // 注脚形式 (默认值)
  preformattedCode: false,  // 代码中折叠还是保留空格 (默认值，没看懂)
})
// 取消 "缩进对齐"。即 `-   aa` 变成 `- aa`
turndownService.addRule('listItemNoIndent', {
  filter: 'li',
  replacement(content) {
    return '- ' + content.trim() + '\n'
  }
})

/** 注册事件监听 - 聚焦窗口改变 */
export function setupAppChangeListener() {
  listen('active-app-changed', (event) => {
    const appName = event.payload
    if (typeof appName !== 'string') {
      console.error('Invalid app name format')
      return
    }

    if (appName != "AnyMenu") { // 避免自己覆盖创建本应用之前的应用
      global_setting.state.activeAppName = appName
    }
    updateShortcuts(appName)
  })
  // 启动时手动触发一次 (或让后端启动时发送一次)
  updateShortcuts('')

  // 后端通知前端显示 (超级快捷键)
  listen('active-window-toggle', (v: any) => {
    const payload: any = v.payload // 临时: 2|null

    if (payload === null) { // 对应rust返回 `()`
      void toggleWindow(global_setting.key_panel.panel1)
    }
    else if (typeof payload == 'number' && payload === 1) {
      void toggleWindow(global_setting.key_panel.panel1)
    }
    else if (typeof payload == 'number' && payload === 2) {
      void toggleWindow(global_setting.key_panel.panel2)
    }
    else if (typeof payload == 'object' && Array.isArray(payload)) {
      console.error('Unknown payload for active-window-toggle2:', payload)
    }
    else if (typeof payload == 'object') {
      const json_str = JSON.stringify(payload, null, 2)

      // 更新 global_setting.state
      // 这里硬编码，默认策略是先uia，异步clipboard
      const uia_selectedText = global_setting.state.selectedText // 上次uia失败则一般这个值是 undefined
      // const uia_selectedText2 = payload['selected_text_by_uia']
      const clipboard_selectedText = payload['selected_text_by_clipboard']
      const clipboard_selectedText_html = payload['selected_html_by_clipboard']
      let is_update_selectedText = false
      if (clipboard_selectedText_html && clipboard_selectedText_html.length > 0
        && global_setting.state.activeAppName != "QQ" // QQ 默认多人的聊天记录会被html+body框住
      ) { // 特殊 - html 拥有更高的优先级
        console.log(`selectedText is html`)
        global_setting.state.selectedText = turndownService.turndown(clipboard_selectedText_html)
        is_update_selectedText = true
      } else if (uia_selectedText == clipboard_selectedText) { // 相同，则不变
        console.log(`selectedText same: ${uia_selectedText} == ${clipboard_selectedText}`)
        is_update_selectedText = false
      } else if (!uia_selectedText) { // 只有一个成功
        console.log(`selectedText replace: ${uia_selectedText} -> ${clipboard_selectedText}`)
        global_setting.state.selectedText = clipboard_selectedText
        is_update_selectedText = true
      } else if (!clipboard_selectedText) { // 只有一个成功
        console.log(`selectedText keep: ${uia_selectedText} <- ${clipboard_selectedText}`)
        is_update_selectedText = false
      } else { // 都成功，优先 clipboard (换行符、html2md等，更优)
        console.log(`selectedText better: ${uia_selectedText} -> ${clipboard_selectedText}`)
        global_setting.state.selectedText = clipboard_selectedText
        is_update_selectedText = true
      }
      global_setting.state.infoText += '[info.slow]\n' + json_str + '\n\n'

      // (可选) 特殊情况, 需要配合 obsidian chatview_qq 使用时
      if (global_setting.state.activeAppName == "QQ" && global_setting.state.selectedText) {
        // 正则将 img 标签中的 src 中的空格改为 %20
        global_setting.state.selectedText = global_setting.state.selectedText.replace(/<img[^>]+src="([^">]+)"[^>]*\/?>/g, (_, p1) => {
          const newSrc = p1.replace(' ', '%20')
          return `![](${newSrc})` // match.replace(p1, newSrc)
        })

        global_setting.state.selectedText = "```chat\n" + global_setting.state.selectedText + "\n```\n\n"
      }

      // 更新 miniEditor 面板显示内容
      // 不主动显示，但如果已经显示了，则更新内容
      // 除了miniEditor不会被显示的情况外，如果异步信息获取足够快，这里是可能在面板显示前更新的。这里也为false
      if (global_el.amMiniEditor && global_el.amMiniEditor.isShow) {
        if (global_el.amMiniEditor.flag === 'info') {
          global_el.amMiniEditor.show(undefined, undefined, global_setting.state.infoText, false)
        }
        else if (global_el.amMiniEditor.flag === 'miniEditor' && is_update_selectedText) {
          global_el.amMiniEditor.show(undefined, undefined, global_setting.state.selectedText, false)
        }
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
