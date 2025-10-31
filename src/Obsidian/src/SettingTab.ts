import {App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom, Notice} from "obsidian"
import { initSettingTab_1, initSettingTab_2 } from "@/Core/SettingTab"
// import { API } from "@/Core/webApi";

export class AMSettingTab extends PluginSettingTab {
  isInitialized = false

  constructor(app: App, private plugin: any) {
    super(app, plugin);
  }

  display(): void {
    // display() 会重复触发，不要重复添加一些内容
    if (this.isInitialized) return
    this.isInitialized = true
    const { containerEl } = this;
    containerEl.textContent = ""

    const { tab_nav_container, tab_content_container } = initSettingTab_1(containerEl)
    initSettingTab_2(tab_nav_container, tab_content_container)

    containerEl.createEl('button',
      { text: 'Refresh plugin', cls: 'am-ob-setting-btn' },
      (el) => {
        el.onclick = async () => {
          await this.restartPlugin()
        }
      }
    )

    // const api = new API()
    // const plugin = this.plugin
    // plugin.addCommand({
    //   id: 'any-menu-api-test',
    //   name: 'AnyMenu api 目录测试',
    //   callback: async () => {
    //     const ret = await api.giteeGetDirectory()
    //     console.log('giteeGetDirectory', ret)
    //   }
    // })
    // 
    // plugin.addCommand({
    //   id: 'any-menu-api-test2',
    //   name: 'AnyMenu api 文件测试',
    //   callback: async () => {
    //     const ret = await api.giteeGetDict('AdQuote.toml')
    //     console.log('giteeGetDict', ret)
    //   }
    // })
  }

  private async restartPlugin(): Promise<void> {
    const plugin = this.plugin;
    const app = this.app;

    await (app as any).plugins.disablePlugin(plugin.manifest.id)  // 禁用当前插件
    await (app as any).plugins.enablePlugin(plugin.manifest.id)   // 启用当前插件
    
    
    new Notice('插件已成功重启') // 可选
    this.display() // (可选) 重新刷新设置面板
  }
}
