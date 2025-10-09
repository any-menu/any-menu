import {App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom} from "obsidian"
import { initSettingTab_1, initSettingTab_2 } from "@/Core/SettingTab"
import { API } from './api'

export class AMSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: any) {
    super(app, plugin);
  }

  display(): void {
    const {containerEl} = this;
    const { tab_nav_container, tab_content_container } = initSettingTab_1(containerEl)

    // #region 网络字典
    {
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
          const ret = await api.giteeGetDict()
          console.log('giteeGetDict', ret)
        }
      })

      const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
        tab_nav.textContent = 'Online Dict';
      const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
      tab_nav.setAttribute('index', 'web-dict'); tab_content.setAttribute('index', 'web-dict');

      const div = document.createElement('div'); tab_content.appendChild(div);
        div.textContent = `网络词典功能，开发测试中...`

      const refresh_btn = document.createElement('button'); tab_content.appendChild(refresh_btn);
        refresh_btn.textContent = 'Refresh Dict List'
    }
    // #endregion

    initSettingTab_2(tab_nav_container, tab_content_container)
  }
}
