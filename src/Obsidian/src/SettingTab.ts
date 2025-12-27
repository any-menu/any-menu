import {App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom, Notice} from "obsidian"
import { initSettingTab_1, initSettingTab_2 } from "@/Core/SettingTab"
import { global_setting } from "@/Core/setting";
import { t } from "./locales/helper";
// import { API } from "@/Core/webApi";

// 配置结构和默认值
export interface AMSettingInterface {
  config: typeof global_setting.config
  isDebug: typeof global_setting.isDebug
}
// 需要与 global_setting 保持同步，这里另外定义是为了
// 1. 类型约束
// 2. 二次封装简化 (去除不可配置项/不让用户配置的部分)
// 一般来说 saveSettings (保存配置文件时) 会自动保证一致性
export const AM_SETTINGS_DEFAULT: AMSettingInterface = {
  config: global_setting.config,
  isDebug: global_setting.isDebug,
}

export class AMSettingTab extends PluginSettingTab {
  isInitialized = false

  constructor(app: App, private plugin: any) {
    super(app, plugin);
  }

  display(): void {
    if (this.isInitialized) return // display() 会重复触发，不要重复添加一些内容
    this.isInitialized = true

    const { containerEl } = this;
    containerEl.textContent = ""

    containerEl.classList.add('tab-root-parent');
    const tab_root = document.createElement('div'); containerEl.appendChild(tab_root); tab_root.classList.add('tab-root');

    const { tab_nav_container, tab_content_container } = initSettingTab_1(tab_root)

    // #region setting panel
    let settings: AMSettingInterface = this.plugin.settings
    {
      const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
        tab_nav.textContent = t('Config file');
      const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
        tab_content.createEl('div', { text: t('Config file2') });
      tab_nav.setAttribute('index', 'obsidian-setting'); tab_content.setAttribute('index', 'obsidian-setting');

      new Setting(tab_content)
      .setName(t('Pinyin index'))
      .setDesc(t('Pinyin index2'))
      .addToggle(toggle => toggle
        .setValue(settings.config.pinyin_index)
        .onChange(async (value) => {
          settings.config.pinyin_index = value
          await this.plugin.saveSettings()
        })
      )

      new Setting(tab_content)
      .setName(t('Pinyin first index'))
      .setDesc(t('Pinyin first index2'))
      .addToggle(toggle => toggle
        .setValue(settings.config.pinyin_first_index)
        .onChange(async (value) => {
          settings.config.pinyin_first_index = value
          await this.plugin.saveSettings()
        })
      )

      new Setting(tab_content)
      .setName(t('Dict paths'))
      .setDesc(t('Dict paths2'))
      .addText(text => text
        .setValue(settings.config.dict_paths)
        .onChange(async (value) => {
          settings.config.dict_paths = value
          await this.plugin.saveSettings()
        })
      )

      new Setting(tab_content)
      .setName(t('Debug mode'))
      .setDesc(t('Debug mode2'))
      .addToggle(toggle => toggle
        .setValue(settings.isDebug)
        .onChange(async (value) => {
          settings.isDebug = value
          await this.plugin.saveSettings()
        })
      )
    }
    // #endregion

    initSettingTab_2(tab_nav_container, tab_content_container)

    tab_root.createEl('button',
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
