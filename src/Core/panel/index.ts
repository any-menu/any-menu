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
import { ABContextMenu } from './contextmenu/index'
import { AMMiniEditor } from './miniEditor/index'
import { global_setting } from '../setting'

// 主要看方向键是处理 搜索框 & 建议项 / 多级菜单
// let focus_in: 'search'|'menu' = 'search'

// 单例模式下使用，否则不使用
export const global_el: {
  amPanel: AMPanel | null,
  amSearch: AMSearch | null,
  amContextMenu: ABContextMenu | null,
  amMiniEditor: AMMiniEditor | null,
} = {
  amPanel: null,
  amSearch: null,
  amContextMenu: null,
  amMiniEditor: null,
}

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
      global_el.amContextMenu = ABContextMenu.factory(el, undefined, global_el.amSearch.el_input ?? undefined)
    }
    if (!global_el.amMiniEditor) {
      global_el.amMiniEditor = AMMiniEditor.factory(el)
    }

    return { amSearch: global_el.amSearch, amContextMenu: global_el.amContextMenu }
  }

  // TODO 添加显示项，仅显示哪几个面板这样
  static show(x?: number, y?: number) {
    global_el.amSearch?.show(x, y)
    global_el.amContextMenu?.show(x, y ? y+32 : undefined)
    global_el.amMiniEditor?.show(x, y ? y+280 : undefined,
      global_setting.state.selectedText) // undefined 时不重置内容，否则改为 ?? ""
  }

  static hide() {
    global_el.amSearch?.hide()
    global_el.amContextMenu?.hide()
    global_el.amMiniEditor?.hide()
  }
}
