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

    // TODO: 更多环境
    // - 当前选中类型 (文件/图片/文字等...)
    // - 当前所在软件/平台
  },
  api: {
    /// 输出文本到当前位置，输出结束后自动隐藏 (低风险)
    sendText: (str: string) => void;
    /// 隐藏面板 (低风险)
    hidePanel: () => void;
    /// 显示面板 (低风险)
    showPanel: (list?: string[]) => void;

    // TODO: 话说这里要弄权限管理不，如:
    // - NOTION 全局通知权限 (低风险)
    // - 显示新面板、自定义渲染元素 (低风险)
    // - 特定文件访问权限 (低风险)
    // - HTTP 请求权限 (中风险，信息泄露风险)
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
  },
  api: {
    sendText: (str: string) => { global_setting.api.sendText(str); AMPanel.hide(); },
    hidePanel: () => { AMPanel.hide(); },
    showPanel: (list?: string[]) => { AMPanel.show(undefined, undefined, list); },
  }
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
