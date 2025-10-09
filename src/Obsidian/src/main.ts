/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 */

import {
  MarkdownRenderChild, MarkdownRenderer, loadMermaid, Plugin, MarkdownView,
  setIcon,
  type MarkdownPostProcessorContext
} from 'obsidian'
import { getCursorInfo, registerABContextMenu, registerAMContextMenu } from './contextmenu'
import { AMSettingTab } from "./SettingTab"
import { global_setting } from '@/Core/setting'

// #region api 适配 (Ob/App/Other 环境)

import { RequestUrlParam, requestUrl } from 'obsidian'
global_setting.env = 'obsidian-plugin'

global_setting.other.renderMarkdown = async (markdown: string, el: HTMLElement, ctx?: MarkdownPostProcessorContext): Promise<void> => {
  const app = global_setting.other.obsidian_plugin.app
  if (!app) { console.error('obsidian app对象未初始化'); return }

  el.classList.add("markdown-rendered")  

  const mdrc: MarkdownRenderChild = new MarkdownRenderChild(el); 
  MarkdownRenderer.render(app, markdown, el, app.workspace.getActiveViewOfType(MarkdownView)?.file?.path??"", mdrc)
}

global_setting.api.sendText = async (text: string) => {
  const plugin = global_setting.other.obsidian_plugin
  if (!plugin) return
  const cursorInfo = getCursorInfo(global_setting.other.obsidian_plugin)
  if (!cursorInfo) return

  cursorInfo.editor.replaceSelection(text)
}





import { API } from './api'

// global_setting.api.urlRequest = async (url: string, options?: { method?: 'GET'|'POST', headers?: Record<string, string>, body?: any }): Promise<any> => {
//   const response = await requestUrl({ url, method: options?.method, headers: options?.headers, body: options?.body })
//   return response
// }

// 临时api测试
/*const api = new API()

plugin.addCommand({
  id: 'any-menu-api-test',
  name: 'AnyMenu api 目录测试',
  callback: async () => {
    const ret = await api.giteeGetDirectory()
    console.log('giteeGetDirectory', ret)
  }
})

plugin.addCommand({
  id: 'any-menu-api-test2',
  name: 'AnyMenu api 文件测试',
  callback: async () => {
    const ret = await api.giteeGetDict()
    console.log('giteeGetDict', ret)
  }
})*/

// #endregion

export default class AnyMenuPlugin extends Plugin {
  // settings: ABSettingInterface

  async onload() {
    console.log('>>> Loading plugin AnyMenu')
    global_setting.other.obsidian_plugin = this

    await this.loadSettings()
    this.addSettingTab(new AMSettingTab(this.app, this))

    // 菜单面板
    registerABContextMenu(this) // 初始化菜单 - 默认菜单系统
    registerAMContextMenu(this) // 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
  }

  async loadSettings() {
    // const data = await this.loadData() // 如果没有配置文件则为null
		// this.settings = Object.assign({}, AB_SETTINGS, data); // 合并默认值和配置文件的值

    // // 如果没有配置文件则生成一个默认值的配置文件
    // if (!data) {
    //   this.saveData(this.settings)
    // }
	}
	async saveSettings() {
		// await this.saveData(this.settings)
	}

  onunload() {
    console.log('<<< Unloading plugin AnyMenu')
  }
}
