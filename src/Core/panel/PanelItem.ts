/**
 * 面板的的UI项
 * 
 * 用于工具栏、菜单栏等的UI项进行复用
 */

import { PluginInterfaceCtxDemo, type PluginInterfaceCtx } from "../pluginManager/PluginInterface";
import { global_setting } from "../../Core/setting";

import { textToIcon } from "./utils"
import DOMPurify from 'dompurify';

export type PanelItem = {
  label: string // 显示名，众多别名中的主名称
  // 执行该项。如果是字符串则表示黏贴该字符串，方便声明demo模板 (TODO demo模板可能需要配图和help url?)
  callback?: string | ((ctx: PluginInterfaceCtx) => Promise<void>)
  // callback_old?: string | ((str?: string) => Promise<void|string>)
  // 详见 PluginInterface.metadata.icon 注释，此处的 string 使用前记得 DOMPurify 处理
  icon?: string
  key?: string // 匹配名，显示名的多个别名、匹配增强名、拼音等
  // 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)。
  // 话说如果不包含用例，像ob环境，直接渲染岂不是更好?
  detail?: string
  order?: number // 用于控制排序
  children?: PanelItem[] // (目前仅菜单栏支持多级菜单，工具栏不支持)
}

// 用于避免重复请求相同的图标
const lucideIconCache = new Map();

/** 项的通用逻辑 (工具栏、菜单栏等复用)
 * @param p_this AMToolbar|AMContextMenu 为了调用 sendText 和 hide 方法
 * @param mode 如何填充 li 内容
 * - icon: 用 item.icon
 * - label: 用 item.label
 * - none: 不填充
 * - icon-label: 同时填充 icon+label (未实现)
 */
export function init_item(
  p_this: any,
  li: HTMLElement,
  item: PanelItem,
  mode: 'icon' | 'label' | 'none' = 'label'
) {
  // #region 填充显示内容 (标题/图标)
  // 不填充
  if (mode === 'none') {}
  // 仅标题
  else if (mode === 'label') {
    li.textContent = item.label
  }
  // 仅图标
  else if (mode === 'icon') {
    li.title = item.label
    if (!item.icon) { // 没有图标则用名字构造一个简易图标
      li.innerHTML = textToIcon(item.label, { twoLettersForEnglish: true }).html
    } else if (item.icon.startsWith("lucide-")) {
      const iconName = item.icon.replace("lucide-", "");
      const iconUrl = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;
      // 如果缓存中有，直接命中缓存
      if (lucideIconCache.has(iconName)) {
        console.log('命中图标缓存', iconName)
        li.innerHTML = DOMPurify.sanitize(lucideIconCache.get(iconName), {
          USE_PROFILES: { svg: true }
        });
      } else {
        // 2. [可选] 在加载完成前，先放置一个骨架屏或 Loading SVG
        // li.innerHTML = `<svg class="animate-spin ...">...</svg>`; 

        // 3. 异步获取图标
        fetch(iconUrl)
          .then(response => {
            if (!response.ok) throw new Error(`Icon ${iconName} not found`);
            return response.text();
          })
          .then(svgText => {
            // 这个容器为了让多种方式生成的图标样式统一
            const span = document.createElement('span'); li.appendChild(span); span.classList.add('am-icon', 'am-icon-lucide');

            lucideIconCache.set(iconName, svgText); // 存入缓存
            span.innerHTML = DOMPurify.sanitize(svgText, { // 安全插入到 DOM 中，严格 SVG 模式
              USE_PROFILES: { svg: true }
            });
          })
          .catch(error => { // 异常则降级处理
            console.warn("Failed to load Lucide icon:", error);
            li.innerHTML = textToIcon(item.label, { twoLettersForEnglish: true }).html
          });
      }
    } else {
      li.innerHTML = DOMPurify.sanitize(item.icon, { // 安全插入到 DOM 中，严格 SVG 模式
        USE_PROFILES: { svg: true }
      })
    }
  }
  // #endregion

  // 项功能
  if (item.callback != undefined) {
    li.addEventListener('mousedown', (event) => {
      event.preventDefault() // 防止左/右键导致编辑光标失焦/改变
    })
    // b1. obsidian 专用命令
    if (item.detail == "command_ob") {
      li.addEventListener('click', async () => {
        global_setting.other.run_command_ob?.(item.callback as string); p_this.hide();
      })
    }
    // b2. 输出 item.callback 文本到当前光标位置
    else if (typeof item.callback === 'string') {
      li.addEventListener('click', async () => {
        await global_setting.api.sendText(item.callback as string); p_this.hide();
      })
    }
    // b3. 自定义命令
    else {
      const callback = item.callback
      li.addEventListener('click', async () => {
        void callback({
          env: {
            ...PluginInterfaceCtxDemo.env,
            platform: global_setting.platform,
            selectedText: global_setting.state.selectedText,
          },
          api: {
            ...PluginInterfaceCtxDemo.api,
            notify: async (message: string) => {
              await global_setting.api.notify(item.label + ': ' + message)
            },
          }
        })
        // old
        // const result = await callback(global_setting.state.selectedText)
        // if (result && typeof result === 'string') {
        //   await global_setting.api.sendText(result); p_this.hide();
        // }
      })
    }
  }

  // 项说明
  if (item.detail) {
    let tooltip: HTMLElement|undefined = undefined
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
