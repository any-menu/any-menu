import {App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom} from "obsidian"
import { initSettingTab_1, initSettingTab_2 } from "@/Core/SettingTab"
import { API } from "@/Core/webApi";

export class AMSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: any) {
    super(app, plugin);
  }

  display(): void {
    const {containerEl} = this;
    const { tab_nav_container, tab_content_container } = initSettingTab_1(containerEl)
    initSettingTab_2(tab_nav_container, tab_content_container)

    const api = new API()
    const plugin = this.plugin
    plugin.addCommand({
      id: 'any-menu-api-test',
      name: 'AnyMenu api 目录测试',
      callback: async () => {
        const ret = await api.giteeGetDirectory()
        console.log('giteeGetDirectory', ret)
      }
    })

    plugin.addCommand({
      id: 'any-menu-api-test2',
      name: 'AnyMenu api 文件测试',
      callback: async () => {
        const ret = await api.giteeGetDict('AdQuote.toml')
        console.log('giteeGetDict', ret)
      }
    })
  }
}
