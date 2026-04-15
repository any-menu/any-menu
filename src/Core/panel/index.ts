/**
 * 管理面板中可能出现的东西
 * 
 * 内容上，可能包括许多子面板:
 * 
 * - Search 搜索框
 *   - 建议/提示/候选栏，可能后续会将建议栏与搜索框分离，好处是:
 *     - 复用
 *     - 单独控制显示隐藏
 *     - 单独控制位置 (搜索框靠屏幕下方时，建议栏应在搜索框的上方)
 * - Toolbar 工具栏
 * - ContextMenu 多级菜单
 * - MiniEditor 迷你编辑器
 * - 其他有可能出现的自定义脚本的自定义面板
 * 
 * 功能上:
 * 
 * - 主要管理他们的共同显示、隐藏、位置，封装和复用子面板的共同行为
 * - 提供一个父层，让各个子组件可以相互通信使用使用共用变量 (如触发 alt_v_state 时是否有建议栏会有不同行为)
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
  amToolbar: AMToolbar | null,
  amContextMenu: AMContextMenu | null,
  amMiniEditor: AMMiniEditor | null,
  amCustom: HTMLElement | null, // 供自定义脚本使用的面板元素
  alt_v_state: boolean,  // 虚拟alt状态
} = {
  amPanel: null,
  amSearch: null,
  amContextMenu: null,
  amMiniEditor: null,
  amToolbar: null,
  amCustom: null,
  alt_v_state: false
}
// 按下过 alt+key 组合键。
// 仅用于辅助得到 alt_v_state 的值，无其他用处，请勿直接使用于其他用途。
// 注意需要排除掉通过 alt+key 召唤面板然后松开 alt 的情况。
let alt_key_flag = false

/** AMPanel 使用单例模式管理
 * 
 * ## 面板与子组件、位置控制
 * 
 * 以前的旧方案是: 没有面板容器这个概念和元素，面板内的组件可以直接显示在页面上任意坐标。
 * 但后来的需求是经常需要几个组件同时显示在同一个位置，并且要让他们排列整齐好再显示。
 * 所以现在的新方案是: 组件必须要在该面板容器内，组件不能单独控制位置，只能由面板控制位置。好处:
 * 
 * - 简化子组件的实现。这样可以轻松实现更多子组件
 *   - 可以更好地处理多个组件需要显示在同一位置的情况。子组件无需再考虑位置问题
 *   - 更好地处理多个组件脱离焦点隐藏的逻辑。子组件无需再考虑脱离聚焦问题
 *   - ... (抽离更多子组件的共同行为到面板中，进一步简化子组件)
 * - 面对边缘显示时，也能更方便检测出组件组合的总尺寸 (哪怕css影响了子组件的大小) (该好处未完成)
 * 
 * ## 脚本自定义面板设计
 * 
 * 这里需要考虑的几个设计:
 * 
 * - 脚本面板是静态创建 or 动态创建，静态动态复用方便，适合调色盘和大部分场景。
 *   动态创建更灵活，支持任意数量，但需要考虑如何用完后销毁。
 *   (采用) 当然还有一个思路: 静态容器元素，其子元素是否动态由插件控制
 */
export class AMPanel {
  public el: HTMLElement

