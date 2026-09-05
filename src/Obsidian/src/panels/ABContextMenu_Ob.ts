import {
  MarkdownView, Plugin, Menu,
  type MenuItem, type Editor,
  type MarkdownFileInfo,
} from 'obsidian'

import { PanelItem } from '@/Type'
// import { AMContextMenu } from "@/Core/panels/contextmenu"
import { global_setting } from '@/Core/shared/setting'
import { init_item } from '@/Core/panels/shared/PanelItem'
import { PLUGIN_MANAGER, PluginManager } from '@/Core/modules/pluginManager/PluginManager'
import { activeAMPanel, all_append_data, AMContextMenu } from '@/Core/panels/MulPanel'

/**
 * 用于obsidian原菜单上的追加。
 * 若非需要在原菜单基础上追加，则使用父类即可
 * 
 * 与父类不同:
 * 
 * - 父类
 *   - 静态创建菜单 (可以多个元素共用一个菜单)
 *     append_xxx 时添加div到菜单元素
 *   - 生命与监听:
 *     生命挂钩于元素、attach到元素
 *     监听由 attach() 负责
 *   - 使用逻辑: new ABContextMenu(...).append_data(...).append_xxx(el)
 * - Ob类
 *   - 动态创建菜单
 *     append_xxx 时监听菜单事件并于事件发生时动态添加div到菜单元素
 *   - 生命与监听
 *     不用管理生命挂钩、attach挂钩的元素
 *     监听由 append_xxx() 负责
 *   - 使用逻辑: registerABContextMenu(plugin) -> new ABContextMenu_Ob(...).append_xxx(...)
 */
export class AMContextMenu_Ob { // extends AMContextMenu {
  constructor(
    public plugin: Plugin,
  ) {
  }

  /** 递归添加菜单项
   * 较小改动，更多复用版
   * 
   * 快速调试笔记: obsidian 控制台输入以下内容:
   * ```js
   * app.workspace.on('editor-menu', (menu, editor, view) => {
   *     console.log('4453 editor-menu', menu);
   *     menu.addItem((menuItem) => {
   *         console.log('4454 menuItem', menuItem)
   *     })
   * })
   * ```
   */
  addMenuItems(menu: Menu, menuItems: PanelItem[]) {
    for (const item of menuItems) {
      menu.addItem((menuItem: MenuItem) => {
        // @ts-expect-error
        const li = menuItem.dom as HTMLElement // 重要适配
        if (!li) return
        void init_item(undefined, li, item, 'label')

        // 菜单项的子菜单
        if (item.children && item.children.length > 0) {
          this.addMenuItem3(li, item.children)
        }
      })
    }
  }

  /** 递归添加菜单项
   * obsidian 强化适配版本
   */
  addMenuItems2(menu: Menu, menuItems: PanelItem[]) {
    for (const item of menuItems) {
      menu.addItem((menuItem: MenuItem) => {
        void init_item2(menu, menuItem, item)

        // 菜单项的子菜单
        if (item.children && item.children.length > 0) {
          // (二选一) 官方隐含api (非明面)
          // 但这个官方的 setSubmenu 方法有 bug:
          // 到了第三级菜单开始，就会有bug: 切换悬浮的二级菜单对象时，三级菜单不会更新
          // 估计官方也没考虑到三级以上菜单的事
          // 将弃用
          // // @ts-expect-error
          // const subMenu = menuItem.setSubmenu() as Menu
          // p_this.addMenuItems2(subMenu, item.children) // 递归

          // (二选一) 通用 div 实现
          // @ts-expect-error
          const li = menuItem.dom as HTMLElement
          if (!li) return
          this.addMenuItem3(li, item.children)
        }
      })
    }
  }

  /** 递归添加菜单项
   * 
   * 从 obsidian 的默认菜单元素项适配到 `AMContextMenu.li_list`
   * 
   * 然后 `AMContextMenu.li_list` 不从默认菜单开始，而是从普通 div 开始的通用版本
   * 
   * 主要是 obsidian 默认的菜单 api 太垃了
   */
  addMenuItem3(
    li: HTMLElement,
    menuItems: PanelItem[],
  ) {
    li.classList.add('am-context-menu-item')

    li.classList.add('has-children')
    const li_ul = activeDocument.createElement('div'); li.appendChild(li_ul); li_ul.classList.add('am-context-menu', 'sub-menu');
    AMContextMenu.li_list(li_ul, menuItems, {
      el: li_ul,
      parent: null,
      children: [],
      vFocus_index: -1,
    }, false)
    li.addEventListener('mouseenter', () => {
      li_ul.classList.add('visible')
    })
    li.addEventListener('mouseleave', () => {
      li_ul.classList.remove('visible')
    })
  }
}

/** 注册obsidian右键菜单
 * 
 * 推荐在onload中调用
 */
