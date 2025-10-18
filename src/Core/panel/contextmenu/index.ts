/**
 * 一个简单的右键菜单实现库
 * 
 * ## 适配问题
 * 
 * - Obsidian 环境:
 *   - 会需要挂载到原有菜单上 (如编辑器菜单)，以保留原有功能
 *   - 含Obsidian依赖
 * - Tauri 环境:
 *   - 其显示隐藏依赖于窗口的显示/隐藏，而非元素的显示/隐藏
 *   - 含Tauri依赖
 * - 通用环境 (包括App):
 *   - 自定义挂载的html元素
 *   - 不含任何特定环境依赖
 * 
 * 为什么在Obsidian环境中，也不统一用非obsidian环境？
 * 
 * - 使模块不用分别适配就能更简单通用
 * - obsidian 环境下一些地方用 obsidian 菜单接口的好处:
 *   - 正文菜单 (非局部) 可以追加选项，而不是覆盖。这样可以保留原有功能 (核心理由)
 *   - 样式和软件及主题统一
 * - 而obsidian环境一些局部不使用 ob 接口的好处:
 *   - 样式更自由、功能更灵活。代码的通用不需要另外适配
 *   - Obsidian默认菜单系统自身有bug: 到第三层菜单时，切换二级菜单不会更新三级菜单
 * 
 * ## 性能优化
 * 
 * 菜单有预创建 (性能优) 和动态创建两种，也可以综合 —— 部分动态内容
 */

import { global_setting } from "../../setting"
import { input_suggestion } from "./suggestion_old"

// [!code hl] Tauri
// import { EditableBlock_Raw } from "@editableblock/cm/dist/EditableBlock/src/EditableBlock_Raw"
import type { ContextMenuItems, ContextMenuItem } from "./demo"

/**
 * 一个上下文菜单
 * 
 * 功能:
 * 
 * - 自适应环境通用性
 * - 绑定到指定元素，并在右键时显示
 * - 允许追加菜单项
 * - [ ] 支持子菜单
 * 
 * BUG: 对象没正常关闭，事件监听重复
 * 
 * 注意: 所有在菜单上的操作都应该
 * 视情况 ev.preventDefault() 组织原事件
 * 和 ev.stopPropagation() 阻止冒泡
 * 
 * 事件要RAII式管理，确保运行时简单性
 */
export class ABContextMenu {
  // - el_parent/body
  //   - el_container .ab-context-menu

  /// 可选一个挂载对象来预创建菜单，用于自动销毁，防止内存泄露和重复监听 (如果多个复用元素共用菜单或更菜单则不需要传入)
  /// 不预创建菜单则没有该项 (非静态创建而是动态创建)
  public el_parent: HTMLElement|undefined
  /// 不预创建菜单则没有该项 (非静态创建而是动态创建)
  public el_container: HTMLDivElement|undefined
  /// 当前菜单是否处于显示状态
  private isShow: boolean = false

  // 创建一个菜单实例
  constructor(
    el_parent?: HTMLElement,
    menuItems?: ContextMenuItems,
      // is_append: boolean = false, // 是否根菜单/非独立菜单。若是则用原菜单来初始化
    // 或改成 "菜单位置" 功能性更强
  ) {
    this.el_parent = el_parent
    if (!el_parent) return

    // 创建菜单 DOM (默认隐藏)
    this.el_container = document.createElement('div'); el_parent.appendChild(this.el_container); this.el_container.classList.add('ab-context-menu', 'root-menu');
    this.hide()

    // 禁止右键切换光标。不阻止默认菜单和冒泡，不禁止菜单，仅禁止聚焦
    // 原因：聚焦切换到菜单内可能引起ab块重渲染，导致挂钩生命到ab块的菜单消失，而不挂钩生命到ab块则菜单项功能可能引起bug
    window.addEventListener('mousedown', (ev) => {
      if (!this.el_container) return
      if (this.el_container.contains(ev.target as Node)) return
      if (ev.button != 2) return
      ev.preventDefault()
    })

    // 可选的初始化语法糖
    if (menuItems) this.append_data(menuItems)
  }

  // #region 显示/隐藏菜单

  // 显示该菜单
  public show(x: number, y: number) {
    if (!this.el_container) return
    this.isShow = true
    this.el_container.style.left = `${x}px`
    this.el_container.style.top = `${y}px`
    this.el_container.classList.add('visible')

    window.addEventListener('click', this.visual_listener_click)
    window.addEventListener('mouseup', this.visual_listener_mouseup)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }
  // 隐藏该菜单
  public hide() {
    if (!this.el_container) return
    this.isShow = false
    this.el_container.classList.remove('visible')

    window.removeEventListener('click', this.visual_listener_click)
    window.removeEventListener('mouseup', this.visual_listener_mouseup)
    window.removeEventListener('keydown', this.visual_listener_keydown)
  }
  // 动态事件组。菜单显示时注册，隐藏时销毁
  // 当菜单处于显示状态时，右键到其他区域/左键/Esc，则隐藏菜单
  visual_listener_click = (ev: MouseEvent) => {
    if (!this.el_container) return
    if (!this.isShow) return
    if (this.el_container.contains(ev.target as Node)) return
    this.hide()
  }
  visual_listener_mouseup = (ev: MouseEvent) => {
    if (!this.isShow) return
    if (ev.button === 2) this.hide()
  }
  visual_listener_keydown = (ev: KeyboardEvent) => {
    if (!this.isShow) return
    if (ev.key === 'Escape') this.hide()
  }

