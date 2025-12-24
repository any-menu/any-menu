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
  type MarkdownPostProcessorContext,
  type App
} from 'obsidian'
import { getCursorInfo, registerABContextMenu, registerAMContextMenu } from './contextmenu'
import { type AMSettingInterface, AMSettingTab, AM_SETTINGS_DEFAULT } from "./SettingTab"
import { global_setting, UrlRequestConfig, UrlResponse } from '@/Core/setting'

// #region api 适配 (Ob/App/Other 环境)

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

// #endregion

export default class AnyMenuPlugin extends Plugin {
  settings: AMSettingInterface

  async onload() {
    if (global_setting.isDebug) console.log('>>> Loading plugin AnyMenu')

    // #region api 适配2 (Ob/App/Other 环境)
    // 这部分是需要有 plugin 对象才能进行的初始化

    global_setting.other.obsidian_plugin = this

    // 快速调试: 
    // app.vault.adapter.exists("Template").then((a) => {console.log("---exists", a)})
    // app.vault.adapter.list("Template").then(a => console.log("---list", a)) // 输出 {files:[], folders:[]} 相对库根的路径
    // !注意: 使用相对路径时，在控制台是相对于库根路径的，而在插件内是相对于插件目录的
    global_setting.api.readFolder = async (relPath: string): Promise<string[]> => {
      const plugin: any|null = global_setting.other.obsidian_plugin
      const app = global_setting.other.obsidian_plugin?.app as App|null
      if (!plugin || !app) { console.error('Obsidian global plugin obj not initialized'); return [] }

      // 这里的文件路径有两种策略
      // - 一是存在库根部 ('/'开头)，直接写就行了
      // - 二是存在插件目录下 (相对路径)，得加一个 '.obsidian/plugins/<插件名>/' 的前缀
      const isBasePluginPath = false // TODO 选项
      const pluginBaseDir = plugin.manifest.dir + '/'
      const targetPath = (isBasePluginPath) ? `${pluginBaseDir}/${relPath}` : `${relPath}`

      try {
        if (!await app.vault.adapter.exists(targetPath)) {
          console.warn('no exists:', targetPath, ', isBasePluginPath:', isBasePluginPath);
          // await app.vault.adapter.mkdir(targetPath);
          return []
        }

        const listedFiles = await app.vault.adapter.list(targetPath);
        const fileNames = listedFiles.files
          // .map((fullPath: string) => fullPath.split('/').pop())
          .filter((fileName): fileName is string => !!fileName); // 类型判断器以确保所有元素均为字符串类型
        const folderNames = listedFiles.folders
          .map((fullPath: string) => fullPath += '/')
          .filter((folderName): folderName is string => !!folderName);
        return [...fileNames, ...folderNames];
      } catch (error) {
        console.error(`Failed to read folder at path: ${targetPath}`, error);
        return [];
      }
    }

    global_setting.api.readFile = async (relPath: string): Promise<string | null> => {
      const plugin: any|null = global_setting.other.obsidian_plugin
      const app = global_setting.other.obsidian_plugin?.app as App|null
      if (!plugin || !app) { console.error('Obsidian global plugin obj not initialized2'); return null }

      // 这里的文件路径有两种策略
      // - 一是存在库根部 ('/'开头)，直接写就行了
      // - 二是存在插件目录下 (相对路径)，得加一个 '.obsidian/plugins/<插件名>/' 的前缀
      const isBasePluginPath = false // TODO 选项
      const pluginBaseDir = plugin.manifest.dir + '/'
      const targetPath = (isBasePluginPath) ? `${pluginBaseDir}/${relPath}` : `${relPath}`

      try {
        if (!await app.vault.adapter.exists(targetPath)) {
          console.warn('no exists:', targetPath, ', isBasePluginPath:', isBasePluginPath);
          return null
        }

        const file_content: string = await app.vault.adapter.read(relPath);
        return file_content;
      } catch (error) {
        console.error(`Failed to check file existence at path: ${targetPath}`, error);
        return null
      }
    }

    global_setting.api.writeFile = async (relPath: string, content: string): Promise<boolean> => {
      const plugin: any | null = global_setting.other.obsidian_plugin
      const app = global_setting.other.obsidian_plugin?.app as App | null
      if (!plugin || !app) { console.error('Obsidian global plugin obj not initialized for writeFile'); return false }

      // 这里的文件路径有两种策略
      // - 一是存在库根部 ('/'开头)，直接写就行了
      // - 二是存在插件目录下 (相对路径)，得加一个 '.obsidian/plugins/<插件名>/' 的前缀
      const isBasePluginPath = false // TODO 选项
      const pluginBaseDir = plugin.manifest.dir + '/'
      const targetPath = (isBasePluginPath) ? `${pluginBaseDir}/${relPath}` : `${relPath}`

      try {
        // 提取目录路径
        // 如果路径中包含'/'，则最后一个'/'之前的部分是目录
        // 如果路径不包含'/'，则表示文件在根目录，没有需要创建的子目录
        const dirPath = targetPath.includes('/') ? targetPath.substring(0, targetPath.lastIndexOf('/')) : null;

        // 如果存在目录路径，并且该目录尚不存在，则创建它
        if (dirPath && !(await app.vault.adapter.exists(dirPath))) {
          await app.vault.adapter.mkdir(dirPath);
        }

        // 写入文件
        await app.vault.adapter.write(targetPath, content);
        return true;
      } catch (error) {
        console.error(`Failed to write file at path: ${targetPath}`, error);
        return false;
      }
    }

    global_setting.api.deleteFile = async (relPath: string): Promise<boolean> => {
      const plugin: any | null = global_setting.other.obsidian_plugin
      const app = global_setting.other.obsidian_plugin?.app as App | null
      if (!plugin || !app) { console.error('Obsidian global plugin obj not initialized for deleteFile'); return false }

      // 这里的文件路径有两种策略
      // - 一是存在库根部 ('/'开头)，直接写就行了
      // - 二是存在插件目录下 (相对路径)，得加一个 '.obsidian/plugins/<插件名>/' 的前缀
      const isBasePluginPath = false // TODO 选项
      const pluginBaseDir = plugin.manifest.dir + '/'
      const targetPath = (isBasePluginPath) ? `${pluginBaseDir}/${relPath}` : `${relPath}`

      try {
        if (await app.vault.adapter.exists(targetPath)) {
          await app.vault.adapter.remove(targetPath);
          return true;
        } else {
          console.warn('File to delete does not exist:', targetPath);
          return false; // false or true，取决于认为是因为路径填错了还是因为用户手动删除了
        }
      } catch (error) {
        console.error(`Failed to delete file at path: ${targetPath}`, error);
        return false;
      }
    }

    // #endregion

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

    // 如果没有配置文件则生成一个默认值的配置文件
    if (!data) {
      this.saveData(this.settings)
    }
  }
  async saveSettings() {
    // 一致性
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
