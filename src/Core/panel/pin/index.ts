import { global_setting } from "../../setting"

export class AMPin {
  static factory(el: HTMLElement) {
    return new AMPin(el)
  }

  /**
   * @param el 挂载的元素，同时也是 .am-panel 元素
   * 
   * 注意: 普通浏览器环境和 App 环境中，这个置顶和拖拽的行为有所差异。App 版本要作用于窗口上
   */
  constructor(el: HTMLElement) {
    const amPin = document.createElement('div'); el.appendChild(amPin); amPin.classList.add('am-pin')
    global_setting.api.saveInnerHTML(amPin, `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`)

    this.initEvent(amPin, el)
  }

  /**
   * 初始化按钮事件
   * 
   * 点击: 切换置顶状态
   * 拖拽: 允许拖拽 amPin 来修改 amPanel 的位置
   * 
   * @param pinEl amPin 元素
   * @param panelEl amPanel 元素
   * 
   * 注意: 
   * - amPanel 本来就会使用 inline style 的 left 和 top 来控制位置
   * - 拖拽后强制设置为置顶状态，且不要触发 click 事件
   */
  initEvent(pinEl: HTMLElement, panelEl: HTMLElement) {
    let isDragging = false  // 是否拖拽状态 (是否鼠标按下了)
    let didDrag = false     // 是否发生过拖动
    let startX = 0          // 起始x轴
    let startY = 0          // 起始y轴
    let startLeft = 0       // 起始 left
    let startTop = 0        // 起始 top

    // 鼠标移动 (无节流，也无使用虚拟dom节约性能)
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return // 理论不会发生

      // 状态标记
      didDrag = true

      // 移动后的值
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newLeft = startLeft + dx
      let newTop  = startTop  + dy

      // 限制在视口范围内，防止面板被拖出屏幕
      const panelRect = panelEl.getBoundingClientRect()
      const maxLeft = window.innerWidth  - panelRect.width - 26 // 26 是 pin 按钮超出 am-panel 的空间
      const maxTop  = window.innerHeight - panelRect.height
      newLeft = Math.max(0, Math.min(newLeft, maxLeft))
      newTop  = Math.max(0, Math.min(newTop,  maxTop))

      // 新值
      if (global_setting.platform === 'app') return // TODO 后面再写
      panelEl.style.left = `${newLeft}px`
      panelEl.style.top  = `${newTop}px`
    }

    // 鼠标抬起
    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging) return // 理论不会发生

      // 状态标记
      isDragging = false
      pinEl.classList.remove('am-pin--dragging')
      if (!didDrag) {
        global_setting.api.pin() // 没有发生过拖动
      } else {
        global_setting.api.pin(true) // 强制置顶
      }
      didDrag = false

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
      // 若 panel 使用的是非 px 单位（如未设置），先初始化
      const computedStyle = window.getComputedStyle(panelEl)
      startLeft = parseInt(computedStyle.left) || panelEl.offsetLeft
      startTop  = parseInt(computedStyle.top)  || panelEl.offsetTop
      startX = e.clientX
      startY = e.clientY

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
}
