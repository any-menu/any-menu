/**
 * 管理面板中可能出现的东西
 * 
 * 内容上，可能包括:
 * 
 * - 搜索框
 * - 建议/提示/候选栏，可能后续会将建议栏与搜索框分离，好处是:
 *   - 复用
 *   - 单独控制显示隐藏
 *   - 单独控制位置 (搜索框靠屏幕下方时，建议栏应在搜索框的上方)
 * - 多级菜单
 * - 工具栏
 * - MiniEditor
 * - 其他有可能出现的自定义脚本的自定义面板
 * 
 * 功能上:
 * 
 * - 主要管理他们的共同显示、隐藏、位置
 * - 提供一个父层，让各个子组件可以相互通信
 */

export * from './contextmenu/index'
export * from './search/index'
import { AMSearch } from './search/index'
import { AMContextMenu } from './contextmenu/index'
import { AMMiniEditor } from './miniEditor/index'
import { AMToolbar } from './toolbar/index'
import { global_setting } from '../setting'

// 主要看方向键是处理 搜索框 & 建议项 / 多级菜单
// let focus_in: 'search'|'menu' = 'search'

// 单例模式下使用，否则不使用
export const global_el: {
  amPanel: AMPanel | null,
  amSearch: AMSearch | null,
  amContextMenu: AMContextMenu | null,
  amMiniEditor: AMMiniEditor | null,
  amToolbar: AMToolbar | null,
  alt_v_state: boolean,  // 虚拟alt状态
} = {
  amPanel: null,
  amSearch: null,
  amContextMenu: null,
  amMiniEditor: null,
  amToolbar: null,
  alt_v_state: false
}
let alt_key_flag = false        // 按下过 alt+key 组合键

