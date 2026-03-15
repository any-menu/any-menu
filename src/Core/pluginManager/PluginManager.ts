// 定义插件必须实现的接口
import { global_setting } from '../setting';
import { PluginInterface, PluginInterfaceDemo } from './PluginInterface';
import { z } from 'zod'; // 运行时验证库

// 需要开启 tsconfig.json 中的
// "resolveJsonModule": true,
// "esModuleInterop": true,
import pkg from '../package.json';
const currentAppVersion: string = pkg.version;

// Schema
const PluginMetadataSchema = z.object({
  id: z.string(),
  version: z.string(),
  min_app_version: z.string(),
  name: z.string().optional(),
  author: z.string().optional(),
});
const PluginSchema = z.object({
  metadata: PluginMetadataSchema,
  process: z.function().optional(), 
  run: z.function(),
  onLoad: z.function().optional(),
  onUnload: z.function().optional(),
});
// export type PluginInterface2 = z.infer<typeof PluginSchema>;

/** 插件管理
 */
export class PluginManager {  
  // 存储所有已加载的插件
  plugin_list: Record<string, PluginInterface> = {};
  dict_list: Record<string, PluginInterface> = {};

  static factory() {
    return new PluginManager();
  }
  private constructor() {
    if (global_setting.isDebug) console.log('>>> PluginManager initialized'); // 验证单例
  }

  // @param file_name_short 仅用于失败时打印，无其他作用
  async loadPlugin(file_name_short: string, scriptContent: string): Promise<PluginInterface> {
    let blobUrl: string | null = null;
    try {
      // 1. Import 脚本
      //   将字符串代码转换为 Blob，并指定类型为 JS 模块
      const blob = new Blob([scriptContent], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      //   使用原生动态 import 加载这个虚拟文件
      //   使用 /* @vite-ignore */ 防止 Vite 在构建时试图解析这个动态路径
      const module = await import(/* @vite-ignore */ blobUrl);
      //   获取 export default 导出的对象
      const rawPlugin = module.default;
      if (!rawPlugin) {
        throw new Error('Plugin script must export a default object, #' + file_name_short);
      }

      // 2. 验证插件格式
      const plugin = this.loadPlugin_validatePlugin(rawPlugin);
      
      // 3. 注册并执行加载事件
      this.plugin_list[plugin.metadata.id] = plugin;
      plugin.onLoad?.();

      return plugin;
    } catch (error) {
      throw new Error('Plugin load error, #' + file_name_short, { cause: error });
    } finally {
      // 清理内存，防止内存泄漏
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    }
  }
  /** 验证插件是否符合接口 */
  private loadPlugin_validatePlugin(rawPlugin: any): PluginInterface {
    // 使用 Zod 进行结构和类型验证
    const result = PluginSchema.safeParse(rawPlugin); // 使用 safeParse 进行验证，而不是直接 parse
    if (!result.success) {
      // 提取格式化后的错误信息
      const errorMsg = result.error.issues
        .map(e => `字段 '${e.path.join('.')}' ${e.message}`)
        .join('; ');
      throw new Error(`Plugin validate error: #${rawPlugin?.metadata?.id} ${errorMsg}`);
    }

    // 检查版本号
    const isCompatible = PluginManager.isVersionCompatible(rawPlugin.metadata.min_app_version, currentAppVersion);
    if (!isCompatible) {
      throw new Error(`Plugin "${rawPlugin.metadata.name || rawPlugin.metadata.id}" requires app version ${rawPlugin.metadata.min_app_version} or higher. Current version: ${currentAppVersion}`);
    }

    // 注意：我们直接返回 rawPlugin，而不是 result.data
    // 原因是 Zod 默认会剔除(strip)未定义的字段，如果我们返回 result.data，
    // 插件自身定义的内部变量或辅助函数就会丢失，会导致插件内部的 this.xxx 调用失败。
    return rawPlugin as PluginInterface;
  }

  // #region 废弃，旧版的插件加载和验证方案

  /** 加载并验证插件
   * 
   * @deprecated 旧方案，废弃
   *   新版改进: 原字符串 + new Function 加载 -> Blob + dynamic import；类似 obsidian 插件体系的做法
   */
  loadPlugin2(scriptContent: string): PluginInterface {
    try {
      // 执行脚本，要求返回插件对象
      const fn = new Function(`
        'use strict'
        ${scriptContent}
        return plugin; // 脚本必须定义并返回 plugin 对象
      `);

      const plugin = fn() as PluginInterface;
      this.loadPlugin_validatePlugin2(plugin); // 验证接口，错误则抛出错误
      this.plugin_list[plugin.metadata.id] = plugin;

      // 加载脚本
      plugin.onLoad?.()

      return plugin;
    } catch (error) {
      console.error('插件加载失败:', scriptContent, error);
      throw new Error(`插件加载失败: ${error}`);
    }
  }
  /** 验证插件是否符合接口 (纯字段验证)
   * 
   * @deprecated 旧方案，废弃
   *   缺点:
   *   - 手动验证太繁琐且易错：每次修改接口都要改 validatePlugin
   *   - 为了验证而实际执行了。如为了验证返回值是 Promise，居然在验证阶段实际执行了 plugin.process('test')。
   *     如果这个插件里包含副作用（比如删除文件、发起网络请求），在加载阶段就会被触发，这非常危险
   *   - 安全性几乎为零：new Function 和 eval 类似，它会在当前的全局作用域下执行代码。这意味着恶意插件可以直接访问 window / global
   */

  private loadPlugin_validatePlugin2(plugin: any): asserts plugin is PluginInterface {
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

  // #endregion

  // 使用示例
  static async demo() {
    const loader = new PluginManager();

    // 插件 - 加载 + 验证
    const plugin = await loader.loadPlugin('PluginInterfaceDemo', PluginInterfaceDemo);

    // 插件 - 调用常规接口
    if (plugin.process) {
      const result = await plugin.process('demo: hello world' as never);
      if (global_setting.isDebug) console.log(result); // "HELLO WORLD"
    }

    // 插件 - 卸载
    if (plugin.onUnload) plugin.onUnload();
  }

  /** 比较应用版本是否满足插件的最低要求
   * @returns true: 当前版本 >= 最低要求版本; false: 当前版本 < 最低要求版本
   */
  static isVersionCompatible(minVersion: string, currentVersion: string): boolean {
    const minParts = minVersion.split('.').map(Number);
    const currParts = currentVersion.split('.').map(Number);

    const maxLength = Math.max(minParts.length, currParts.length);
    for (let i = 0; i < maxLength; i++) {
      const min = minParts[i] || 0;
      const curr = currParts[i] || 0;
      if (curr > min) return true;  // 当前版本 > 最小版本
      if (curr < min) return false; // 当前版本 < 最小版本
    }
    return true;                    // 当前版本 = 最小版本
  }
}

// TODO 需要实现多进程单例 (Main 和 Config 面板是两个 WebView 进程)
export const PLUGIN_MANAGER = PluginManager.factory();
