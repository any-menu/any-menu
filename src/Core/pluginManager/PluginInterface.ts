/**
 * 如果你是脚本开发者，那么你需要要阅读这个文件即可
 */

// 定义插件必须实现的接口
export interface PluginInterface {
  /// 元数据
  metadata: {
    /// 唯一标识符
    id: string;
    /// 脚本版本
    version: string;
    /// 宿主应用版本要求
    app_min_version: string;
    /// 插件名称 (如不提供则默认为 id)
    name?: string;
    /// 插件作者
    author?: string;
  };

  /// 旧接口
  /// @deprecated 没有ctx环境，未来将废弃
  process: (str?: string) => Promise<void|string>;
  /// 新接口
  /// 传入ctx，必须实现
  run: (ctx: any) => Promise<void>;

  /// 可选实现
  onLoad?: () => void;
  onUnload?: () => void;
}

export const PluginInterfaceDemo: string = `\
const plugin = {
  metadata: {
    id: 'text-processor',
    name: 'TextProcessor',
    version: '1.0.0',
    min_app_version: '1.0.5',
    author: 'LincZero'
  },

  async process(str) {
    if (!str) return 'Empty input';
    return str.toUpperCase();
  },

  async run(ctx) {},

  onLoad() {
    console.log('插件加载完成');
  },
  
  onUnload() {
    console.log('插件卸载');
  }
};
`