/** AMPanel 使用单例模式管理 */
export class AMPanel {
  /** 单例模式 */
  static factory(el: HTMLElement) {
    if (!global_el.amPanel) {
      global_el.amPanel = new AMPanel()
    }
    if (!global_el.amSearch) {
      global_el.amSearch = AMSearch.factory(el)
    }
    if (!global_el.amContextMenu) {
      global_el.amContextMenu = AMContextMenu.factory(el, undefined, global_el.amSearch.el_input ?? undefined)
    }
    if (!global_el.amMiniEditor) {
      global_el.amMiniEditor = AMMiniEditor.factory(el)
    }
    if (!global_el.amToolbar) {
      global_el.amToolbar = AMToolbar.factory(el)
    }

    // alt切换快捷提示
    {
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Alt') {
          ev.preventDefault() // 不要触发窗口的alt键功能
          el?.classList.add('show-altkey')
        }

        // alt+key
        if (ev.altKey) {
          if (ev.key != 'Alt') alt_key_flag = true
        }
      })
      el.addEventListener('keyup', (ev) => {
        if (ev.key === 'Alt') {
          // alt+key
          if (alt_key_flag) {
            alt_key_flag = false,
            global_el.alt_v_state = false
            ev.preventDefault() // 不要触发窗口的alt键功能
            el?.classList.remove('show-altkey')
          } else {
            global_el.alt_v_state = !global_el.alt_v_state
          }

          if (global_el.alt_v_state) {
            ev.preventDefault() // 不要触发窗口的alt键功能
            el?.classList.add('show-altkey')
          } else {
            ev.preventDefault() // 不要触发窗口的alt键功能
            el?.classList.remove('show-altkey')
          }
        }
      })
    }

    return { amSearch: global_el.amSearch, amContextMenu: global_el.amContextMenu }
  }

  // TODO 添加显示项，仅显示哪几个面板这样
  static show(x?: number, y?: number, list?: string[]) {
    if (!list) {
      list = global_setting.key_panel.panel1
    }

    let is_focued = false // 只聚焦到第一个可聚焦的子面板
    for (const item of list) {
      if (item == 'search') {
        global_el.amSearch?.show(x, y)
        if (y !== undefined) { y += 32 }
        is_focued = true
      }
      else if (item == 'menu') {
        global_el.amContextMenu?.show(x, y)
        if (y !== undefined) { y += 248 } // 不一定
      }
      else if (item == 'miniEditor') {
        global_el.amMiniEditor?.set_flag('miniEditor')
        global_el.amMiniEditor?.show(x, y,
          global_setting.state.selectedText, !is_focued) // undefined 时不重置内容，否则改为 ?? ""
        is_focued = true
      }
      else if (item == 'info') { // 调试用 (仅debug时会进入这里的逻辑)
        global_el.amMiniEditor?.set_flag('info')
        global_el.amMiniEditor?.show(x, y,
          global_setting.state.infoText, !is_focued) // undefined 时不重置内容，否则改为 ?? ""
        is_focued = true

        // 异步添加 info 内容
        global_setting.api.getInfo().then((info_text: string|null) => {
          global_setting.state.infoText += '[info]\n' + (info_text ?? "null") + "\n\n"
          global_el.amMiniEditor?.show(undefined, undefined, global_setting.state.infoText, false)
        })
      }
      else if (item == 'toolbar') {
        global_el.amToolbar?.show(x, y)
        if (y !== undefined) { y += 32 }
      }
      else {
        continue
      }
    }
  }

  static hide() {
    global_el.amSearch?.hide()
    global_el.amContextMenu?.hide()
    global_el.amMiniEditor?.hide()
    global_el.amToolbar?.hide()
  }

  // TODO 目前的一个问题在于: 用户无法很好地自定义css
  //   如果用户需要调整尺寸，可能最后需要提供一个设置配置，去修改那里的宽高
  // TODO 暂不支持宽度计算
  static get_size(list?: string[]): {width: number, height: number} {
    if (!list) {
      list = global_setting.key_panel.panel1
    }

    let width = 0
    let height = 0
    for (const item of list) {
      if (item == 'search') {
        height += 32
      }
      else if (item == 'menu') {
        height += 248
      }
      else if (item == 'miniEditor') {
        height += 276
      }
      else if (item == 'info') {
        height += 276
      }
      else if (item == 'toolbar') {
        height += 32
      }
      else {
        continue
      }
    }

    return { width, height }
  }

  /** 用屏幕/窗口大小位置纠正光标位置
   * @param screen_size 屏幕/窗口大小
   * @param panel_size 显示的面板大小
   * @param cursor 光标位置
   * @param mode 纠正模式，反向显示 or 靠边显示。TODO x和y模式应该可以分别设置
   *   目前我的一个建议是，若基于鼠标位置显示，则靠边；
   *   若是基于光标位置显示，则反向显示 (避免遮挡当前输入内容)
   *   TODO 如果是 revert 模式，应该通知页面倒置建议栏的位置
   */
  static fix_position(
    screen_size: {width: number, height: number},
    panel_size: {width: number, height: number},
    cursor: { x: number, y: number },
    mode: "revert"|"side" = "side"
  ): {x: number, y: number} {
    const side_gap = 4    // 靠边间隙
    const line_height = 24 // 反向显示时，需要减行高

    // y轴溢出
    if (screen_size.height - side_gap < cursor.y + panel_size.height) {
      if (mode == "revert") { // TODO 这里应该通知界面，倒置建议栏的方向、搜索栏在菜单的下面
        cursor.y = cursor.y - line_height - panel_size.height
      } else {
        cursor.y = screen_size.height - side_gap - panel_size.height
        cursor.x += 4 // 避免变成 `<-->` 光标，好看一些
      }
    }

    // // x轴溢出 TODO 上游给的屏幕坐标没考虑多屏的情况，面板的宽度也是错的
    // if (screen_size.width - side_gap < cursor.x + panel_size.width) {
    //   if (mode == "revert") {
    //     cursor.x = cursor.x - panel_size.width
    //   } else {
    //     cursor.x = screen_size.width - side_gap - panel_size.width
    //   }
    // }

    return { x: cursor.x, y: cursor.y }
  }
}
