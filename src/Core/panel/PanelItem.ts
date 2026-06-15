/**
 * 面板的的UI项
 * 
 * 用于工具栏、菜单栏等的UI项进行复用
 */

import type { PanelItem } from "../../Type"
import { PLUGIN_MANAGER, PluginManager } from "../pluginManager/PluginManager"
import { global_setting } from "../../Core/setting"

import { textToIcon } from "./utils"

// 用于避免重复请求相同的图标
const lucideIconCache = new Map();

/** 项的通用逻辑 (工具栏、菜单栏等复用)
 * @param p_this AMToolbar|AMContextMenu 为了调用 sendText 和 hide 方法
 * @param mode 如何填充 li 内容
 * - icon:       用 item.icon
 * - label:      用 item.label
 * - none:       不填充
 * - icon-label: (未实现) 同时填充 icon+label
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
    const label = document.createElement('div'); li.appendChild(label); label.classList.add('am-context-menu-label')
      label.textContent = item.label
  }
  // 仅图标
  else if (mode === 'icon') {
    li.title = item.label
    if (!item.icon) { // 没有图标则用名字构造一个简易图标
      global_setting.api.saveInnerHTML(li, textToIcon(item.label, { twoLettersForEnglish: true }).html)
    } else if (item.icon.startsWith("lucide-")) {
      const iconName = item.icon.replace("lucide-", "");
      const iconUrl = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;
      // 如果缓存中有，直接命中缓存
      if (lucideIconCache.has(iconName)) {
        console.log('命中图标缓存', iconName)
        // 这个容器为了让多种方式生成的图标样式统一
        const span = document.createElement('span'); li.appendChild(span); span.classList.add('am-icon', 'am-icon-lucide');
        global_setting.api.saveInnerHTML(span, lucideIconCache.get(iconName));
      } else {
        // 这个容器为了让多种方式生成的图标样式统一
        const span = document.createElement('span'); li.appendChild(span); span.classList.add('am-icon', 'am-icon-lucide');

        // 2. (可选) 在加载完成前，先放置一个占位元素或 Loading SVG
        global_setting.api.saveInnerHTML(span, '');

        // 3. 异步获取图标
        fetch(iconUrl)
          .then(response => { // 异常则降级处理
            if (!response.ok) {
              global_setting.api.saveInnerHTML(li, textToIcon(item.label, { twoLettersForEnglish: true }).html)
              throw new Error(`Icon ${iconName} not found`);
            }
            return response.text();
          })
          .then(svgText => {
            lucideIconCache.set(iconName, svgText); // 存入缓存
            global_setting.api.saveInnerHTML(span, svgText);
          })
          .catch(error => { // 异常则降级处理
            console.warn("Failed to load Lucide icon:", error);
            global_setting.api.saveInnerHTML(li, textToIcon(item.label, { twoLettersForEnglish: true }).html)
          });
      }
    } else {
      // 这个容器为了让多种方式生成的图标样式统一
      const span = document.createElement('span'); li.appendChild(span); span.classList.add('am-icon', 'am-icon-svg');
        global_setting.api.saveInnerHTML(span, item.icon);
    }
  }

  // if (mode === 'icon') { // (可选) 可以仅应用于图标，也能用于多级菜单
  //   // (可选1) hash 背景颜色 (注意这里的亮度根据明暗主题又有所不同)
  //   // const hashColor = textToHashColor(item.label)
  //   // li.style.background = hashColor.background
  //   // li.style.color = hashColor.color
  // 
  //   // (可选2) hash 文字颜色 (注意这里的亮度根据明暗主题又有所不同)
  //   const hashColor = textToHashColor(item.label, undefined, undefined, undefined, 75 )
  //   li.style.color = hashColor.background
  // }

  // #endregion

  // 项功能
  if (item.content != undefined) { // 排除 "文件夹项"
    li.addEventListener('mousedown', (event) => {
      event.preventDefault() // 防止左/右键导致编辑光标失焦/改变
    })

    // b1. obsidian 专用命令
    if (item.type === "command_ob") {
      li.addEventListener('click', async () => {
        if (!item.content) return
        global_setting.other.obsidian_run_command?.(item.content); p_this.panel_hide();
      })
    }
    // b2. 输出纯文本
    else if (item.type === 'string' || item.type === "md") {
      li.addEventListener('click', async () => {
        if (!item.content) return
        await global_setting.api.sendText(item.content); p_this.panel_hide();
      })
    }
    // b3. 输出 path 对应的文件
    else if (item.type === 'path') {
      li.addEventListener('click', async () => {
        if (!item.content) return
        await global_setting.api.sendText(item.content, 'IMG_MODE'); p_this.panel_hide();
      })
    }
    // b4. 脚本
    else if (item.type === 'script') {
      const plugin = item.plugin ??
        item.content ? PLUGIN_MANAGER.plugin_list[item.content] : undefined;
      if (plugin) {
        li.addEventListener('click', async () => {
          const ctx = PluginManager.getPluginRunCtx(item.label)
          void plugin.run(ctx)
        })
        if (plugin.onCreateItem) {
          const ctx = PluginManager.getPluginRunCtx(item.label)
          plugin.onCreateItem(li, ctx)
        }
      }
    }
    // b5. 其他类型 (一般是未定义 / 文件夹)
    else {
      // console.error('未知的项类型:', item.type)
    }
  }

  // 项说明
  if (item.type && ["md", "path"].includes(item.type) && item.content) {
    let tooltip: HTMLElement|undefined = undefined
    li.onmouseenter = () => {
      // 清空 tooltip (可能存在，但一般不会存在，仅冗余避免重复创建和内存泄露)
      const existingTooltip = li.querySelector('.ab-contextmenu-tooltip')
      if (existingTooltip) {
        li.removeChild(existingTooltip)
      }

      // 创建 tooltip
      tooltip = document.createElement('div'); li.appendChild(tooltip);
      tooltip.classList.add('ab-contextmenu-tooltip')
      // 旧版写法，position: fixed。现在改为了absolute 定位
      // const domRect = li.getBoundingClientRect()
      // tooltip.setAttribute('style', `
      //   top: ${domRect.top + 1}px;
      //   left: ${domRect.right + 1}px;
      // `)

      if (item.type === "md") { // 一个flag, 表示渲染显示
        if (item.content) {
          void global_setting.other.renderMarkdown?.(item.content, tooltip)
        }
      }
      else if (item.type === "path") { // TODO 这里仅 url 支持，否则会有权限问题
        const img = document.createElement('img'); tooltip.appendChild(img);
          img.setAttribute('src', item.content ?? "");
          img.classList.add('tooltip-image');
      }
    }
    li.onmouseleave = () => {
      if (!tooltip) return
      li.removeChild(tooltip)
      tooltip = undefined
    }
  }
}
