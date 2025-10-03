/*// 定义插件必须实现的接口
interface PluginInterface {
  // 必需方法
  process: (str?: string) => Promise<void|string>;
  
  // 可选方法
  onLoad?: () => void;
  onUnload?: () => void;
  
  // 元数据
  metadata?: {
    name: string;
    version: string;
    author?: string;
  };
}*/

const plugin = {
    metadata: {
        name: 'TextProcessor',
        version: '1.0.0',
        author: 'LincZero'
    },
    
    // 必须实现的方法
    async process(str) {
        if (!str) return 'Empty input';
        return str.toUpperCase();
    },
    
    // 可选方法
    onLoad() {
        console.log('插件加载完成');
    },
    
    onUnload() {
        console.log('插件卸载');
    }
}