export function registerPanel_to_obsidianMenu(plugin: Plugin) {
  const target = 'editor-menu' // 'editor' | 'file' | 'file-menu' | 'editor-menu' | 'status-bar' | 'body' | HTMLElement ...
  const abContextMenu = new AMContextMenu_Ob(plugin)

  plugin.registerEvent(
    plugin.app.workspace.on(target, (menu: Menu, editor: Editor, _view: MarkdownView | MarkdownFileInfo) => {
      // selected
      const selectedText = editor.getSelection()
      global_setting.state.selectedText = selectedText.length > 0 ? selectedText : undefined

      const append_mode = global_setting.config.auto_append_to_contextmenu as string

      if (append_mode === 'bottom' || append_mode === 'both') {
        abContextMenu.addMenuItems2(menu, all_append_data as PanelItem[])
      }      

      if (append_mode === 'right' || append_mode === 'both') {
        window.requestAnimationFrame(() => { // 延时，否则 rect 坐标为0
          // @ts-expect-error
          const dom = menu.dom as HTMLElement // 重要适配
          if (!dom) return
          const rect = dom.getBoundingClientRect()
          if (rect.right == 0) return
          activeAMPanel?.panel_hide()
          activeAMPanel?.panel_show(
            { x:rect.right, y:rect.top, is_reverse: false },
            global_setting.config.panel_preset2[0].list,
            false,
          )
        })
      }
    })
  )
}

/** obsidian 特供版 init_item
 * 
 * take from `src\Core\panels\shared\PanelItem.ts` 并修改
 */
export async function init_item2(
  menu: Menu,         // [!code hl]
  menuItem: MenuItem, // [!code hl]
  item: PanelItem,
  mode: 'icon' | 'label' | 'none' = 'label'
) {
  // 重要适配
  // @ts-expect-error
  const dom = menu.dom as HTMLElement // .menu，注意默认有个 `.menu { overflow: hideen }` 的样式
  if (!dom) return
  // @ts-expect-error
  const li = menuItem.dom as HTMLElement // .menu-item.tappable(.selected)
  if (!li) return

  // #region 填充显示内容 (标题/图标) // [!code hl]
  // 不填充
  if (mode === 'none') {}
  // 仅标题
  else if (mode === 'label') {
    menuItem.setTitle(item.label)
  }
  // 仅图标
  else if (mode === 'icon') {
    // 例如 menuItem.setIcon('list-plus')
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

  // #region 项功能
  if (item.content != undefined) { // 排除 "文件夹项"
    li.addEventListener('mousedown', (event) => {
      event.preventDefault() // 防止左/右键导致编辑光标失焦/改变
    })

    // b1. obsidian 专用命令
    if (item.type === "command_ob") {
      menuItem.onClick(() => { // [!code hl]
        if (!item.content) return
        global_setting.other.obsidian_run_command?.(item.content);
      })
    }
    // b2. 输出纯文本
    else if (item.type === 'string' || item.type === "md") {
      menuItem.onClick(async () => { // [!code hl]
        if (!item.content) return
        await global_setting.api.sendText(item.content);
      })
    }
    // b3. 输出 path 对应的文件
    else if (item.type === 'path') {
      menuItem.onClick(async () => { // [!code hl]
        if (!item.content) return
        await global_setting.api.sendText(item.content, 'IMG_MODE');
      })
    }
    // b4. 脚本
    else if (item.type === 'script') {
      const plugin = item.plugin ??
        item.content ? PLUGIN_MANAGER.plugin_list[item.content] : undefined;
      if (plugin) {
        menuItem.onClick(() => { // [!code hl]
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
  // #endregion

  // #region 项说明、项子菜单
  if (item.type && ["md", "path"].includes(item.type) && item.content) {
    let tooltip: HTMLElement|undefined = undefined
    li.addEventListener('mouseenter', () => {
      // 清空 tooltip (可能存在，但一般不会存在，仅冗余避免重复创建和内存泄露)
      const tooltip_old = dom.querySelector('.ab-contextmenu-tooltip')
      tooltip_old?.remove()

      // 创建 tooltip
      tooltip = activeDocument.createElement('div'); li.appendChild(tooltip);
      tooltip.addClass('ab-contextmenu-tooltip')

      if (item.type === "md") { // 一个flag, 表示渲染显示
        if (item.content) {
          void global_setting.other.renderMarkdown?.(item.content, tooltip)
        }
      }
      else if (item.type === "path") { // TODO 这里仅 url 支持，否则会有权限问题
        const img = activeDocument.createElement('img'); tooltip.appendChild(img);
          img.setAttribute('src', item.content ?? "");
          img.classList.add('tooltip-image');
      }
    })

    li.addEventListener('mouseleave', () => {
      tooltip?.remove()
      tooltip = undefined
    })

    /* 旧
    menu.registerDomEvent(dom, 'mouseenter', (_evt: MouseEvent) => {
    })
    menu.registerDomEvent(dom, 'mouseleave', (_evt: MouseEvent) => {
    })*/
  }
  // #endregion
}
