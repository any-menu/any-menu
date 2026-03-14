// 定义插件必须实现的接口
import { global_setting } from '../setting';
import { PluginInterface, PluginInterfaceDemo } from './PluginInterface';

/** 插件管理
 */
export class PluginManager {  
  // 存储所有已加载的插件
  plugin_list: Record<string, PluginInterface> = {};
  dict_list: Record<string, PluginInterface> = {};

  constructor() {
    if (global_setting.isDebug) console.log('>>> PluginManager initialized'); // 验证单例
  }

  /// 加载并验证插件
  loadPlugin(scriptContent: string): PluginInterface {
    try {
      // 执行脚本，要求返回插件对象
      const fn = new Function(`
        'use strict';
        ${scriptContent}
        return plugin; // 脚本必须定义并返回 plugin 对象
      `);

      const plugin = fn() as PluginInterface;
      this.validatePlugin(plugin); // 验证接口，错误则抛出错误
      this.plugin_list[plugin.metadata.id] = plugin;

      // 加载脚本
      plugin.onLoad?.()

      return plugin;
    } catch (error) {
      console.error('插件加载失败:', scriptContent, error);
      throw new Error(`插件加载失败: ${error}`);
    }
  }
  
  /// 验证插件是否符合接口 (纯字段验证)
  private validatePlugin(plugin: any): asserts plugin is PluginInterface {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('插件必须返回一个对象');
    }
    
    // 验证必需的 process 方法
    if (typeof plugin.process !== 'function') {
      throw new Error('插件必须实现 process(str?: string): Promise<void|string> 方法');
    }
    const testResult = plugin.process('test'); // 验证返回 Promise (会实际允许一遍)
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

    try {
      // 加载+验证插件
      const plugin = loader.loadPlugin(PluginInterfaceDemo);

      // 插件 - 调用常规接口
      const result = await plugin.process('hello world');
      if (global_setting.isDebug) console.log(result); // "HELLO WORLD"
      if (plugin.onUnload) plugin.onUnload();
    } catch (error) {
      console.error('插件错误:', error);
    }
  }
}

// TODO 需要实现多进程单例 (Main 和 Config 面板是两个 WebView 进程)
export const PLUGIN_MANAGER = new PluginManager();
