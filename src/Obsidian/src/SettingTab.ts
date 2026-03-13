/** 配置面板相关
 * 
 * ## 第一编辑对象 注意项
 * 
 * 一般情况下，第一编辑对象应该是 global_setting，然后再去同步到别的地方
 * 因为 Core 模块中，第一编辑对象只能是 global_setting。
 * 这样方便规范重载的 global_setting.api.saveConfig 行为
 * 
 * ~~同时这也满足 loadConfig 中 file -> ob setting -> global setting 的反序行为~~
 * 现已弃用 ob plugins.settings
 */

import { App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom, Notice } from "obsidian"
import { initSettingTab_1, initSettingTab_2 } from "@/Core/SettingTab"
import { global_setting } from "@/Core/setting";
import { t } from "@/Core/locales/helper";
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
    initSettingTab_obConfig(tab_nav_container, tab_content_container)
    initSettingTab_obConfigFile(tab_nav_container, tab_content_container)
    initSettingTab_2(tab_nav_container, tab_content_container)

    tab_root.createEl('button',
      { text: t('Reload plugin'), cls: ['am-ob-setting-btn', 'absolute'] },
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

/// Obsidian 可视化配置
function initSettingTab_obConfig(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Config');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'obsidian-setting'); tab_content.setAttribute('index', 'obsidian-setting');

  tab_content.createEl('div', { text: t('Config2') });

  new Setting(tab_content)
  .setName(t('Pinyin index'))
  .setDesc(t('Pinyin index2'))
  .addToggle(toggle => toggle
    .setValue(global_setting.config.pinyin_index)
    .onChange(async (value) => {
      global_setting.config.pinyin_index = value
      await global_setting.api.saveConfig()
    })
  )

  new Setting(tab_content)
  .setName(t('Pinyin first index'))
  .setDesc(t('Pinyin first index2'))
  .addToggle(toggle => toggle
    .setValue(global_setting.config.pinyin_first_index)
    .onChange(async (value) => {
      global_setting.config.pinyin_first_index = value
      await global_setting.api.saveConfig()
    })
  )

  new Setting(tab_content)
  .setName(t('Dict paths'))
  .setDesc(t('Dict paths2'))
  .addText(text => text
    .setValue(global_setting.config.dict_paths)
    .onChange(async (value) => {
      global_setting.config.dict_paths = value
      await global_setting.api.saveConfig()
    })
  )

  new Setting(tab_content)
  .setName(t('Dict online source'))
  .setDesc(t('Dict online source2'))
  .addDropdown(dropdown => {
    dropdown.addOption('gitee', 'gitee')
    dropdown.addOption('github', 'github')
    dropdown.setValue(global_setting.config.dict_online_source as 'gitee' | 'github')
    dropdown.onChange(async (value) => {
      global_setting.config.dict_online_source = value as 'gitee' | 'github'
      await global_setting.api.saveConfig()
    })
  })

  new Setting(tab_content)
  .setName(t('Debug mode'))
  .setDesc(t('Debug mode2'))
  .addToggle(toggle => toggle
    .setValue(global_setting.isDebug)
    .onChange(async (value) => {
      global_setting.isDebug = value
      await global_setting.api.saveConfig()
    })
  )
}

/** Obsidian 纯文本编辑 data.json
 * 
 * 这里有两种思路:
 * - 一是 const ret = await global_setting.api.loadConfig() 获取 json 再转字符串
 * - 二是使用 global_setting.api.readFile() 直接读取 data.json 的文本内容
 *   该方案的一个缺点是: 插件的文件夹名是可以改变的
 */
function initSettingTab_obConfigFile(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Config file');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'obsidian-setting-file'); tab_content.setAttribute('index', 'obsidian-setting-file');

  // 自动刷新。注意不要用 `onclick =` 写法，会被标签页另一个行为覆盖；注意这可能会覆盖未保存的状态
  tab_nav.addEventListener('click', () => void load_file_content())

  tab_content.createEl('div', { text: t('Config file2') });

  const textarea_p = tab_content.createEl('div')
  const textarea = textarea_p.createEl('textarea')
  textarea.addEventListener('input', () => {
    textarea.classList.add('no-save'); textarea.classList.remove('error-save');
  })
  void load_file_content()

  const btn_refresh = tab_content.createEl('button', { text: t('Refresh'), cls: 'absolute', attr: { style: 'position: absolute; bottom: 55px;' } })
    btn_refresh.addEventListener('click', () => void load_file_content())
  const btn_save = tab_content.createEl('button', { text: t('Save config'), cls: 'absolute', attr: { style: 'position: absolute; bottom: 16px;' } })
    btn_save.addEventListener('click', () => void save_file_content())

  async function load_file_content() {
    textarea.value = 'Loading...'
    await global_setting.api.loadConfig()
    const settings = {
      config: global_setting.config,
      isDebug: global_setting.isDebug
    }
    const text = JSON.stringify(settings, null, 2)
    textarea.value = text
  }
  async function save_file_content() {
    try {
      textarea.classList.remove('no-save'); textarea.classList.remove('error-save');
      const obj = JSON.parse(textarea.value)
      global_setting.config = obj.config
      global_setting.isDebug = obj.isDebug
      await global_setting.api.saveConfig()
    } catch (e) {
      textarea.classList.remove('no-save'); textarea.classList.add('error-save');
      new Notice('Invalid JSON format')
      console.error('Save config error: invalid json format', e)
      return
    }
  }
}
