import {
  MarkdownRenderChild, MarkdownRenderer, MarkdownView,
  type MarkdownPostProcessorContext,
  type App
} from 'obsidian'

import { getCursorInfo } from './contextmenu'
import { global_setting, UrlRequestConfig, UrlResponse } from '@/Core/setting'

export function initApi() {} // 仅用于防树摇

global_setting.env = 'obsidian-plugin'

global_setting.other.renderMarkdown = async (markdown: string, el: HTMLElement, ctx?: MarkdownPostProcessorContext): Promise<void> => {
  const app = global_setting.other.obsidian_plugin.app
  if (!app) { console.error('obsidian app对象未初始化'); return }

  el.classList.add("markdown-rendered")

  const mdrc: MarkdownRenderChild = new MarkdownRenderChild(el);
  if (ctx) ctx.addChild(mdrc);
  else if (global_setting.other.obsidian_ctx) {
    ;(global_setting.other.obsidian_ctx as MarkdownPostProcessorContext).addChild(mdrc);
  }
  MarkdownRenderer.render(app, markdown, el, app.workspace.getActiveViewOfType(MarkdownView)?.file?.path??"", mdrc)
}

global_setting.other.run_command_ob = async (commandId: string): Promise<void> => {
  if (!global_setting.other.obsidian_plugin) return
  // 用户如果不知道id，可以在控制台使用 app.commands.commands 查询
  // 另一个方式是一些插件会提供相关的命令，如 Meta Bind 插件提供 Select and copy command id 功能 (TODO 此插件也应该要提供)  
  const app = (global_setting.other.obsidian_plugin.app as App)
  // // @ts-expect-error 类型“App”上不存在属性“commands”
  // const available = app.commands.commands[item.callback] // 可选，验证是否存在命令
  // @ts-expect-error 类型“App”上不存在属性“commands”
  app.commands.executeCommandById(commandId)
}

global_setting.api.sendText = async (text: string) => {
  const plugin = global_setting.other.obsidian_plugin
  if (!plugin) return
  const cursorInfo = getCursorInfo(global_setting.other.obsidian_plugin)
  if (!cursorInfo) return

  cursorInfo.editor.replaceSelection(text)
}

import { RequestUrlParam, requestUrl } from 'obsidian'

// 后端为 obsidian 时使用
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

global_setting.api.getCursorXY = async (): Promise<{ x: number, y: number }> => {
  console.warn("obsidian 版需要 plugin 和 editor 上下文，应使用 getCursorInfo() 代替")
  return { x: -1, y: -1 }
}
