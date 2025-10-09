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
import { global_setting, UrlRequestConfig, UrlResponse } from '@/Core/setting'

// #region api 适配 (Ob/App/Other 环境)

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

import { RequestUrlParam, requestUrl } from 'obsidian'

global_setting.api.urlRequest = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
  try {
    // 参数适配
    const requestParams: RequestUrlParam = {
      url: conf.url,
      method: conf.method || 'GET',
      headers: conf.headers,
      body: conf.body as string | ArrayBuffer, // Obsidian `requestUrl` 需要更具体的类型
    }

    const response = await requestUrl(requestParams);

    // 返回值适配
    let json = null;
    if (conf.isParseJson) {
      try {
        json = response.json;
      } catch (e) {
        json = null;
      }
    }
    return {
      code: 0,
      data: {
        text: response.text,
        json: json,
        originalResponse: response,
      },
    }
  } catch (error: any) {
    console.error('Obsidian request failed:', error, conf);
    return {
      code: -1,
      msg: error?.message || 'An unknown error occurred in Obsidian request.',
      data: {
        text: '',
        originalResponse: error
      }
    };
  }
}

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
