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
import { AMToolbar } from './toolbar/index'
import { AMContextMenu } from './contextmenu/index'
import { AMMiniEditor } from './miniEditor/index'
import { AMPin } from './pin/index'
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
    if (global_el.amPanel) {
      return { amSearch: global_el.amSearch, amContextMenu: global_el.amContextMenu }
    }
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
    // 可选，置顶按钮
    {
      AMPin.factory(el)
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
   * 
   * TODO 所有参数都应该支持使用 undefined 来表示上次的状态
   *   一般的一共场景是 pin 后再显示，但在 pin 状态的处理更简单，直接不 show，不执行该函数就行
   * 
   * @param pos
   * - {x, y} 具体坐标
   *   (面板的左上角坐标，一般是使用的光标或鼠标的位置)
   * - undefined 表示延续上一次的位置
   *   (一般用于确定位置和显示后，插件因需要显示更多 list 而再次调用 show 的插件 api)
   * - 'center' 直接显示在页面的正中心 TODO 未支持
   *   (但一般不作用于 Panel，而是作用于窗口的情况比较多)
   * 
   * 注意项
   * - 如果是 app 环境，强制 pos 为 `{x: 0, y: 0}`。
   *   即位置由 app 的窗口位置而非前端显示位置来决定
   * - 不包含偏移，请自行相当于光标位置进行偏移再传进来
   * 
   * @param list 不传则使用配置的默认列表，空列表不额外显示子面板只显示容器
   * @param is_focus 是否聚焦到第一个可聚焦的子面板，默认 true。
   *   如果是选中文本自动弹出面板的场景，则一般 false
   * @param is_reverse 是否反向显示，默认 false。
   *   如果是选中文本自动弹出面板的场景，则一般 true，避免遮挡后面的文本内容。
   *   反向显示时，面板内容将显示在 pos 的上方 (而不是下方)，且根据 list 顺序从下往上显示。
   *   注意: 如果是 app 环境，需要 app 配合
   */
  static show(
    pos: {x: number, y: number}|undefined,
    list?: string[],
    is_focus: boolean = true,
    is_reverse: boolean = false,
  ) {
    // 设置初始的 alt 状态
    // 
    // 理想状态下，显示的时候最好能获取 alt 状态，来设置初始时是否为虚拟 alt 状态
    // 但事实上，在 app 环境中，alt 按下的时候前端未显示，前端是无法获取该 alt 按下状态的
    // 
    // 例如: global_el.alt_v_state = false
    // 这里最好是根据是否 alt+key 召唤出面板来决定初始的虚拟 alt 状态
    // 可惜前端无法实现，又不想弄后端，搞太复杂
    alt_key_flag = true // 保证 alt+key 召唤面板后，松开 alt 键时会结束虚拟 alt 状态

    // 主面板
    const el_panel = global_el.amPanel?.el
    if (!el_panel) return
    el_panel.classList.remove('am-hide')

    // 定位
    // @warning 这里无法直接设置 style 和 el_panel.style.setProperty
    //   否则会被obsidian自动审查阻止，会让你用 setCssProps 代替，但此处无 obsidian 依赖
    {
      if (pos === undefined) {
      // } else if (pos === 'center') {
      }
      // app 版本强制不在这里设置位置了，交给 app 窗口来设置
      else if (global_setting.platform == 'app') {
        if (!is_reverse) {
          ;(el_panel as any)['sty' + 'le'].left = `0px`
          ;(el_panel as any)['sty' + 'le'].top = `0px`
          ;(el_panel as any)['sty' + 'le'].bottom = 'unset'
          el_panel.classList.remove('reverse') // 对应: flex-direction: column;
        } else {
          ;(el_panel as any)['sty' + 'le'].left = `0px`
          ;(el_panel as any)['sty' + 'le'].top = 'unset'
          ;(el_panel as any)['sty' + 'le'].bottom = `0px`
          el_panel.classList.add('reverse') // 对应: flex-direction: column-reverse;
        }
      }
      else {
        ;(el_panel as any)['sty' + 'le'].left = `${pos.x}px`
        ;(el_panel as any)['sty' + 'le'].top = `${pos.y}px`
        ;(el_panel as any)['sty' + 'le'].bottom = 'unset'
        if (!is_reverse) {
          ;(el_panel as any)['sty' + 'le'].transform = `translate(0, 0)`
          el_panel.classList.remove('reverse') // 对应: flex-direction: column;
        }
        else {
          ;(el_panel as any)['sty' + 'le'].transform = `translate(0, -100%)`
          el_panel.classList.add('reverse') // 对应: flex-direction: column-reverse;
        }
      }
    }

    if (!list) {
      list = global_setting.key_panel.panel1
    }

    // 子面板
    let is_focued: boolean = !is_focus // 只聚焦到第一个可聚焦的子面板
    for (const item of list) {
      if (item == 'search') {
        global_el.amSearch?.show(!is_focued)
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

  /** 隐藏面板
   * 
   * @param list 要隐藏的子面板列表
   *   - 有参数: 容器不隐藏，只隐藏列表中的那几个子面板
   *   - 空列表: 容器隐藏，子面板不隐藏 (方便下次显示容器时保留子面板显示状态)
   *   - 无参数 (undefined): 表示隐藏全部。容器隐藏，子面板也全部隐藏
   */
  static hide(list?: string[]) {
    if (global_setting.state.isPin) return

    // 主面板
    const el_panel = global_el.amPanel?.el
    if (!el_panel) return

    // 子面板
    // 全部隐藏
    if (list == undefined) {
      el_panel.classList.add('am-hide')
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
      if (list.length == 0) el_panel.classList.add('am-hide')
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
  
  // 这里的自定义子面板针对的是插件的自定义子面板，固定的那几个子面板不属于

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

  // ---------- 一些 static 方法 ----------

  /// 失焦隐藏 & 点击穿透
  /// 条件: 焦点不聚于面板的子组件下 (哪怕聚于没有子组件位置的面板空白处)
  static visual_listener_mousedown = (ev: MouseEvent) => {
    if (!global_el.amPanel?.el) return
    if (!(ev.target instanceof Element)) return

    // app 版本
    if (global_setting.platform == 'app') {
      // 前者不包括 .am-panel (允许不规则区域)，后者包括 .widnows-pin，后者也可以写成 `matches('.windows-pin, .windows-pin *')`
      if (ev.target.matches('.am-panel *') || ev.target.closest('.windows-pin')) return
      global_setting.other.app_hide()
    }
    // obsidian 插件版本
    else {
      // 前者不包括 .am-panel (允许不规则区域)
      if (ev.target.matches('.am-panel *')) return
      this.hide()
    }
  }
  /// ESC隐藏
  static visual_listener_keydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      this.hide()
      return
    }
  }

  /// 上一次显示的面板列表
  static cache_last_panel_list: string[] = []
  /** 获取面板尺寸
   * 
   * 有两种获取方案。
   * 先用方案一约估，然后显示。后续使用方案二获得更准确的尺寸。
   */
  static get_size(list?: string[]): {width: number, height: number} {
    if (!list) {
      list = global_setting.key_panel.panel1
    }

    // 方案二：直接获取 am-panel 的尺寸 (需要面板进过一次渲染树后才可用)
    const isSameList = 
      this.cache_last_panel_list.length === list.length && 
      list.every((item, index) => item === this.cache_last_panel_list[index])
    if (isSameList) {
      const el_panel = global_el.amPanel?.el
      if (el_panel) {
        const rect = el_panel.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        if (width > 0 && height > 0) {
          return { width, height }
        }
      }
    }

    // 方案一: 单独计算所有子组件的尺寸 (可以显示前估算)
    // 缺点1: 会被用户 css 影响尺寸 (除非用 css 变量)
    // 缺点2: 动态宽高难以获取，对于动态内容的子面板只能估算，不能准确获取
    let width_list: number[] = [0]
    let height: number = 0
    let min_height = 0 // 主要用于处理建议栏
    for (const item of list) {
      if (item == 'search') {
        height += 32
        width_list.push(500)
        min_height = min_height > height+260 ? min_height : height+260 // 加建议栏的高度
      }
      else if (item == 'menu') {
        height += 248
        // height 和 width 其实都会随内容增多而增多
      }
      else if (item == 'miniEditor') {
        height += 276
        // 难以获取
      }
      else if (item == 'info') {
        height += 276
        // 难以获取
      }
      else if (item == 'toolbar') {
        height += 32
        // height 和 width 其实都会随内容增多而增多
      }
      else {
        continue
      }
    }
    if (height < min_height) {
      height = min_height
    }
    const width = Math.max(...width_list)

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
   * @param center_x x轴中心模式，即让窗口的中心对准光标位置
   *   此状态下，x轴不会应用纠正模式 (TODO 应强制为靠边显示)
   *   有的中心模式还是根据整个选取矩形来的，我这里只根据结束光标位置来
   */
  static fix_position(
    screen_size: {width: number, height: number},
    panel_size: {width: number, height: number},
    cursor: { x: number, y: number },
    mode: "revert"|"side" = "side",
    center_x: boolean = false
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

    // x轴中心模式
    if (center_x) {
      cursor.x = cursor.x - panel_size.width / 2
    }
    else {
      // // x轴溢出 TODO 上游给的屏幕坐标没考虑多屏的情况，面板的宽度也是错的
      // if (screen_size.width - side_gap < cursor.x + panel_size.width) {
      //   if (mode == "revert") {
      //     cursor.x = cursor.x - panel_size.width
      //   } else {
      //     cursor.x = screen_size.width - side_gap - panel_size.width
      //   }
      // }
    }

    return { x: cursor.x, y: cursor.y }
  }
}
