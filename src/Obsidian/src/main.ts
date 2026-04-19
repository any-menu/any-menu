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
import { global_setting } from '@/Core/setting'
import { registerABContextMenu, registerAMContextMenu, registerSelectionToolbar } from './panel'
import { AMSettingTab } from "./SettingTab"
import { initApi } from './initApi'

export default class AnyMenuPlugin extends Plugin {
  // settings: AMSettingInterface

  async onload() {
    if (global_setting.isDebug) console.log('>>> Loading plugin AnyMenu')

    initApi(this)

    await global_setting.api.loadConfig()
    this.addSettingTab(new AMSettingTab(this.app, this))

    // 菜单面板 - 元素
    registerABContextMenu(this) // 初始化菜单 - 默认菜单系统
    registerAMContextMenu(this) // 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
    registerSelectionToolbar(this) // 选中文本时自动显示工具栏

    // 通过后处理器获取ctx对象
    this.registerMarkdownPostProcessor((
      _el: HTMLElement, 
      ctx: MarkdownPostProcessorContext
    ) => {
      global_setting.other.obsidian_ctx = ctx
    })
  }

  onunload() {
    document.body.querySelectorAll('body>.am-context-menu').forEach(el => el.remove())
    document.body.querySelectorAll('body>.am-search').forEach(el => el.remove())
    document.body.querySelectorAll('body>.am-mini-editor').forEach(el => el.remove())
    if (global_setting.isDebug) console.log('<<< Unloading plugin AnyMenu')
  }
}
