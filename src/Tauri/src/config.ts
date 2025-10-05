/** 配置面板相关 */

import { invoke } from '@tauri-apps/api/core';
import { global_setting } from '../../Core/Setting';
import { toml_parse } from '../../Core/contextmenu/demo';
import { PLUGIN_MANAGER } from '../../Core/pluginManager/PluginManager';

const CONFIG_PATH = './am-user.toml'

window.addEventListener("DOMContentLoaded", async () => {
  const el = document.querySelector("#am-config");
  if (!el) return

  el.classList.add('tab-root')
  const tab_nav_container = document.createElement('div'); el.appendChild(tab_nav_container); tab_nav_container.classList.add('tab-nav-container');
  const tab_content_container = document.createElement('div'); el.appendChild(tab_content_container); tab_content_container.classList.add('tab-content-container');

  // #region mini docs
  {
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = 'Mini docs';
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'mini-docs'); tab_content.setAttribute('index', 'mini-docs');

    const div = document.createElement('div'); tab_content.appendChild(div);
      div.textContent = `默认使用 Alt + A 打开菜单`

    tab_nav.classList.add('active');
    tab_content.classList.add('active');
  }
  // #endregion
  
  // #region config
  {
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = 'Config file';
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'config-file'); tab_content.setAttribute('index', 'config-file');

    const textarea = document.createElement('textarea'); tab_content.appendChild(textarea);
      textarea.value = await load_config()
    textarea.oninput = () => {
      textarea.classList.add('no-save')
    }

    const save_btn = document.createElement('button'); tab_content.appendChild(save_btn); save_btn.classList.add('btn-2');
      save_btn.textContent = 'Save Config'
    save_btn.onclick = () => {
      save_config(textarea.value, textarea)
    }
  }
  // #endregion

  // #region plugin manager
  {
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
  }
  // #endregion

  // #region 标签栏切换
  for (const nav of tab_nav_container.querySelectorAll('div.item')) {
    const index: string|null = nav.getAttribute('index')
    if (index == null) continue
    ;(nav as HTMLElement).onclick = () => {
      for (const nav_item of tab_nav_container.children) {
        nav_item.classList.remove('active');
      }
      nav.classList.add('active');
      let content: HTMLElement|null = null
      for (const content_ of tab_content_container.children) {
        content_.classList.remove('active');
        if (content_.getAttribute('index') === index) content = content_ as HTMLElement;
      }
      content?.classList.add('active');
    }
  }
  // #endregion
})

export async function load_config() {
  let file_content: string = ''

  // 读取配置文件
  try {
    const result = await invoke("read_file", {
      path: CONFIG_PATH,
    })
    if (typeof result !== 'string') {
      throw new Error("Invalid file content format")
    }
    file_content = result
  } catch (error) {
    console.warn("没配置文件，将自动生成一个")
  }

  // 生成配置文件
  if (file_content.trim() == '') {
    file_content = DEFAULT_TOML
    try {
      const is_success: boolean = await invoke("create_file", {
        path: CONFIG_PATH,
        content: DEFAULT_TOML,
      })
      if (!is_success) throw new Error("Create file failed")
    } catch (error) {
      console.error("配置文件创建失败:", error)
      return ''
    }
  }
  
  return file_content
}

/** 保存配置
 * @param new_str 新的配置字符串
 * @param textarea (可选) 用于表示未保存/保存错误的状态
 */
export function save_config(new_str: string, textarea?: HTMLTextAreaElement) {
  try {
    const new_config = toml_parse(new_str)['config']
    if (new_config && typeof new_config === 'object') {
      global_setting.config = {...global_setting.config, ...new_config}
    } else {
      throw new Error("Invalid config format")
    }

    // TODO 保存配置文件 & 刷新某些对象/界面
    // global_setting.save_config()

    textarea?.classList.remove('no-save', 'error-save')
    console.log('配置已保存，重启应用后生效')
  } catch (error) {
    textarea?.classList.remove('no-save')
    textarea?.classList.add('error-save')
    console.error('配置保存失败，请检查格式是否正确', error)
  }
}

// 这样的toml配置会有注释，如果用 global_setting.config 转toml则没注释
const DEFAULT_TOML = `\
[[config]]
pinyin_index = true         # 是否为中文key自动构建拼音索引
pinyin_first_index = true   # 是否为中文key自动构建拼音首字母索引

# 搜索引擎类型，'reverse'|'trie' (模糊匹配/倒序 | 前缀树)
search_engine = "reverse"

#  发送文本的方式。
# 'keyboard'|'clipboard'|'auto'
# enigo/keyboard为模拟键盘输入，clipboard为复制到剪贴板,
# 建议为 clipboard (或 auto，auto根据文本长度和是否有换行符决定)
# 'keyboard' 好处是快，适合明确的短文本，缺点是不适合复杂情况或未知情况，例如:
# - 被字符转义: QQ等环境，当把一个 emoji 拆成两字符输出，然后被转义成两个用于表示未知的字符，如 '😀' -> '��'
# - 输出长文本后难以撤销: 撤销操作会分多次运行，具体示编辑器的一些刷新机制或优化有关 (vscode等通常按字符，ob等按单词撤回)
# - 受自动补全和缩进影响: 如输出emoji中，由于经常包含括号和双引号等符号，可能被自动补全成一对。又如自动换行，可能会被自动缩进，导致重复缩进
# 仅当你清楚以上情况，总是输出短语时，才建议使用 keyboard
# 
# TODO: 后续是否有可能不同的字典/词表用不同的发送方式? 例如有些词表用来表示按键操作组
# 
send_text_method = "clipboard"

# 查询结果的首页显示数
# 对于模糊匹配引擎: 是显示数，目前不影响搜索引擎的查询数量，即只影响渲染
# 对于前缀树引擎: 是查询数
# 暂时以滚动形式显示，不支持类似输入法的通过 '方括号' 翻页，否则这个数量可以限制更多
search_limit = 500

# 词库路径列表。在debug模式下不使用这个路径，而是硬编码
dict_paths = "./dict"
`