  // #endregion

  /** 在目标上监听 contextmenu 事件，并显示该菜单 (仅非 App 环境)
   * @param targetElement 目标元素，或用于表示已有元素的字符串 (如文件菜单/编辑器菜单: 'file'|'editor')
   */
  public bind_emitArea(targetElement: HTMLElement | string) {
    if (typeof targetElement == 'string') return

    targetElement.addEventListener('contextmenu', (ev: MouseEvent) => {
      ev.preventDefault() // 阻止默认菜单，及防止编辑光标失焦
      ev.stopPropagation() // 阻止冒泡
      let x = ev.clientX
      let y = ev.clientY

      // 获取选中的文本
      const selectedText_ = window.getSelection()?.toString()
      global_setting.state.selectedText = (selectedText_ && selectedText_.length > 0) ? selectedText_ : undefined

      // 光标纠正: 在obsidian中，这个坐标是基于 workspace-tab-container 也就是md编辑区域的，而 非body的
      const workspaceContainer = document.querySelector('.workspace-leaf.mod-active');
      if (workspaceContainer) {
        const rect = workspaceContainer.getBoundingClientRect()
        const offsetX = rect.left + window.scrollX
        const offsetY = rect.top + window.scrollY
        x -= offsetX
        y -= offsetY
      }

      this.show(x, y)
    })
  }

  // #region 添加菜单项

  /** 添加菜单项 - 给菜单添加一个自定义元素
   * (如hr、input等，如果是常规元素推荐用 append_data)
   */
  append_el(el: HTMLElement) {
    if (!this.el_container) return

    this.el_container.appendChild(el)
  }

  /** 添加菜单项 - 操作糖，快捷添加一组按键
   * 
   * DOM:
   * - .ab-context-menu.root-menu (ul/div, el_container)
   *   - li
   *   - li.has-children
   *     - .ab-context-menu.sub-menu (ul/div, el_container)
   *       - li
   */
  append_data(menuItems: ContextMenuItems) {
    if (!this.el_container) return

    const li_list = (ul: HTMLElement, menuItems: ContextMenuItems) => { // HTMLUListElement
      menuItems.forEach((item: ContextMenuItem) => {
        const li = document.createElement('li'); ul.appendChild(li)
        // 菜单项标题
        li.textContent = item.label

        // 菜单项图标 (非ob版暂不支持)
        if (item.icon) {}

        // 菜单项功能
        {
          li.addEventListener('mousedown', (event) => {
            event.preventDefault() // 防止左/右键导致编辑光标失焦/改变
          })
          // b1. 无按钮事件
          if (item.callback == undefined) {}
          // b2. 输出 item.callback 文本到当前光标位置
          else if (typeof item.callback === 'string') {
            li.addEventListener('click', async () => {
              this.sendText(item.callback as string)
            })
          }
          // b3. 自定义事件
          else {
            const callback = item.callback
            li.addEventListener('click', async () => {
              const result = await callback(global_setting.state.selectedText)
              if (result && typeof result === 'string') {
                this.sendText(result)
              }
              this.hide()
            })
          }
        }

        // 菜单项说明
        let tooltip: HTMLElement|undefined = undefined
        if (item.detail) {
          li.onmouseenter = () => {
            tooltip = document.createElement('div'); document.body.appendChild(tooltip);
            tooltip.classList.add('ab-contextmenu-tooltip')
            const domRect = li.getBoundingClientRect()
            tooltip.setAttribute('style', `
              position: fixed;
              top: ${domRect.top + 1}px;
              left: ${domRect.right + 1}px;
              z-index: 9999;
              background: var(--background-secondary);
              padding: 8px;
              border-radius: 4px;
              box-shadow: var(--shadow-elevation-high);
              max-width: 300px;
            `)
            // top: ${evt.clientY + 10}px;
            // left: ${evt.clientX + 10}px;

            if (item.detail == "md") { // 一个flag
              if (typeof item.callback == "string") {
                void global_setting.other.renderMarkdown?.(item.callback, tooltip)
              }
            }
            else {
              const img = document.createElement('img'); tooltip.appendChild(img);
                img.setAttribute('src', item.detail as string);
                img.setAttribute('style', 'max-width: 100%; height: auto; display: block;');
            }
          }
          li.onmouseleave = () => {
            if (!tooltip) return
            document.body.removeChild(tooltip)
            tooltip = undefined
          }
        }

        // 菜单项的子菜单
        if (item.children) {
          li.classList.add('has-children')
          const li_ul = document.createElement('div'); li.appendChild(li_ul); li_ul.classList.add('ab-context-menu', 'sub-menu');
          li_list(li_ul, item.children)
          li.addEventListener('mouseenter', () => {
            li_ul.classList.add('visible')
          })
          li.addEventListener('mouseleave', () => {
            li_ul.classList.remove('visible')
          })
        }
      })
    }

    li_list(this.el_container, menuItems)
  }

