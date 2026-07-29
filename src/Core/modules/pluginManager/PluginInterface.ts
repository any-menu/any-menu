/**
 * 如果你是脚本开发者，那么你需要要阅读 ../../Type 中的类型即可
 */

import { global_setting } from "../../shared/setting";
import { activeAMPanel } from "../../panels/MulPanel";
import type { PluginAppCtx, PluginRunCtx, UrlRequestConfig } from "../../../Type";

export const AppCtxDemo: PluginAppCtx = {
  env: {
    platform: global_setting.platform,
    obsidian: global_setting.platform === 'obsidian-plugin' ? {
      plugin: global_setting.other.obsidian_plugin,
      ctx: global_setting.other.obsidian_ctx
    } : undefined,
    pluginName: '<will be override>', // will be override, 会变为插件名
    pluginId: '<will be override>',   // will be override, 会变为插件id
  },
  api: {
    sendText: (str: string) => { global_setting.api.sendText(str); activeAMPanel?.panel_hide(); },
    saveToClipboard: (str: string) => { global_setting.api.saveToClipboard(str); },

    // will be override, 强制使其输出时显示插件名
    notify: () => {
      console.error('will be override')
      return ''
    },

    urlRequest: (conf: UrlRequestConfig) => global_setting.api.urlRequest(conf),
    async readFile() {
      console.error('will be override')
      return ''
    },
    async writeFile() {
      console.error('will be override')
      return false
    },

    // #region 面板相关
    hidePanel: (list?: string[]) => {
      activeAMPanel?.panel_hide(list)
      if (list == undefined && global_setting.platform === 'app') {
        global_setting.other.app_hide(list)
      }
    },
    showPanel: (list?: string[], position?: 'center'|'cursor') => {
      if (global_setting.platform === 'app') {
        global_setting.other.app_show(position, list)
      } else {
        if (position != undefined) { console.warn('非 app 环境不支持 position 参数') }
        activeAMPanel?.panel_show(undefined, list, true, false)
      }
    },
    togglePanel: (item: string) => {
      activeAMPanel?.panel_toggle(item)
    },
    registerSubPanel: (options: { id: string, el: HTMLElement|((el: HTMLElement) => void) }) => {
      activeAMPanel?.register_sub_panel(options.id, options.el);
    },
    unregisterSubPanel: (id: string) => {
      activeAMPanel?.unregister_sub_panel(id);
    }
    // #endregion
  }
}
export function appCtxDemo_createFunctions(id: string, name: string) {
  return {
    // 强制消息显示插件名，确定来源
    notify: async (message: string) => {
      await global_setting.api.notify(name + ': ' + message)
    },
    // 默认路径使用插件id生成
    async readFile(path?: {
      relPath: string,
      basePath?: 'CACHE' | 'NOTE' | 'DICT'
    }) {
      let targetPath = ''
      const fail_return = null // 方便 readFile 和 writeFile 复用
      {
        // 路径参数1 - 默认值
        if (!path) {
          path = {
            relPath: id,
            basePath: 'CACHE',
          }
        }

        // 路径参数2 - 路径安全检查
        if (path.relPath.includes('../') || path.relPath.includes('..\\')) {
          console.warn('拒绝访问包含 ../ 的路径穿越请求:', path.relPath)
          return fail_return
        }

        // 路径参数3 - 非法路径检查 (前7个是除 `/\` 外的文件名非法路径，后面的是控制字符)
        if (/[:*?"<>|\x00-\x1f\x7f]/.test(path.relPath)) {
          console.warn('插件id包含非法字符:', path.relPath)
          return fail_return
        }

        // 路径参数4 - 基础路径 & 拼接
        switch(path.basePath) {
          case "DICT":
            targetPath = global_setting.config.dict_paths + path.relPath
            break
          case "NOTE":
            targetPath = global_setting.config.note_paths + path.relPath
            break
          default: // 包括默认值 "CACHE"
            targetPath = global_setting.config.cache_paths + path.relPath
            break
        }
      }

      return await global_setting.api.readFile(targetPath);
    },
    // 默认路径使用插件id生成
    async writeFile (
      content: string,
      path?: {
        relPath: string,
        basePath?: 'CACHE' | 'NOTE' | 'DICT'
      },
      is_append?: boolean | undefined,
    ) {
      let targetPath = ''
      const fail_return = false // 方便 readFile 和 writeFile 复用
      {
        // 路径参数1 - 默认值
        if (!path) {
          path = {
            relPath: id,
            basePath: 'CACHE',
          }
        }

        // 路径参数2 - 路径安全检查
        if (path.relPath.includes('../') || path.relPath.includes('..\\')) {
          console.warn('拒绝访问包含 ../ 的路径穿越请求:', path.relPath)
          return fail_return
        }

        // 路径参数3 - 非法路径检查 (前7个是除 `/\` 外的文件名非法路径，后面的是控制字符)
        if (/[:*?"<>|\x00-\x1f\x7f]/.test(path.relPath)) {
          console.warn('插件id包含非法字符:', path.relPath)
          return fail_return
        }

        // 路径参数4 - 基础路径 & 拼接
        switch(path.basePath) {
          case "DICT":
            targetPath = global_setting.config.dict_paths + path.relPath
            break
          case "NOTE":
            targetPath = global_setting.config.note_paths + path.relPath
            break
          default: // 包括默认值 "CACHE"
            targetPath = global_setting.config.cache_paths + path.relPath
            break
        }
      }

      return await global_setting.api.writeFile(targetPath, content, is_append);
    },
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
