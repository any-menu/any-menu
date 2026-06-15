import {
  MarkdownView, Plugin, Menu,
  type MenuItem, type Editor,
  type MarkdownFileInfo,
  TFile,
} from 'obsidian'

import { PanelItem } from '@/Type'
import { AMContextMenu } from "@/Core/panel/contextmenu"
import { root_menu } from "@/Core/panel/contextmenu/demo"
import { global_setting } from '@/Core/setting'
import { PluginRunCtxDemo } from '@/Core/pluginManager/PluginInterface'
import { PLUGIN_MANAGER, PluginManager } from '@/Core/pluginManager/PluginManager'

/**
 * 用于obsidian原菜单上的追加。
 * 若非需要在原菜单基础上追加，则使用父类ABContextMenu即可
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
export class ABContextMenu_Ob extends AMContextMenu {
  constructor(
    public plugin: Plugin,
    public target: string, // 'editor' | 'file' | 'file-menu' | 'editor-menu' | 'status-bar' | 'body' | HTMLElement ...
    menuItems?: PanelItem[],
  ) {
    super(undefined, menuItems)
  }

  // override bind_emitArea(targetElement: HTMLElement | string): void {
  //   // 预创建菜单版本
  //   if (this.el_container) return super.bind_emitArea(targetElement)
  // 
  //   return
  // }

  /// 支持obsidian原生菜单
  /// 为基类方法支持动态创建策略 (原方法只支持静态创建策略)
  /// 并支持 command_ob 类型
  override append_data(menuItems2: PanelItem[]) {
    const menuItems: PanelItem[] = menuItems2
    // 预创建菜单版本
    if (this.el) return super.append_data(menuItems)

    if (this.target === 'editor' || this.target === 'editor-menu') {
      const plugin = this.plugin
      plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, _view: MarkdownView | MarkdownFileInfo) => {
          addMenuItems(menu, menuItems, editor)
        })
      )
    } else {
      console.error("不支持的attach目标字符串", this.target)
    }

    // 递归添加菜单项
    // TODO 此处废弃，等待重构
    function addMenuItems(menu: Menu, menuItems: PanelItem[], editor: Editor) {
      for (const item of menuItems) {
        menu.addItem((menuItem: MenuItem) => {

          // 菜单项标题
          menuItem.setTitle(item.label)
          
          // 菜单项图标
          if (item.icon) menuItem.setIcon(item.icon)

          // 项功能 (修改自 PanelItem.ts init_item)
          if (item.content != undefined) {
            // b1. obsidian 专用命令
            if (item.type === "command_ob") {
              menuItem.onClick(async () => {
                if (!item.content) return
                global_setting.other.obsidian_run_command?.(item.content); //p_this.panel_hide();
              })
            }
            // b2. 输出纯文本
            else if (item.type === 'string' || item.type === "md") {
              menuItem.onClick(async () => {
                if (!item.content) return
                await global_setting.api.sendText(item.content); //p_this.panel_hide();
              })
            }
            // b3. 输出 path 对应的文件
            else if (item.type === 'path') {
              menuItem.onClick(async () => {
                if (!item.content) return
                await global_setting.api.sendText(item.content, 'IMG_MODE'); //p_this.panel_hide();
              })
            }
            // b4. 脚本
            else if (item.type === 'script') {
              const plugin = item.plugin ??
                item.content ? PLUGIN_MANAGER.plugin_list[item.content] : undefined;
              if (plugin) {
                menuItem.onClick(async () => {
                  const ctx = PluginManager.getPluginRunCtx(item.label)
                  void plugin.run(ctx)
                })
                if (plugin.onCreateItem) {
                  const ctx = PluginManager.getPluginRunCtx(item.label)
                  // plugin.onCreateItem(li, ctx)
                }
              }
            }
            // b5. 其他类型 (一般是未定义 / 文件夹)
            else {
              // console.error('未知的项类型:', item.type)
            }
          }

          // 菜单项说明 (修改自 PanelItem.ts init_item)
          // @ts-ignore
          const dom = menu.dom
          if (dom && item.type && ["md", "path"].includes(item.type) && item.content) {
            let tooltip: HTMLElement|undefined = undefined
            menu.registerDomEvent(dom, 'mouseenter', (evt: MouseEvent) => {
              // 清空 tooltip (可能存在，但一般不会存在，仅冗余避免重复创建和内存泄露)
              const existingTooltip = dom.querySelector('.ab-contextmenu-tooltip')
              if (existingTooltip) {
                dom.removeChild(existingTooltip)
              }

              // 创建 tooltip
              tooltip = document.createElement('div'); dom.appendChild(tooltip);
              tooltip.addClass('ab-contextmenu-tooltip')
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
            })
            menu.registerDomEvent(dom, 'mouseleave', (evt: MouseEvent) => {
              if (!tooltip) return
              dom.removeChild(tooltip)
              tooltip = undefined
            })
          }

          // 菜单项的子菜单
          if (item.children && item.children.length > 0) {
            // 官方没这个api，隐含api
            // 且这个api到了第三级菜单开始，就会有bug: 切换悬浮的二级菜单对象时，三级菜单不会更新
            // @ts-ignore
            const submenu = menuItem.setSubmenu()
            addMenuItems(submenu, item.children, editor) // 递归
            // const submenu = new Menu()
            // item.setSubmenu(submenu)
          }
        })
      }
    }
  }
}

/** 注册obsidian右键菜单
 * 
 * 推荐在onload中调用
 */
