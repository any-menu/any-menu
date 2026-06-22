import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import { global_setting } from "@/Core/setting";

/** Tauri 多窗口配置与状态同步器 (Synchronizer)
 * 
 * ## 应用环境
 * 
 * Tauri 环境专用
 * 
 * 用于多窗口的多线程环境下，同步多个前端环境和后端
 * 
 * ## 主要同步内容
 * 
 * - gloabl_setting 对象的 .config 和 .state
 *   (包括配置、状态等，还有同步过程中触发的一些 setter 方法)
 * 
 * ## 细节
 * 
 * 补充：最初的配置是由前端的主窗口提供的，不是后端提供的
 * 
 * 职责：
 * 1. 监听后端推送的 "global-setting-updated" 事件，同步其他窗口的变更
 * 2. 监听本地 global_setting 的变化，通过后端广播给所有其他窗口
 * 
 * global_setting 模块需要暴露 onChange 和 offChange 方法，以及可选的 silentSet，以避免本地应用远程数据时再次触发广播。
如果 silentSet 不可实现，也可以在 applyRemote 内设置 this.ignoreLocalChange = true，并在 onChange 中检查该标志位，处理后重置。
 */
export class WindowSyncBus {
  /** 取消后端事件监听的函数 */
  private unlisten: UnlistenFn | null = null;
  /** 取消本地 global_setting 监听的函数 */
  private unsubGlobalSetting: (() => void) | null = null;
  /** 防止本地变更 → 广播 → 自我回灌的标志 */
  private applyingRemote = false;

  /**
   * 启动同步总线
   * 应在 Tauri 窗口初始化阶段调用一次
   */
  public async start(): Promise<void> {
    // 1. 加载后端保存的最新设置
    try {
      const remote = await invoke<{
        config: Record<string, unknown>;
        state: Record<string, unknown>;
      }>("get_global_setting");
      this.applyRemote(remote);
    } catch (e) {
      console.error("[WindowSyncBus] 加载初始设置失败：", e);
    }

    // 2. 监听其他窗口发来的设置变更
    this.unlisten = await listen<{
      config: Record<string, unknown>;
      state: Record<string, unknown>;
    }>("global-setting-updated", (event) => {
      this.applyRemote(event.payload);
    });

    // 3. 监听本地设置变更，并广播给后端
    const onChange = () => {
      // 如果是正在应用远程数据，则跳过广播，避免死循环
      if (this.applyingRemote) return;

      void invoke("broadcast_global_setting", {
        setting: {
          config: global_setting.config,
          state: global_setting.state,
        },
      }).catch((e) => console.error("[WindowSyncBus] 广播失败：", e));
    };

    global_setting.onChange(onChange);
    this.unsubGlobalSetting = () => global_setting.offChange(onChange);
  }

  /**
   * 销毁同步总线，取消所有监听
   */
  public destroy(): void {
    this.unlisten?.();
    this.unlisten = null;

    this.unsubGlobalSetting?.();
    this.unsubGlobalSetting = null;
  }

  /**
   * 将远程设置应用到本地 global_setting，避免再次触发广播
   */
  private applyRemote(setting: { config: any; state: any }): void {
    this.applyingRemote = true;
    try {
      // 假设 global_setting 提供了静默更新方法，不触发 onChange
      if (typeof global_setting.silentSet === "function") {
        global_setting.silentSet(setting.config, setting.state);
      } else {
        // fallback：手动设置字段后再重置监听，或直接赋属性
        // 此处需要根据实际 global_setting 的实现调整
        global_setting.config = setting.config;
        global_setting.state = setting.state;
        // 如果 global_setting 基于 Proxy 且无法绕过 trigger，
        // 可考虑添加一个内部标志位来忽略下一次 onChange
      }
    } finally {
      this.applyingRemote = false;
    }
  }

  /** 使用示例 */
  static async demo() {
    // 主窗口入口（如 main-window.ts）
    const bus = new WindowSyncBus();
    await bus.start("primary");
    window.addEventListener("beforeunload", () => bus.destroy());

    // 从窗口入口（如 settings-window.ts）
    const bus2 = new WindowSyncBus();
    await bus2.start("secondary");
    window.addEventListener("beforeunload", () => bus2.destroy())
  }
}
