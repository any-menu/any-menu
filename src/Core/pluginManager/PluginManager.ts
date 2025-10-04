// 定义插件必须实现的接口
import { PluginInterface } from './PluginInterface';

/**
 * 暂时把词典和插件都放这一起管理
 * 
 * TODO 转为插件管理器，提供容器，可以去卸载插件 (?)
 */
export class PluginManager {  
  //  plugins: PluginInterface[] = [];

  // 加载并验证插件
  loadPlugin(scriptContent: string): PluginInterface {
    try {
      // 执行脚本，要求返回插件对象
      const fn = new Function(`
        'use strict';
        ${scriptContent}
        return plugin; // 脚本必须定义并返回 plugin 对象
      `);
      
      const plugin = fn() as PluginInterface;
      
      // 运行时验证接口
      this.validatePlugin(plugin);
      
      return plugin;
    } catch (error) {
      throw new Error(`插件加载失败: ${error}`);
    }
  }
  
  // 验证插件是否符合接口
  private validatePlugin(plugin: any): asserts plugin is PluginInterface {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('插件必须返回一个对象');
    }
    
    // 验证必需的 process 方法
    if (typeof plugin.process !== 'function') {
      throw new Error('插件必须实现 process(str?: string): Promise<void|string> 方法');
    }
    
    // 验证 process 方法返回 Promise
    const testResult = plugin.process('test');
    // if (typeof testResult !== 'string') {
    if (!(testResult instanceof Promise)) {
      throw new Error('process 方法必须返回 Promise 类型');
    }
    
    // 验证可选方法
    if (plugin.onLoad && typeof plugin.onLoad !== 'function') {
      throw new Error('onLoad 必须是函数类型');
    }
    
    if (plugin.onUnload && typeof plugin.onUnload !== 'function') {
      throw new Error('onUnload 必须是函数类型');
    }
  }

  // 使用示例
  static async demo() {
    const loader = new PluginManager();

    // 用户编写的插件脚本
    const userScript = `\
    const plugin = {
        metadata: {
            name: 'TextProcessor',
            version: '1.0.0',
            author: 'LincZero'
        },
        
        // 必须实现的方法
        process(str) {
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
    };
    `;

    try {
        const plugin = loader.loadPlugin(userScript);
        
        // 调用插件
        if (plugin.onLoad) plugin.onLoad();

        const result = await plugin.process('hello world');
        console.log(result); // "HELLO WORLD"
        if (plugin.onUnload) plugin.onUnload();
    } catch (error) {
        console.error('插件错误:', error);
    }
  }
}

export const PLUGIN_MANAGER = new PluginManager();
