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

    // #region 点击置顶
    amPin.addEventListener('click', () => {
      global_setting.api.pin()
    })
    // #endregion

    // #region 拖拽部分

    // 允许拖拽 amPin 来修改 am-panel 的位置
    // 注意: am-panel 本来就会使用 inline style 的 left 和 top 来控制位置
    // 注意: 拖拽后强制设置为置顶状态，且不要触发 click 事件

    if (global_setting.platform === 'app') return // TODO 后面再写
    const amPanel = el

    let isDragging = false  // 是否拖拽状态
    let startX = 0          // 起始x轴
    let startY = 0          // 起始y轴
    let startLeft = 0       // 起始 left
    let startTop = 0        // 起始 top

    // 鼠标移动 (无节流，也无使用虚拟dom节约性能)
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      // 移动后的值
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newLeft = startLeft + dx
      let newTop  = startTop  + dy

      // 限制在视口范围内，防止面板被拖出屏幕
      const panelRect = amPanel.getBoundingClientRect()
      const maxLeft = window.innerWidth  - panelRect.width - 26 // 26 是 pin 按钮超出 am-panel 的空间
      const maxTop  = window.innerHeight - panelRect.height
      newLeft = Math.max(0, Math.min(newLeft, maxLeft))
      newTop  = Math.max(0, Math.min(newTop,  maxTop))

      // 新值
      amPanel.style.left = `${newLeft}px`
      amPanel.style.top  = `${newTop}px`
    }

    // 鼠标抬起
    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging) return

      isDragging = false
      amPin.classList.remove('am-pin--dragging')

      // 去除临时监听
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)

      // 阻止触发 click（dragStart 后不应触发 pin()）
      e.preventDefault()
      e.stopPropagation()
    }

    // 鼠标按下
    amPin.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return // 仅响应左键

      // 初始状态
      // 若 panel 使用的是非 px 单位（如未设置），先初始化
      const computedStyle = window.getComputedStyle(amPanel)
      startLeft = parseInt(computedStyle.left) || amPanel.offsetLeft
      startTop  = parseInt(computedStyle.top)  || amPanel.offsetTop
      startX = e.clientX
      startY = e.clientY

      isDragging = true
      amPin.classList.add('am-pin--dragging')

      // 添加临时监听
      // 挂到 document 上，防止鼠标移动过快时飞出按钮区域时丢失事件
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup',   onMouseUp)

      // 阻止触发 click（dragStart 后不应触发 pin()）
      e.preventDefault()
      e.stopPropagation()
    })

    // 拖拽结束后判断是否算作"点击"：位移极小则触发 pin()
    // 已在 mousedown 中 preventDefault，click 事件默认不会触发，
    // 如需区分点击与拖拽，可在此处根据位移量手动调用 global_setting.api.pin()

    // #endregion
  }
}
