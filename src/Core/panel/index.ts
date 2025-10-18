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

export class AMPanel {
  static factory(el: HTMLElement) {
    const amSearch = AMSearch.factory(el)
    const amContextMenu = ABContextMenu.factory(el, undefined, amSearch.el_input ?? undefined)
    return { amSearch, amContextMenu }
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