export function registerABContextMenu(plugin: Plugin) {
  const abContextMenu = new ABContextMenu_Ob(plugin, 'editor-menu') // 会 plugin.app.workspace.on('editor-menu', ...)
  abContextMenu.append_data(root_menu)
}

/** 注册obsidian右键菜单 (仅Demo，现无用)
 * 
 * by gpt
 * 
 * 推荐在onload中调用
 */
function registerABContextMenuDemo(plugin: Plugin) {
  // 右键菜单 - 文件浏览器
  plugin.registerEvent(
    plugin.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
      // 只在右键点击 .md 文件时添加菜单项
      if (file instanceof TFile && file.extension === 'md') {
        menu.addItem((item: MenuItem) => {
          item
            .setTitle("我的文件菜单操作")
            .setIcon("document") // 使用内置图标
            .onClick(async () => {
              new Notification(`你点击了文件: ${file.path}`)
              // console.log(`文件路径: ${file.path}`)
            });
        });
      }
    })
  )

  // 右键菜单 - 编辑器
  plugin.registerEvent(
    plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
      menu.addItem((item: MenuItem) => {
        item
          .setTitle("我的编辑器菜单操作")
          .setIcon("pencil") // 使用内置图标
          .onClick(() => {
            // 在光标位置插入文本
            editor.replaceSelection('你好，Obsidian！')
          });
      });
    })
  )

  // 右键菜单 - 右下角状态栏 (自定义div)
  const myCustomDiv = plugin.addStatusBarItem().createEl('div', { // 创建一个我们自己的 div 元素，并添加到状态栏
    text: '右键点我!',
    cls: 'my-custom-div' // 添加一个class方便样式化
  })
  plugin.registerDomEvent(myCustomDiv, 'contextmenu', (event: MouseEvent) => {
    // 1. 阻止默认的浏览器右键菜单
    event.preventDefault()

    // 2. 创建一个新的、独立的 Menu 实例
    const menu = new Menu()

    // 3. 向菜单中添加自定义项目
    menu.addItem((item: MenuItem) =>
      item
        .setTitle("操作 A")
        .setIcon("info")
        .onClick(() => {
          new Notification("你点击了操作 A")
        })
    );

    menu.addItem((item: MenuItem) =>
      item
        .setTitle("操作 B")
        .setIcon("checkmark")
        .onClick(() => {
          new Notification("你点击了操作 B")
        })
    );

    // 添加一个分割线
    menu.addSeparator()

    menu.addItem((item: MenuItem) =>
      item
        .setTitle("危险操作")
        .setIcon("trash")
        .setSection('danger') // 可以把项目分组到 'danger' 区，通常会用红色显示
        .onClick(() => {
          new Notification("这是一个危险操作！")
        })
    );

    // 4. 在鼠标点击的位置显示菜单
    menu.showAtMouseEvent(event)
  })
}
