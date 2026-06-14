/**
 * 如果你是脚本开发者，那么你需要要阅读这个文件即可
 */

import { AMPanel, global_el } from "../panel";
import { global_setting } from "../setting";
import type { PluginAppCtx, PluginRunCtx, UrlRequestConfig } from "../../Type";

export const AppCtxDemo: PluginAppCtx = {
  env: {
    platform: global_setting.platform,
    obsidian: global_setting.platform === 'obsidian-plugin' ? {
      plugin: global_setting.other.obsidian_plugin,
      ctx: global_setting.other.obsidian_ctx
    } : undefined,
  },
  api: {
    sendText: (str: string) => { global_setting.api.sendText(str); AMPanel.panel_hide(); },
    saveToClipboard: (str: string) => { global_setting.api.saveToClipboard(str); },
    notify: (message: string) => global_setting.api.notify(message),

    urlRequest: (conf: UrlRequestConfig) => global_setting.api.urlRequest(conf),
    readFile: async (basePath: 'CONFIG'|'PUBLIC', relPath: string) => { // be override
      // relPath 禁止包含 ../ 等路径穿越
      if (relPath.includes('../')) {
        console.warn('拒绝访问包含 ../ 的路径穿越请求:', relPath)
        return null
      }

      let filePath: string
      if (basePath === 'CONFIG') {
        filePath = './dict_config/' + relPath
      } else { // if (basePath === 'PUBLIC')
        filePath = global_setting.config.note_paths + relPath
      }
      return await global_setting.api.readFile(filePath);
    },
    writeFile: async (basePath: 'CONFIG'|'PUBLIC', relPath: string, content: string, is_append?: boolean | undefined) => { // be override
      // relPath 禁止包含 ../ 等路径穿越
      if (relPath.includes('../')) {
        console.warn('拒绝访问包含 ../ 的路径穿越请求:', relPath)
        return false
      }

      let filePath: string
      if (basePath === 'CONFIG') {
        filePath = './dict_config/' + relPath
      } else { // if (basePath === 'PUBLIC')
        filePath = global_setting.config.note_paths + relPath
      }
      return await global_setting.api.writeFile(filePath, content, is_append);
    },

    // #region 面板相关
    hidePanel: (list?: string[]) => {
      AMPanel.panel_hide(list)
      if (list == undefined && global_setting.platform === 'app') {
        global_setting.other.app_hide(list)
      }
    },
    showPanel: (list?: string[], position?: 'center'|'cursor') => {
      if (global_setting.platform === 'app') {
        global_setting.other.app_show(position, list)
      } else {
        if (position != undefined) { console.warn('非 app 环境不支持 position 参数') }
        AMPanel.panel_show(undefined, list)
      }
    },
    togglePanel: (item: string) => {
      AMPanel.panel_toggle(item)
    },
    registerSubPanel: (options: { id: string, el: HTMLElement|((el: HTMLElement) => void) }) => {
      global_el.amPanel?.register_sub_panel(options.id, options.el);
    },
    unregisterSubPanel: (id: string) => {
      global_el.amPanel?.unregister_sub_panel(id);
    }
    // #endregion
  }
}

/// 默认的 ctx 模板
/// 除了 env 的具体内容外，其他借口一般不用变动 (除非要做插件的环境分离/标注)。
/// env 内容则基本上每次传入前都要更新一遍
export const PluginRunCtxDemo: PluginRunCtx = {
  env: {
    selectedText: undefined,
    activeAppName: undefined,
    activeDocTitle: undefined,
    activeDocUrl: undefined,
  },
}

export const PluginInterfaceDemo: string = `\
export default {
  metadata: {
    id: 'text-processor',
    name: 'TextProcessor',
    version: '1.0.0',
    min_app_version: '1.1.0',
    author: 'LincZero',
    description: '一个示例插件，将文本转为大写文本',
  },

  async process(str) {
    if (!str) return 'Empty input';
    return str.toUpperCase();
  },

  async run(ctx) {
    console.log('plugin demo test');
  },

  onLoad() {
    console.log('demo: 插件加载完成');
  },
  
  onUnload() {
    console.log('demo: 插件卸载');
  }
};
`
