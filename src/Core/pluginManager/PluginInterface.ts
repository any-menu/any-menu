/**
 * 如果你是脚本开发者，那么你需要要阅读这个文件即可
 */

import { AMPanel } from "../panel";
import { global_setting } from "../setting";

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
  };

  /// 旧接口
  /// @deprecated 没有ctx环境，未来将废弃
  process?: (str?: string) => Promise<void|string>;
  /// 新接口
  /// 传入ctx，必须实现
  run: (ctx: PluginInterfaceCtx) => Promise<void>;

  /// 加载插件时调用
  onLoad?: () => void;
  /// 卸载插件时调用
  onUnload?: () => void;
}

export interface PluginInterfaceCtx {
  /// 当前选中文本
  selectedText?: string;
  /// 输出文本到当前位置，输出结束后自动隐藏
  sendText: (str: string) => void;
  /// 隐藏面板
  hide: () => void;
}

export const PluginInterfaceCtxDemo: PluginInterfaceCtx = {
  selectedText: undefined,
  sendText: (str: string) => { global_setting.api.sendText(str); AMPanel.hide(); },
  hide: () => { AMPanel.hide(); }
}

export const PluginInterfaceDemo: string = `\
export default {
  metadata: {
    id: 'text-processor',
    name: 'TextProcessor',
    version: '1.0.0',
    min_app_version: '1.1.0',
    author: 'LincZero'
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