  /** 单例模式 */
  static factory(el: HTMLElement) {
    if (!global_el.amPanel) {
      global_el.amPanel = new AMPanel(el)
    }
    if (!global_el.amSearch) {
      global_el.amSearch = AMSearch.factory(el)
    }
    if (!global_el.amToolbar) {
      global_el.amToolbar = AMToolbar.factory(el)
    }
    if (!global_el.amContextMenu) {
      global_el.amContextMenu = AMContextMenu.factory(el, undefined, global_el.amSearch.el_input ?? undefined)
    }
    if (!global_el.amMiniEditor) {
      global_el.amMiniEditor = AMMiniEditor.factory(el)
    }
    if (!global_el.amCustom) {
      global_el.amCustom = document.createElement('div'); el.appendChild(global_el.amCustom); global_el.amCustom.classList.add('am-custom-panel')
    }

    // alt切换快捷提示
    {
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Alt') {
          alt_key_flag = false
          ev.preventDefault() // 不要触发窗口的alt键功能
          el.classList.add('show-altkey')
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
            alt_key_flag = false
            global_el.alt_v_state = false
            ev.preventDefault() // 不要触发窗口的alt键功能
          } else {
            global_el.alt_v_state = !global_el.alt_v_state
          }

          if (global_el.alt_v_state) {
            ev.preventDefault() // 不要触发窗口的alt键功能
            el.classList.add('show-altkey')
          } else {
            ev.preventDefault() // 不要触发窗口的alt键功能
            el?.classList.remove('show-altkey')
          }
        }
      })
    }

    return { amSearch: global_el.amSearch, amContextMenu: global_el.amContextMenu }
  }

  private constructor(el: HTMLElement) {
    this.el = el
    el.classList.add('am-panel');
  }

  /** 显示面板
   * TODO 支持显示在屏幕中间偏上 (类似于 utools，并支持由插件如此使用)
   * 
   * @param pos
   * - {x, y} 具体坐标
   *   (面板的左上角坐标，一般是使用的光标或鼠标的位置)
   * - undefined 表示延续上一次的位置
   *   (一般用于确定位置和显示后，插件因需要显示更多 list 而再次调用 show 的插件 api)
   * - 'center' 直接显示在页面的正中心 TODO 未支持
   *   (但一般不作用于 Panel，而是作用于窗口的情况比较多)
   */
  static show(pos: {x: number, y: number}|undefined, list?: string[]) {
    // 设置初始的 alt 状态
    // 
    // 理想状态下，显示的时候最好能获取 alt 状态，来设置初始时是否为虚拟 alt 状态
    // 但事实上，在 app 环境中，alt 按下的时候前端未显示，前端是无法获取该 alt 按下状态的
    // 
    // 例如: global_el.alt_v_state = false
    // 这里最好是根据是否 alt+key 召唤出面板来决定初始的虚拟 alt 状态
    // 可惜前端无法实现，又不想弄后端，搞太复杂
    alt_key_flag = true // 保证 alt+key 召唤面板后，松开 alt 键时会结束虚拟 alt 状态

    // 定位
    const el_panel = global_el.amPanel?.el
    if (!el_panel) return
    if (pos === undefined) {
    // } else if (pos === 'center') {
    } else {
      el_panel.style.left = `${pos.x}px`
      el_panel.style.top = `${pos.y}px`
    }

    if (!list) {
      list = global_setting.key_panel.panel1
    }

    let is_focued = false // 只聚焦到第一个可聚焦的子面板
    for (const item of list) {
      if (item == 'search') {
        global_el.amSearch?.show()
        is_focued = true
      }
      else if (item == 'toolbar') {
        global_el.amToolbar?.show()
      }
      else if (item == 'menu') {
        global_el.amContextMenu?.show()
      }
      else if (item == 'miniEditor') {
        global_el.amMiniEditor?.set_flag('miniEditor')
        global_el.amMiniEditor?.show(global_setting.state.selectedText, !is_focued) // undefined 时不重置内容，否则改为 ?? ""
        is_focued = true
      }
      else if (item == 'info') { // 调试用 (仅debug时会进入这里的逻辑)
        global_el.amMiniEditor?.set_flag('info')
        global_el.amMiniEditor?.show(global_setting.state.infoText, !is_focued) // undefined 时不重置内容，否则改为 ?? ""
        is_focued = true

        // 异步添加 info 内容
        global_setting.api.getInfo().then((info_text: string|null) => {
          global_setting.state.infoText += '[info]\n' + (info_text ?? "null") + "\n\n"
          global_el.amMiniEditor?.show(global_setting.state.infoText, false)
        })
      }
      else {
        for (const key in global_el.amPanel?.SubPanel) {
          if (key == item) {
            global_el.amPanel?.SubPanel[key].classList.remove('am-hide')
            break
          }
        }
        // 找不找得到这里也结束这轮循环了
      }
    }

    // 不要用click，获取的是松开时鼠标下的元素，会很容易误触。因为拖拽时鼠标很容易会出现在元素外部
    window.addEventListener('mousedown', this.visual_listener_mousedown)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }

  /** 隐藏面板 */
  static hide(list?: string[]) {
    if (global_setting.state.isPin) return

    // 全部隐藏
    if (!list) {
      global_el.amSearch?.hide()
      global_el.amToolbar?.hide()
      global_el.amContextMenu?.hide()
      global_el.amMiniEditor?.hide()
      for (const key in global_el.amPanel?.SubPanel) {
        global_el.amPanel?.SubPanel[key].classList.add('am-hide')
      }
    }
    // 仅隐藏列表中的
    else {
      for (const item of list) {
        if (item == 'search')  global_el.amSearch?.hide()
        else if (item == 'toolbar') global_el.amToolbar?.hide()
        else if (item == 'menu') global_el.amContextMenu?.hide()
        else if (item == 'miniEditor') global_el.amMiniEditor?.hide()
        else if (item == 'info') global_el.amMiniEditor?.hide()
        else {
          for (const key in global_el.amPanel?.SubPanel) {
            if (key == item) {
              global_el.amPanel?.SubPanel[key].classList.add('am-hide')
              break
            }
          }
        }
      }
      return
    }
  }

  // #region 自定义子面板管理

  private SubPanel: { [key: string]: HTMLElement } = {}

  register_sub_panel(id: string, el: HTMLElement|((el: HTMLElement) => void)) {
    if (this.SubPanel[id]) {
      console.warn(`SubPanel with id ${id} already exists. It will be replaced.`)
      this.SubPanel[id].remove()
    }

    if (typeof el === 'function') {
      const container = document.createElement('div'); container.classList.add(`am-sub-panel-${id}`)
      this.SubPanel[id] = container
      global_el.amCustom?.appendChild(container)
      el(container)
    } else {
      this.SubPanel[id] = el
      global_el.amCustom?.appendChild(el)
    }
  }

  unregister_sub_panel(id: string) {
    if (!this.SubPanel[id]) {
      console.warn(`SubPanel with id ${id} does not exist.`)
      return
    }
    this.SubPanel[id].remove()
    delete this.SubPanel[id]
  }

  // #endregion

  /// 失焦隐藏
  /// 条件: 焦点不聚于面板的子组件下 (哪怕聚于没有子组件位置的面板空白处)
  static visual_listener_mousedown = (ev: MouseEvent) => {
    if (!global_el.amPanel?.el) return
    if (ev.target instanceof Element) {
      // 前者不包括 .am-panel，后者包括 .widnows-pin，后者也可以写成 `matches('.windows-pin, .windows-pin *')`
      if (ev.target.matches('.am-panel *') || ev.target.closest('.windows-pin')) return
    }
    this.hide()
  }
  /// ESC隐藏
  static visual_listener_keydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      this.hide()
      return
    }
  }

  /** 获取面板尺寸
   * 
   * 有新旧两种方案。预期最后的实现是先用旧方案约估，然后显示，然后再用新方案去调整 ?
   * 
   * TODO 目前的一个问题在于: 用户无法很好地自定义css
   *   如果用户需要调整尺寸，可能最后需要提供一个设置配置，去修改那里的宽高
   * TODO 暂不支持宽度计算
   */
  static get_size(list?: string[]): {width: number, height: number} {

    // // 新方案：直接获取 am-panel 的尺寸 (缺点是: 需要显示后才能获取)
    // const el_panel = global_el.amPanel?.el
    // if (!el_panel) return { width: 0, height: 0 }
    // const rect = el_panel.getBoundingClientRect()
    // const width = rect.width
    // const height = rect.height

    // 旧方案: 单独计算所有子组件的尺寸 (这可以显示前获取，但缺点是会被 css 影响尺寸)
    if (!list) {
      list = global_setting.key_panel.panel1
    }
    let width = 0
    let height = 0
    let min_height = 0
    for (const item of list) {
      if (item == 'search') {
        height += 32
        min_height = min_height > 32+260 ? min_height : 32+260 // 加建议栏的高度
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
    if (height < min_height) {
      height = min_height
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
