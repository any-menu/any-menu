/**
 * 如果你是脚本开发者，那么你需要要阅读这个文件即可
 */

import { AMPanel, global_el } from "../panel";
import {
  global_setting,
  type UrlRequestConfig,
  type UrlResponse
} from "../setting";

// 定义插件必须实现的接口
export interface PluginInterface {
  /// 元数据
  metadata: {
    /// 唯一标识符
    id: string;
    /// 脚本版本
    version: string;
    /// 宿主应用版本要求
    min_app_version: string;
    /// 插件名称 (如不提供则默认为 id)
    name?: string;
    /// 插件作者
    author?: string;
    /// 插件描述
    description?: string;
    /** icon
     * - 支持 lucide 图标名用法 (需要联网)，用法: "lucide-图标名"，如 "lucide-table"。图标名可于 https://lucide.dev/ 查询
     *   TODO 可以支持 `.` 写法来添加 class，从而实现带颜色的 lucide 图标这种需求
     * - 支持 SVG string (应用前采取安全措施 dompurify)
     * - 支持 不填，会使用名字来默认构造图标
     */
    icon?: string;
    /** CSS 字符串，插件加载时自动注入到 <head>，卸载时自动移除
     * 若使用 TypeScript 模板仓库开发，build 工具会自动将 .css 文件内容填入此字段
     */
    css?: string;

    // TODO: 加入所需权限声明
  };

  /// 旧接口
  /// @deprecated 没有ctx环境，未来将废弃，请使用 run 接口来代替
  process?: (str?: string) => Promise<void|string>;
  /// 传入ctx，必须实现
  /// 点击或选择触发
  run: (ctx: PluginInterfaceCtx) => Promise<void>;

  /// 加载插件时调用
  /// TODO 目前没什么用，应该给他一个 ctx，这样可以加载时就进行注册面板等操作
  ///   不过目前还是提倡在 run 内判断首次运行时注册，避免软件启用时就做一大堆操作
  onLoad?: () => void;
  /// 卸载插件时调用
  onUnload?: () => void;
}

export interface PluginInterfaceCtx {
  env: {
    /// 当前选中文本
    selectedText?: string;
    /// 当前平台
    platform: typeof global_setting.platform;
    /// 当前激活的应用/窗口名称
    activeAppName?: string;
    /// 当前文档/页面标题 (如浏览器页面标题、Obsidian笔记名等)
    activeDocTitle?: string;
    /// 当前文档/页面链接 (如浏览器页面URL、Obsidian笔记路径等)
    /// 
    /// 当前只支持 Obsidian 环境，App (Tauri) 环境未支持
    /// App 端很难获取，UIA 有可能可以但也很麻烦，不一定能拿到
    activeDocUrl?: string;

    /// 特殊 - 仅 Obsidian 环境拥有
    obsidian?: {
      plugin: any;
      ctx: any;
    }

    // TODO: 更多环境
    // - miniEditorText?: string;
    // - 当前选中类型 (文件/图片/文字等...)
  },
  api: {
    /// 输出文本到当前位置，输出结束后自动隐藏 (低风险)
    sendText: (str: string) => void;
    /// 保存到剪切板 (低风险)
    saveToClipboard: (str: string) => void;
    /// 通知用户 (低风险)
    notify: (message: string) => void;

    /// 网络请求 (中风险，信息泄露风险)
    urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null>;
    /// 读文件 (低 - 高风险) // TODO 开放任意文件路径的权限，注意禁止 relPath 包含 ../ 等路径穿越
    readFile: (basePath: 'CONFIG'|'PUBLIC', relPath: string) => Promise<string | null>;
    /// 写文件 (低 - 高风险) // TODO 开放任意文件路径的权限，注意禁止 relPath 包含 ../ 等路径穿越
    writeFile: (basePath: 'CONFIG'|'PUBLIC', relPath: string, content: string) => Promise<boolean>;

    /// 隐藏面板 (低风险)
    hidePanel: (list?: string[]) => void;
    /// 显示面板 (低风险)
    showPanel: (list?: string[]) => void;
    /// 注册面板 (中风险、会被注入 HTML 元素)，注册后通过 showPanel 来控制显示/隐藏
    registerSubPanel: (options: { id: string, el: HTMLElement }) => void;
    /// 注销面板
    unregisterSubPanel: (id: string) => void;

    // TODO: 
    // - 特定文件访问权限 (低风险)
    // - 全局文件读写权限 (高风险)
    // - cmd 运行权限 (高风险)
    // - 注册多个其他插件，插件组使用。前置: metadata 需要支持插件组类别声明，不会注册到工具栏/多级菜单中
    // 
    // 话说这里要弄权限管理不，如上面那些带风险的接口
    // 然后没有权限的插件调用这些接口时，就会 NOTICE方式提示用户某插件需要，并引导用户自行开启
  }
}

/// 默认的 ctx 模板
/// 除了 env 的具体内容外，其他借口一般不用变动 (除非要做插件的环境分离/标注)。
/// env 内容则基本上每次传入前都要更新一遍
export const PluginInterfaceCtxDemo: PluginInterfaceCtx = {
  env: {
    selectedText: undefined,
    platform: global_setting.platform,
    activeAppName: undefined,
    activeDocTitle: undefined,
    activeDocUrl: undefined,

    obsidian: global_setting.platform === 'obsidian-plugin' ? {
      plugin: global_setting.other.obsidian_plugin,
      ctx: global_setting.other.obsidian_ctx
    } : undefined,
  },
  api: {
    sendText: (str: string) => { global_setting.api.sendText(str); AMPanel.hide(); },
    saveToClipboard: (str: string) => { global_setting.api.saveToClipboard(str); },
    notify: (message: string) => global_setting.api.notify(message),

    urlRequest: (conf: UrlRequestConfig) => global_setting.api.urlRequest(conf),
    readFile: async (_basePath: 'CONFIG'|'PUBLIC', relPath: string) => { // be override
      return await global_setting.api.readFile(relPath);
    },
    writeFile: async (_basePath: 'CONFIG'|'PUBLIC', relPath: string, content: string) => { // be override
      return await global_setting.api.writeFile(relPath, content);
    },

    hidePanel: (list?: string[]) => { AMPanel.hide(list); },
    showPanel: (list?: string[]) => { AMPanel.show(undefined, undefined, list); },
    registerSubPanel: (options: { id: string, el: HTMLElement }) => {
      global_el.amPanel?.register_sub_panel(options.id, options.el);
    },
    unregisterSubPanel: (id: string) => {
      global_el.amPanel?.unregister_sub_panel(id);
    }
  }
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

  async run(ctx) {},

  onLoad() {
    console.log('demo: 插件加载完成');
  },
  
  onUnload() {
    console.log('demo: 插件卸载');
  }
};
`
