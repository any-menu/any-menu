/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 */

import {
  type MarkdownPostProcessorContext,
  Plugin
} from 'obsidian'
import { global_setting } from '@/Core/shared/setting'
import { AMPanel } from '@/Core/panels/MulPanel'
import { initMenuData } from '@/Core/initTool'
import { registerPanel_to_obsidianMenu } from './panels/ABContextMenu_Ob'
import { registerPanel_to_obsidianCommand } from './modules/editor/showEvent'
import { DocumentListeners } from './modules/editor/event'
import { AMSettingTab } from "./SettingTab"
import { initApi } from './initApi'

export default class AnyMenuPlugin extends Plugin {
  // settings: AMSettingInterface
  documentListeners: DocumentListeners|undefined

  async onload() {
    if (global_setting.isDebug) console.log('>>> Loading plugin AnyMenu')

    initApi(this)

    await global_setting.api.loadConfig()
    this.addSettingTab(new AMSettingTab(this.app, this))

    // 菜单面板 - 元素
    {
      // 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
      {
        // 搜索框和多极菜单 - 元素
        AMPanel.factory(activeDocument.body)
        // 搜索框和多极菜单 - 数据内容
        void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
      }
      // 召唤面板的多种方式：
      registerPanel_to_obsidianMenu(this)     // Obsidian 默认右键菜单系统
      registerPanel_to_obsidianCommand(this)  // Obsidian 命令和彩带按钮等
      this.documentListeners = new DocumentListeners(this)
      this.documentListeners.register()       // Obsdiian 编辑器选中文本事件
    }

    // 通过后处理器获取ctx对象
    this.registerMarkdownPostProcessor((
      _el: HTMLElement, 
      ctx: MarkdownPostProcessorContext
    ) => {
      global_setting.other.obsidian_ctx = ctx
    })
  }

  onunload() {
    this.documentListeners?.unregister()
    activeDocument.body.querySelectorAll('body>.am-panel').forEach(el => el.remove())
    if (global_setting.isDebug) console.log('<<< Unloading plugin AnyMenu')
  }
}
