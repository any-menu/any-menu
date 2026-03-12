import { global_setting } from "../../../Core/setting"
import { textToIcon } from "../utils"

export type ToolbarItem = {
  label: string // 显示名，众多别名中的主名称
  // 如果是字符串则表示黏贴该字符串，方便声明demo模板 (TODO demo模板可能需要配图和help url?)
  callback?: string | ((str?: string) => Promise<void|string>)
  icon?: string // 目前仅obsidian环境有效，使用lucide图标
  key?: string // 匹配名，显示名的多个别名、匹配增强名、拼音等
  // 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)。
  // 话说如果不包含用例，像ob环境，直接渲染岂不是更好?
  detail?: string
  // children?: ToolbarItems
  order?: number // 用于控制排序
}

export class AMToolbar {
  public el_parent: HTMLElement;
  public el: HTMLElement;
  
  isShow = true

  static factory(
    el_parent: HTMLElement,
  ) {
    return new AMToolbar(el_parent)
  }

  constructor(
    el_parent: HTMLElement,
  ) {
    this.el_parent = el_parent
    this.el = document.createElement('div'); el_parent.appendChild(this.el); this.el.classList.add('am-toolbar');
    this.hide()
  }

  /** 添加 index 项
   * 
   * 旧版中。这里的顺序需要等待所有文件加载完成后，根据已排序好的列表进行初始化，从而控制顺序
   * 新版中。这里使用配置的 order 属性来控制顺序。一是可以动态填充，更快也能工作中插入，二是更简单可控
   * 无 order 属性的则视为 1000，同 order 则根据顺序插入
   */
  append_data(toolbarItems: ToolbarItem[]) {
    // TODO: toolbar 理应支持 alt key，以后再做
    // let alt_key_index = current_node.children.length // alt+key 快捷键 (目前仅支持顺序的 [1-90a-z]，将0放9后面优化手感。超出不显示，不支持自定义)

    toolbarItems.forEach((item: ToolbarItem) => {
      // alt_key_key
      // let alt_key_key: string = ''
      // if (alt_key_index < 9) {
      //   alt_key_key = (alt_key_index + 1).toString()
      // } else if (alt_key_index == 9) {
      //   alt_key_key = "0"
      // } else if (alt_key_index < 36) {
      //   alt_key_key = String.fromCharCode(97 + alt_key_index - 10)
      // }
      // alt_key_index++

      // 检查 order
      if (global_setting.config.toolbar_list.length == 0) {} // 没限制则全部放行
      else if (global_setting.config.toolbar_list.includes(item.label)) { // 有则添加顺序
        const index = global_setting.config.toolbar_list.indexOf(item.label)
        item.order = index
      }
      else { // 没有则不显示
        return
      }

      const li = document.createElement('span'); li.classList.add('am-toolbar-item');
        // li.setAttribute('data-altkey', alt_key_key);
        // sub_node = { el: li, parent: current_node, children: [], vFocus_index: -1 }; current_node.children.push(sub_node);
      // li.textContent = item.label
      li.innerHTML = textToIcon(item.label, { twoLettersForEnglish: true }).html

      // 根据 order 插入节点
      const order = item.order ?? 1000; li.dataset.order = order.toString();
      let inserted = false; // 若为 true，表示已插入到某个节点的前面
      for (const child of Array.from(this.el.children) as HTMLElement[]) {
        const childOrderAttr = child.dataset.order;
        const childOrder = childOrderAttr !== undefined ? parseInt(childOrderAttr, 10) : 1000;
        if (childOrder > order) { // 找到第一个 order 比当前大的节点，插在它前面
          this.el.insertBefore(li, child);
          inserted = true;
          break;
        }
      }
      if (!inserted) { // 如果没有比它大的，说明应该是最大的，直接追加在最后
        this.el.appendChild(li);
      }

      // 菜单项图标 (~~非ob版~~ 暂不支持)
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
            if (item.detail == "command_ob") {
              global_setting.other.run_command_ob?.(item.callback as string)
              return
            }

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
          if (item.detail == "command_ob") return // 命令flag, 不显示
          tooltip = document.createElement('div'); li.appendChild(tooltip);
          tooltip.classList.add('ab-contextmenu-tooltip')
          const domRect = li.getBoundingClientRect()
          tooltip.setAttribute('style', `
            top: ${domRect.top + 1}px;
            left: ${domRect.right + 1}px;
          `)
          // top: ${evt.clientY + 10}px;
          // left: ${evt.clientX + 10}px;

          if (item.detail == "md") { // 一个flag
            if (typeof item.callback == "string") {
              void global_setting.other.renderMarkdown?.(item.callback, tooltip)
            }
          } else {
            const img = document.createElement('img'); tooltip.appendChild(img);
              img.setAttribute('src', item.detail as string);
              img.setAttribute('style', 'max-width: 100%; height: auto; display: block;');
          }
        }
        li.onmouseleave = () => {
          if (!tooltip) return
          li.removeChild(tooltip)
          tooltip = undefined
        }
      }
    })
  }

  public async sendText(str: string) {
    // app环境 / obsidian插件环境
    if (global_setting.env === 'app' || global_setting.env === 'obsidian-plugin') {
      await global_setting.api.sendText(str); this.hide(); return;
    }
    // 后面是通用 browser 环境
    else {
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
  }

  // #region 显示/隐藏菜单

  show(x?: number, y?: number) {
    this.el.classList.remove('am-hide'); this.isShow = true;

    if (x !== undefined) this.el.style.left = `${x}px`
    if (y !== undefined) this.el.style.top = `${y}px`
    
    this.el.classList.remove('am-hide')
    this.el.classList.add('visible')
    this.el?.classList.remove('show-altkey')

    window.addEventListener('click', this.visual_listener_click)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }

  hide() {
    if (global_setting.state.isPin) return
    this.el.classList.add('am-hide'); this.isShow = false;

    window.removeEventListener('click', this.visual_listener_click)
    window.removeEventListener('keydown', this.visual_listener_keydown)
  }

  visual_listener_click = (ev: MouseEvent) => {
    if (!this.el) return
    if (this.el.contains(ev.target as Node)) return
    this.hide()
  }

  visual_listener_keydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      this.hide()
      return
    }
  }

  // #endregion
}