  /** 添加菜单项 - 操作糖，添加header切换器
   * 
   * header切换器带输入框、下拉框、提示补全
   * 
   * 其中输入框回车或点击建议栏应用，ESC和失焦不应用 (TODO 手机版应该得失焦应用吧)
   */
  append_headerEditor(header_old: string, header_callback: (header_new: string) => void) {
    const header_r = document.createElement('div'); header_r.classList.add('ab-context-menu-header');
    const header_span = document.createElement('span'); header_r.appendChild(header_span); header_span.classList.add('left');
    header_span.textContent = 'header: '
    const header_input = document.createElement('input'); header_r.appendChild(header_input);
    header_input.value = header_old; // 这里应该是一个有提示下拉框的input

    input_suggestion(header_input, header_r) // 注意: 先注册建议列表事件再注册input enter事件，以让建议列表的enter事件先被触发

    // header_2.onchange = () => {
    //   header_callback(header_2.value)
    // } // 取消 // BUG: 内部焦点转移时 (点击而非使用Enter来选中建议项) 不要触发。用click代替
    // window.addEventListener('click', (ev) => { // 外击应用值
    //   ev.stopPropagation()
    //   if (!this.isShow) return
    //   if (header_r.contains(ev.target as Node)) return
    //   header_callback(header_2.value)
    //   this.hide()
    // })
    header_input.addEventListener('keydown', (ev) => { // input enter和suggestion enter冲突，前者先触发
      if (ev.key === 'Enter') { // 按回车应用值
        ev.preventDefault()
        // 获取隐藏值 (提示值)
        header_callback(header_input.value)
        this.hide()
      }
      // if (ev.key === 'Escape') { // 按esc不应用值
      //   ev.preventDefault()
      //   ev.stopPropagation()
      //   header_2.value = header_old
      //   this.hide()
      // }
    })
    this.append_el(header_r)
  }

  // #endregion

  public async sendText(str: string) {
    if (global_setting.env === 'app') {
      await global_setting.api.sendText(str); this.hide(); return;
    }
    else if (global_setting.env === 'obsidian-plugin') {
      await global_setting.api.sendText(str); this.hide(); return;
    }
    // 后面是通用 browser 环境

    // 获取当前焦点元素（通常是输入框、文本区域或可编辑元素）
    // 注意:
    // - 非 Tauri 程序中，我们采用了非失焦的方式展开菜单
    // - 但 Tauri 程序中，我们采用了失焦的方式展开菜单
    const activeElement: Element|null = document.activeElement

    // 检查该元素是否是可编辑的输入框或文本域
    if (!activeElement) {
      console.warn('没有活动的元素，将demo文本生成到剪贴板')
      navigator.clipboard.writeText(str).catch(err => console.error("Could not copy text: ", err))
    } else {
      await global_setting.api.sendText(str)
      // EditableBlock_Raw.insertTextAtCursor(activeElement as HTMLElement, str) // 旧，通用
    }

    this.hide(); return;
  }

  // -------------------- 使用示例 --------------------

  // 用例
  static demo() {
    const menuItems: ContextMenuItems = [
      { label: '操作一', callback: async () => console.warn('执行了操作一') },
      {
        label: '操作二', callback: async () => console.warn('执行了操作二'), children: [
          { label: '操作2.1', callback: async () => console.warn('执行了操作2.1') },
          { label: '操作2.2', callback: async () => console.warn('执行了操作2.2') },
        ]
      },
      {
        label: '操作三', children: [
          { label: '操作3.1', callback: async () => console.warn('执行了操作3.1') },
          { label: '操作3.2', callback: async () => console.warn('执行了操作3.2') },
        ]
      }
    ]

    // 创建菜单实例
    const myMenu = new ABContextMenu(document.body as HTMLDivElement, menuItems)

    // 找到一个目标元素并附加菜单
    const targetArea = document.getElementById('my-app') // 假设你的应用挂载点是 #my-app
    if (targetArea) {
      targetArea.style.height = '300px'
      targetArea.style.backgroundColor = '#eef'
      targetArea.style.display = 'flex'
      targetArea.style.alignItems = 'center'
      targetArea.style.justifyContent = 'center'
      targetArea.innerText = '在这里右键试试'

      myMenu.bind_emitArea(targetArea)
    }
  }
}

// /** 装饰 - 叉 */
// function input_delete() {
//   
// }
