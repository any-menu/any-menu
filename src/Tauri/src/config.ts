/** 配置面板相关 */

import { t } from '../../Core/locales/helper'
import { toml_parse } from '../../Core/panel/contextmenu/demo'
// import { PLUGIN_MANAGER } from '../../Core/pluginManager/PluginManager'
import { initSettingTab_1, initSettingTab_2 } from '../../Core/SettingTab'
import { global_setting } from '../../Core/setting'
import { initApi } from './utils/initApi'
import { invoke } from "@tauri-apps/api/core"

initApi()

const CONFIG_PATH = './am-user.toml' // TODO 放C盘会更利于软件版本更新时复用

window.addEventListener("DOMContentLoaded", async () => {
  const el = document.querySelector("#am-config");
  if (!el) return

  const { tab_nav_container, tab_content_container } = initSettingTab_1(el as HTMLElement)

  // #region config
  {
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = t('Config file');
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'config-file'); tab_content.setAttribute('index', 'config-file');

    const textarea = document.createElement('textarea'); tab_content.appendChild(textarea);
      textarea.value = await load_config()
    textarea.oninput = () => {
      textarea.classList.add('no-save')
    }

    const save_btn = document.createElement('button'); tab_content.appendChild(save_btn); save_btn.classList.add('btn-2');
      save_btn.textContent = t('Save config')
    save_btn.onclick = () => {
      save_config(textarea.value, textarea)
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
export function save_config(new_str: string, textarea?: HTMLTextAreaElement) {
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

// 这样的toml配置会有注释，如果用 global_setting.config 转toml则没注释
// 会自动与 global_setting.config 合并
const DEFAULT_TOML = `\
[config]
language = English          # 语言 'auto'|'English'|'中文'|string
panel_focus_mode = true     # 新窗口的聚焦模式: 聚焦到新窗口/不聚焦到新窗口
panel_default_always_top = false # 默认置顶窗口/不置顶窗口 (pin键是临时切换)

pinyin_index = true         # 是否为中文key自动构建拼音索引
pinyin_first_index = true   # 是否为中文key自动构建拼音首字母索引
# 搜索引擎类型，'reverse'|'trie' (模糊匹配/倒序 | 前缀树)
search_engine = "reverse"
# 查询结果的首页显示数
# 对于模糊匹配引擎: 是显示数，目前不影响搜索引擎的查询数量，即只影响渲染
# 对于前缀树引擎: 是查询数
# 暂时以滚动形式显示，不支持类似输入法的通过 '方括号' 翻页，否则这个数量可以限制更多
search_limit = 500

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
# 在线词库来源 'gitee'|'github'
dict_online_source = "gitee"
# 词库路径列表。在debug模式下不使用这个路径，而是硬编码
dict_paths = "./dict/"
# 记录笔记的基础路径
note_paths = "./notes/"

# app版选项 (插件版不支持)
# app黑名单，其中 'obsidian' 主要针对同时安装anymenu ob插件版和app版的情况。ob进黑名单则插件优先 (推荐)，否则app版优先
app_black_list = ["- Obsidian v"]
# app是否使用高级快捷键
app_ad_shortcut = true
`
