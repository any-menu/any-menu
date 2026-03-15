/**
 * 面板的的UI项
 * 
 * 用于工具栏、菜单栏等的UI项进行复用
 */

import { global_setting } from "../../Core/setting";

export type PanelItem = {
  label: string // 显示名，众多别名中的主名称
  // 如果是字符串则表示黏贴该字符串，方便声明demo模板 (TODO demo模板可能需要配图和help url?)
  callback?: string | ((str?: string) => Promise<void|string>)
  icon?: string // 目前仅obsidian环境有效，使用lucide图标
  key?: string // 匹配名，显示名的多个别名、匹配增强名、拼音等
  // 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)。
  // 话说如果不包含用例，像ob环境，直接渲染岂不是更好?
  detail?: string
  order?: number // 用于控制排序
  children?: PanelItem[] // (目前仅菜单栏支持多级菜单，工具栏不支持)
}

/// 项的通用逻辑 (工具栏、菜单栏等复用)
export function init_item(li: HTMLElement, item: PanelItem) {
  // 项图标 (~~非ob版~~ 暂不支持)
  if (item.icon) {}

  // 项功能
  {
    li.addEventListener('mousedown', (event) => {
      event.preventDefault() // 防止左/右键导致编辑光标失焦/改变
    })
    // b1. 无按钮事件
    if (item.callback == undefined) {}
    // b2. obsidian 专用命令
    else if (item.detail == "command_ob") {
      li.addEventListener('click', async () => {
        global_setting.other.run_command_ob?.(item.callback as string)
      })
    }
    // b3. 输出 item.callback 文本到当前光标位置
    else if (typeof item.callback === 'string') {
      li.addEventListener('click', async () => {
        this.sendText(item.callback as string)
      })
    }
    // b4. 自定义命令
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

  // 项说明
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

      if (item.detail == "md") { // 一个flag, 表示渲染显示
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
}
