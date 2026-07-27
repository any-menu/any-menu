import { AMPanel } from ".."
import { AbsAmPanel } from "../../abs"
import { global_setting } from "../../../shared/setting"

export class AMPin extends AbsAmPanel {
  static factory(p_panel: AbsAmPanel, amPanel: AMPanel) {
    return new AMPin(p_panel, amPanel)
  }

  constructor(public p_panel: AbsAmPanel, public amPanel: AMPanel) {
    const el = document.createElement('div'); p_panel.el.appendChild(el); el.classList.add('am-pin')
    super(el, p_panel.el, p_panel)

    global_setting.api.saveInnerHTML(this.el, `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`)

    // 这里的 target_el 不一定是 p_el
    // if (p_el.classList.contains('am-panel')) {
    //   this.initEvent(this.el, p_el)
    // } else {
    //   const p_p_el = p_el.parentElement
    //   if (p_p_el && p_p_el.classList.contains('am-panel')) {
    //     this.initEvent(this.el, p_p_el)
    //   }
    // }
    AMPin.initEvent(this.el, amPanel)
  }

  /**
   * 初始化按钮事件
   * 
   * 点击: 切换置顶状态
   * 拖拽: 允许拖拽 amPin 来修改 amPanel 的位置
   * 
   * @param pinEl amPin 元素，或可拖拽元素
   *   (本来是仅 amPin 的，后来 amTitlebar 也允许了)
   * @param panelEl amPanel 元素
   * 
   * 注意: 
   * - amPanel 本来就会使用 inline style 的 left 和 top 来控制位置
   * - panel 有可能使用了 transform 来实现翻转，所以判断是否超出视口时要使用实际位置而非 inline style 的 left 和 top
   * - Obsidian 环境中限制不要拖拽得太高，Obsidian 的窗口拖拽事件要优先于面板的拖拽事件
   * - 拖拽后强制设置为置顶状态，且不要触发 click 事件
   * - 普通浏览器环境和 App 环境中，这个置顶和拖拽的行为的实现有所差异。
   *   App 通过 `-webkit-app-region` 实现。且设置该值后，拖拽时连鼠标按下事件都不会触发
   */
  public static initEvent(pinEl: HTMLElement, amPanel: AMPanel) {
    const  panelEl: HTMLElement = amPanel.el
    let isDragging = false    // 是否拖拽状态 (是否鼠标按下了)
    let didDrag = false       // 是否发生过拖动
    //  (以下变量在开始拖拽时，会自动更新)
    let startElLeft = 0       // 起始元素 left 属性 (不一定为真实位置, 可能有 transform 等属性)
    let startElTop = 0        // 起始元素  top 属性 (不一定为真实位置, 可能有 transform 等属性)
    let startElx = 0          // 起始元素 x 轴位置
    let startEly = 0          // 起始元素 y 轴位置
    let startElWidth = 0      // 起始元素宽度
    let startElHeight = 0     // 起始元素高度
    let startElOffsetLeft = 0 // 冗余，== `- startElx + startElLeft` == minLeft
    let startElOffsetTop = 0  // 冗余，== `- startEly + startElTop`  == minTop
    let startMouseX = 0       // 起始光标 x 轴
    let startMouseY = 0       // 起始光标 y 轴

    // 鼠标移动 (无节流，也无使用虚拟dom节约性能)
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return // 理论不会发生

      // 状态标记
      didDrag = true
      if (global_setting.platform === 'app') return // App 环境不走这里。不过一般也到不了这个事件，仅以防万一

      // 移动后的值
      const dx = e.clientX - startMouseX
      const dy = e.clientY - startMouseY
      let endElx = startElx + dx
      let endEly = startEly + dy

      // 位置纠正
      const ret = AMPanel.fix_position_when_move(
        {width: window.innerWidth, height: window.innerHeight},
        {width: startElWidth, height: startElHeight},
        {x: endElx, y: endEly},
      )
      endElx = ret.x
      endEly = ret.y

      // 应用新值
      const endElLeft = startElLeft + (endElx - startElx)
      const endElTop  = startElTop  + (endEly - startEly)
      panelEl.style.left = `${endElLeft}px`
      panelEl.style.top  = `${endElTop}px`
    }

    // 鼠标抬起
    const onMouseUp = (e: MouseEvent) => {
      // 清空正在拖拽的标记
      if (!isDragging) return // 理论不会发生
      isDragging = false
      pinEl.classList.remove('am-pin--dragging')

      // 点击置顶行为，清空是否拖拽过的标记
      if (pinEl.classList.contains('am-pin')) {
        // 状态标记
        if (!didDrag) {
          global_setting.api.pin() // 没有发生过拖动，则切换置顶
        } else {
          global_setting.api.pin(true) // 强制置顶
        }
        didDrag = false
        // titlebar 自动显示
        if (global_setting.state.isPin) {
          amPanel.sub_panels.amTitlebar?.panel_show()
          amPanel.sub_panels.amPin?.hide()
        } else {
          amPanel.sub_panels.amTitlebar?.panel_hide()
          amPanel.sub_panels.amPin?.show()
        }
      }

      // 去除临时监听
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)

      // 阻止触发 click
      e.preventDefault()
      e.stopPropagation()
    }

    // 鼠标按下
    pinEl.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return // 仅响应左键

      // 初始状态
      // 最终 left 值 = 起始 left 值 + (目标 x 轴 - 起始 x 轴)
      const startElRect = panelEl.getBoundingClientRect()
      startElx = startElRect.x
      startEly = startElRect.y
      startElWidth = startElRect.width
      startElHeight = startElRect.height
      const computedStyle = window.getComputedStyle(panelEl)
      startElLeft = parseInt(computedStyle.left) || panelEl.offsetLeft // 避免非 px 单位
      startElTop  = parseInt(computedStyle.top)  || panelEl.offsetTop
      startElOffsetLeft = - startElx + startElLeft
      startElOffsetTop  = - startEly + startElTop
      startMouseX = e.clientX
      startMouseY = e.clientY

      // 状态标记
      isDragging = true
      didDrag = false
      pinEl.classList.add('am-pin--dragging')

      // 添加临时监听
      // 挂到 document 上，防止鼠标移动过快时飞出按钮区域时丢失事件
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup',   onMouseUp)

      // 阻止触发 click
      e.preventDefault()
      e.stopPropagation()
    })
  }

  hide() {
    this.el.classList.add('am-hide')
  }

  show() {
    this.el.classList.remove('am-hide')
  }
}
