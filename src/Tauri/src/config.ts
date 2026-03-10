/** 配置面板相关
 * 
 * ## 第一编辑对象 注意项
 * 
 * 一般情况下，第一编辑对象应该是 global_setting，然后再去同步到别的地方
 * 因为 Core 模块中，第一编辑对象只能是 global_setting。
 * 这样方便规范重载的 global_setting.api.saveConfig 行为
 */

import { t } from '../../Core/locales/helper'
import { toml_parse } from '../../Core/panel/contextmenu/demo'
// import { PLUGIN_MANAGER } from '../../Core/pluginManager/PluginManager'
import { global_setting } from '../../Core/setting'
import { initSettingTab_1, initSettingTab_2 } from '../../Core/SettingTab'
import { initApi } from './utils/initApi'

initApi()

// #region 启动时阅读配置文件

let is_init = false
async function init() {
  if (is_init) return
  is_init = true
  const result = await global_setting.api.loadConfig()
  if (!result) { console.error('配置文件读取/初始化失败'); return }
}

// #endregion

const CONFIG_PATH = './am-user.toml' // TODO 放C盘会更利于软件版本更新时复用

// 前端模块
window.addEventListener("DOMContentLoaded", async () => {
  const el = document.querySelector("#am-config");
  if (!el) return

  await init() // 保证先读取配置再初始化别的

  const { tab_nav_container, tab_content_container } = initSettingTab_1(el as HTMLElement)

  // #region config
  {
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = t('Config file');
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'config-file'); tab_content.setAttribute('index', 'config-file');

    const textarea = document.createElement('textarea'); tab_content.appendChild(textarea);
       const result = await global_setting.api.loadConfig()
       if (typeof result === 'string') textarea.value = result
       else textarea.value = 'Error: Load config failed'
    textarea.oninput = () => {
      textarea.classList.add('no-save')
    }

    const save_btn = document.createElement('button'); tab_content.appendChild(save_btn); save_btn.classList.add('btn-2');
      save_btn.textContent = t('Save config')
    save_btn.onclick = () => {
      save_config_from_string(textarea.value, textarea)
    }
  }
  // #endregion

  // #region plugin manager
  /*{
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = 'Plugin manager';
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'plugin-manager'); tab_content.setAttribute('index', 'plugin-manager');

    const el_refresh_btn = document.createElement('button'); tab_content.appendChild(el_refresh_btn); el_refresh_btn.classList.add('btn-2');
      el_refresh_btn.textContent = 'Refresh plugin list';
      el_refresh_btn.onclick = () => {
        load_plugins()
      }
      
    function load_plugins() {
      tab_content.querySelectorAll('ul').forEach(e=>e.remove());
      const el_plugins = document.createElement('ul'); tab_content.appendChild(el_plugins);
      console.log('Plugin len', PLUGIN_MANAGER.plugin_list);
      for (const key in PLUGIN_MANAGER.plugin_list) {
        const plugin = PLUGIN_MANAGER.plugin_list[key];
        const li = document.createElement('li'); el_plugins.appendChild(li);
          li.textContent = `${plugin.metadata.name} v${plugin.metadata.version} by ${plugin.metadata.author ?? 'Unknown'}`;
      }
    }
    load_plugins()
  }*/
  // #endregion

  initSettingTab_2(tab_nav_container, tab_content_container)
})

/** 保存配置
 * @param new_str 新的配置字符串
 * @param textarea (可选) 用于表示未保存/保存错误的状态
 * 
 * 保持toml中的注释不变问题的解决方案: TODO
 * - 确认修改来源，有两种。一是在软件中以文本方式修改toml，二是使用封装好的界面修改配置项。
 *   - 如果是前者，那么直接保存文本即可，就不用管注释问题
 *     (此函数不处理，该函数执行之前处理)
 *   - 如果是后者，则使用其他方法。
 *     具体是把这两弄成是冲突的，如果支持了界面配置项，
 *     就表示可以使用界面来向用户表示每个配置项的含义，而不是注释了。此时保存可以直接覆盖注释
 *   - 还有一种比较高级的做法，是可以参考 vscode 的 settings.json 的注释处理方式。
 *     这种也能通过界面配置，而且不会丢失注释
 * 
 * 其中第三点GPT说是:
 * 基于带注释/空白的语法树（token/trivia-aware AST）做最小文本编辑（minimal textual edits）
 * 也就是说不把整个文件重新序列化替换，而是解析出能保留注释/空白的信息结构，定位到要改动的 key/value 的文本片段，仅替换或插入那一小段文本，保持其他内容（注释、顺序、换行、缩进）原封不动
 */
function save_config_from_string(new_str: string, textarea?: HTMLTextAreaElement) {
  try {
    // 解析新配置文件
    const new_config = toml_parse(new_str)['config']
    if (!new_config || typeof new_config !== 'object') {
      throw new Error("Invalid config format")
    }
    
    // 保存新配置文件
    const result = global_setting.api.writeFile(CONFIG_PATH, new_str)
    if (!result) {
      throw new Error("Write file failed")
    }

    // 应用新配置文件 // TODO 可以动态更新一些页面信息 (暂时通过告知用户设置后需要重启来实现)
    global_setting.config = {...global_setting.config, ...new_config}

    // 告知用户应用成功
    textarea?.classList.remove('no-save', 'error-save')
    console.log('配置已保存，重启应用后生效')
  } catch (error) {
    textarea?.classList.remove('no-save')
    textarea?.classList.add('error-save')
    console.error('配置保存失败，请检查格式是否正确', error)
  }
}
