/**
 * 一个简单的右键菜单实现库 —— App版本，去除Tauri和Obsidian依赖
 */

import { ABContextMenu } from '@/Core/panel/contextmenu/index'

import { EditableBlock_Raw } from "@editableblock/textarea/dist/EditableBlock/src/EditableBlock_Raw"
import type { ContextMenuItems, ContextMenuItem } from "@/Core/panel/contextmenu/demo"

/**
 * 一个上下文菜单 - 通用版 (App)
 */
export class ABContextMenu_App extends ABContextMenu {

  // 创建一个菜单实例
  constructor(
    el_parent?: HTMLDivElement,
    menuItems?: ContextMenuItems,
      // is_append: boolean = false, // 是否根菜单/非独立菜单。若是则用原菜单来初始化
    // 或改成 "菜单位置" 功能性更强
  ) {
    super(el_parent, menuItems)
  }

  override append_data(menuItems: ContextMenuItems) {
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
            li.addEventListener('click', () => {
              // 获取当前焦点元素（通常是输入框、文本区域或可编辑元素）
              const activeElement: Element|null = document.activeElement

              // 检查该元素是否是可编辑的输入框或文本域
              if (!activeElement) {
                console.warn('没有活动的输入框，将demo文本生成到剪贴板')
                navigator.clipboard.writeText(item.callback as string).catch(err => console.error("Could not copy text: ", err))
              } else {
                EditableBlock_Raw.insertTextAtCursor(activeElement as HTMLElement, item.callback as string)
              }

              this.hide()
            })
          }
          // b3. 自定义事件
          else {
            const callback = item.callback
            li.addEventListener('click', () => {
              callback()
              this.hide()
            })
          }
        }

        // 菜单项说明
        let tooltip: HTMLElement|undefined = undefined
        if (item.detail) {
          li.onmouseenter = () => {
            tooltip = document.createElement('div'); li.appendChild(tooltip);
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
            const img = document.createElement('img'); tooltip.appendChild(img);
              img.setAttribute('src', item.detail as string);
              img.setAttribute('style', 'max-width: 100%; height: auto; display: block;');
          }
          li.onmouseleave = () => {
            if (!tooltip) return
            li.removeChild(tooltip)
            tooltip = undefined
          }
        }

        // 菜单项的子菜单
        if (item.children) {
          li.classList.add('has-children')
          const li_ul = document.createElement('div'); li.appendChild(li_ul); li_ul.classList.add('am-context-menu', 'sub-menu');
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
}

// 非AnyBlock的通用环境的原根/正文菜单 (给App用)
export const root_menu_raw: ContextMenuItems = [
  { label: '请用快捷键代替', children: [
    { label: '撤销 (ctrl z)', callback: async () => {} },
    { label: '重做 (ctrl shift z)', callback: async () => {} },
    { label: '复制 (ctrl c)', callback: async () => {} },
    { label: '剪切 (ctrl x)', callback: async () => {} },
    { label: '黏贴 (ctrl v)', callback: async () => {} },
    { label: '黏贴为无格式文本 (ctrl shift v)', callback: async () => {} },
    { label: '删除 (delete)', callback: async () => {} },
    { label: '全选 (ctrl a)', callback: async () => {} },
  ] },
]
