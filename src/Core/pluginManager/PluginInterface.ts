/**
 * 如果你是脚本开发者，那么你需要要阅读这个文件即可
 */

// 定义插件必须实现的接口
export interface PluginInterface {
  // 必须实现
  process: (str?: string) => Promise<void|string>;

  // 可选实现
  onLoad?: () => void;
  onUnload?: () => void;
  
  // 元数据
  metadata: {
    id: string; // 唯一标识符
    version: string;
    name?: string;
    author?: string;
  };
}
