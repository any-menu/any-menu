/**
 * 面板的的UI项
 * 
 * 用于工具栏、菜单栏等的UI项进行复用
 */

import type { PluginInterfaceCtx } from "../../Type"
import { PluginManager } from "../pluginManager/PluginManager"
import { global_setting } from "../../Core/setting"

import { textToIcon } from "./utils"

/** 面板上的项
 * 
 * 统一将不同的来源整合成相同的结果。来源可能是:
 * - 各种词典 (json / yaml / toml)。TODO json/yaml 未支持，需支持一下
 *   - md 类型 (txt一定是md类型 (纯文本类型也行，目前不区分这两))
 *   - command_ob 类型，会转义为执行 ob 命令
 * - 插件 (js)
 * - 注意 csv / txt 不走这里，不会仅面板显示，只走数据库
 */
export type PanelItem = {
  /// 显示名。众多别名中的主名称
  label: string
  /** 详见 PluginInterface.metadata.icon 注释，此处的 string 使用前记得 DOMPurify 处理 */
  icon?: string
  /// 匹配名，显示名的多个别名、匹配增强名、拼音等
  key?: string
  /**
   * 现用法:
   * 在字典中表示 callback 的类型
   * 
   * 旧用法:
   * 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)。
   * 话说如果不包含用例，像ob环境，直接渲染岂不是更好?
   */
  detail?: string
  /** 用于控制其项的排序，越小越靠前，默认为 1000 */
  order?: number
  /** 
   * 多级菜单中的子菜单项
   * - 目前仅菜单栏支持多级菜单，工具栏不支持
   * - 仅 json/yaml/toml 来源支持声明多级菜单，txt 和 js 不支持
   */
  children?: PanelItem[]
  /** 
   * 执行该项
   * - 字符串: 输出该字符串，一般用于词典。方便声明demo模板
   * - 函数: 自定义回调，一般用于自定义脚本
   */
  callback?: string | ((ctx: PluginInterfaceCtx) => Promise<void>)
  /**
   * 仅脚本支持的部分
   * 
   * 这里的 string 类型是无效的 (应去掉)，放这里只是为了避免 toml_parse 转该类型时编辑器报错
   */
  onCreateItem_callback?: string | ((el: HTMLElement, ctx: PluginInterfaceCtx) => void)
}

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
    li.textContent = item.label
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

  // (可选) hash 颜色
  // const hashColor = textToHashColor(item.label)
  // li.style.background = hashColor.background
  // li.style.color = hashColor.color

  // #endregion

  // 项功能
  if (item.callback != undefined) {
    li.addEventListener('mousedown', (event) => {
      event.preventDefault() // 防止左/右键导致编辑光标失焦/改变
    })
    // b1. obsidian 专用命令
    if (item.detail == "command_ob") {
      li.addEventListener('click', async () => {
        global_setting.other.obsidian_run_command?.(item.callback as string); p_this.panel_hide();
      })
    }
    // b2. 输出 item.callback 文本到当前光标位置
    else if (typeof item.callback === 'string') {
      li.addEventListener('click', async () => {
        await global_setting.api.sendText(item.callback as string); p_this.panel_hide();
      })
    }
    // b3. 自定义命令
    else {
      const callback = item.callback
      li.addEventListener('click', async () => {
        const ctx = PluginManager.getPluginContext(item.label)
        void callback(ctx)
      })
      if (item.onCreateItem_callback && typeof item.onCreateItem_callback !== 'string') {
        const ctx = PluginManager.getPluginContext(item.label)
        item.onCreateItem_callback(li, ctx)
      }
    }
  }

  // 项说明
  if (item.detail) {
    let tooltip: HTMLElement|undefined = undefined
    li.onmouseenter = () => {
      if (item.detail == "command_ob") return // 命令flag, 不显示

      // 先清空 li 中可能存在的 tooltip，避免重复创建和内存泄露
      const existingTooltip = li.querySelector('.ab-contextmenu-tooltip')
      if (existingTooltip) {
        li.removeChild(existingTooltip)
      }

      tooltip = document.createElement('div'); li.appendChild(tooltip);
      tooltip.classList.add('ab-contextmenu-tooltip')
      // 旧版写法，position: fixed。现在改为了absolute 定位
      // const domRect = li.getBoundingClientRect()
      // tooltip.setAttribute('style', `
      //   top: ${domRect.top + 1}px;
      //   left: ${domRect.right + 1}px;
      // `)

      if (item.detail == "md") { // 一个flag, 表示渲染显示
        if (typeof item.callback == "string") {
          void global_setting.other.renderMarkdown?.(item.callback, tooltip)
        }
      } else {
        const img = document.createElement('img'); tooltip.appendChild(img);
          img.setAttribute('src', item.detail as string);
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
