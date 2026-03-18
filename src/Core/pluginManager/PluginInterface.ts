/**
 * 如果你是脚本开发者，那么你需要要阅读这个文件即可
 */

import { AMPanel } from "../panel";
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
    /// icon
    /// - 支持 lucide 图标名用法 (需要联网)，用法: "lucide-图标名"，如 "lucide-table"。图标名可于 https://lucide.dev/ 查询
    ///   TODO 可以支持 `.` 写法来添加 class，从而实现带颜色的 lucide 图标这种需求
    /// - 支持 SVG string (应用前采取安全措施 dompurify)
    /// - 支持 不填，会使用名字来默认构造图标
    icon?: string;

    // 弃用，应该把平台给 ctx 变量。
    // 一来一个插件可能会对多个平台做不同的事，如果不支持，让插件自己去检查平台就好了
    // 二来 App 版本和 Obsidian 版本可能会使用同一个插件文件夹
    // 仅适用于某个平台，不填则不限制
    // platform?: ("app"|"obsidian")[];
  };

  /// 旧接口
  /// @deprecated 没有ctx环境，未来将废弃
  process?: (str?: string) => Promise<void|string>;
  /// 新接口
  /// 传入ctx，必须实现
  /// 点击或选择触发
  run: (ctx: PluginInterfaceCtx) => Promise<void>;

  /// 加载插件时调用
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

    // TODO: 更多环境
    // - miniEditorText?: string;
    // - 当前选中类型 (文件/图片/文字等...)
  },
  api: {
    /// 输出文本到当前位置，输出结束后自动隐藏 (低风险)
    sendText: (str: string) => void;
    /// 保存到剪切板 (低风险)
    saveToClipboard: (str: string) => void;
    /// 隐藏面板 (低风险)
    hidePanel: () => void;
    /// 显示面板 (低风险)
    showPanel: (list?: string[]) => void;
    /// 通知用户 (低风险)
    notify: (message: string) => void;
    /// 网络请求 (中风险，信息泄露风险)
    urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null>;

    // TODO: 话说这里要弄权限管理不，如:
    // - 特定文件访问权限 (低风险)
    // - 全局文件读写权限 (高风险)
    // - cmd 运行权限 (高风险)
    // 然后没有权限的插件调用这些接口时，就会 NOTION 方式提示用户某插件需要，并引导用户自行开启
  }
}

/// 默认的 ctx 模板
/// 除了 env 的具体内容外，其他借口一般不用变动
export const PluginInterfaceCtxDemo: PluginInterfaceCtx = {
  env: {
    selectedText: undefined,
    platform: global_setting.platform,
    activeAppName: undefined,
    activeDocTitle: undefined,
    activeDocUrl: undefined,
  },
  api: {
    sendText: (str: string) => { global_setting.api.sendText(str); AMPanel.hide(); },
    saveToClipboard: (str: string) => { global_setting.api.saveToClipboard(str); },
    hidePanel: () => { AMPanel.hide(); },
    // TODO 未完成，以后要支持自定义 el 和 css
    showPanel: (list?: string[]) => { AMPanel.show(undefined, undefined, list); },
    notify: (message: string) => global_setting.api.notify(message),
    urlRequest: (conf: UrlRequestConfig) => global_setting.api.urlRequest(conf),
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
