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
  Plugin,
} from 'obsidian'
import { global_setting } from '@/Core/setting'
import { registerABContextMenu, registerAMContextMenu } from './contextmenu'
import { type AMSettingInterface, AMSettingTab, AM_SETTINGS_DEFAULT } from "./SettingTab"
import { initApi } from './initApi'

// [!code hl]
global_setting.config.pinyin_index = false
global_setting.config.pinyin_first_index = false

export default class AnyMenuPlugin extends Plugin {
  settings: AMSettingInterface

  async onload() {
    if (global_setting.isDebug) console.log('>>> Loading plugin AnyMenu')

    initApi(this)

    await this.loadSettings()
    this.addSettingTab(new AMSettingTab(this.app, this))

    // 菜单面板 - 元素
    registerABContextMenu(this) // 初始化菜单 - 默认菜单系统
    registerAMContextMenu(this) // 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)

    // 通过后处理器获取ctx对象
    this.registerMarkdownPostProcessor((
      el: HTMLElement, 
      ctx: MarkdownPostProcessorContext
    ) => {
      global_setting.other.obsidian_ctx = ctx
    })
  }

  async loadSettings() {
    const data = await this.loadData() // 如果没有配置文件则为null
    this.settings = Object.assign({}, AM_SETTINGS_DEFAULT, data); // 合并默认值和配置文件的值

    // 需要保持一致性，obsidian 专属设置与通用的 global 设置 // [!code hl]
    global_setting.isDebug = this.settings.isDebug
    global_setting.config = this.settings.config

    // 如果没有配置文件则生成一个默认值的配置文件
    if (!data) {
      this.saveData(this.settings)
    }
  }
  async saveSettings() {
    // 需要保持一致性，obsidian 专属设置与通用的 global 设置 // [!code hl]
    global_setting.isDebug = this.settings.isDebug
    global_setting.config = this.settings.config

    await this.saveData(this.settings)
  }

  onunload() {
    document.body.querySelectorAll('body>.am-context-menu').forEach(el => el.remove())
    document.body.querySelectorAll('body>.am-search').forEach(el => el.remove())
    document.body.querySelectorAll('body>.am-mini-editor').forEach(el => el.remove())
    if (global_setting.isDebug) console.log('<<< Unloading plugin AnyMenu')
  }
}
