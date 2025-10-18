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

// 主要看方向键是处理 搜索框 & 建议项 / 多级菜单
// let focus_in: 'search'|'menu' = 'search'

// 单例模式下使用，否则不使用
export const global_el: {
  amSearch: AMSearch | null,
  amContextMenu: ABContextMenu | null
} = {
  amSearch: null,
  amContextMenu: null
}

/** AMPanel 使用单例模式管理 */
export class AMPanel {
  /** 单例模式 */
  static factory(el: HTMLElement) {
    if (!global_el.amSearch) {
      global_el.amSearch = AMSearch.factory(el)
    }
    if (!global_el.amContextMenu) {
      global_el.amContextMenu = ABContextMenu.factory(el, undefined, global_el.amSearch.el_input ?? undefined)
    }

    return { amSearch: global_el.amSearch, amContextMenu: global_el.amContextMenu }
  }

  /** 绑定到input事件
   * 
   * 流程上: 先去找匹配项/看input是否为空
   * - 若有内容，则方向键控制搜索建议
   * - 若无内容，则方向键控制多层菜单
   */
  // static bind_input() {

  // }
}
