import { global_setting, UrlRequestConfig, UrlResponse } from '../../../Core/setting'
import { hideWindow } from '../module/window'
import { toml_parse } from '../../../Core/panel/contextmenu/demo'

import { invoke } from "@tauri-apps/api/core"
import { fetch as tauri_fetch } from '@tauri-apps/plugin-http'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'

// api适配 (Ob/App/Other 环境)
export function initApi() {
  global_setting.env = 'app'

  // 语言环境
  // 使用浏览器原生 API
  // 也可以改为调用 Tauri Windows 接口处理 'auto' 类型
  const userLocale = navigator.language // 例如: 'zh-CN', 'en-US', 'ja-JP'
  const mainLanguage = userLocale.split('-')[0]; // 'zh', 'en', 'ja'
  if (global_setting.config.language == 'auto') {
    global_setting.state.language = mainLanguage
  } else {
    global_setting.state.language = global_setting.config.language
  }

  global_setting.api.getCursorXY = async () => {
    const pos: any = await invoke("get_caret");
    if (typeof pos === 'string') {
      global_setting.state.selectedText = undefined
      return { x: -1, y: -1 }
    }

    // 弃用。改为黑名单注销全局快捷键的方式
    // 通过窗口名，处理软件版本与插件版本的冲突问题
    // 如果不开启 app_no_use_in_ob，则会是全局快捷键的 app 版本优先，快捷键冲突时召唤的是 app 的菜单
    // 反之则 ob 的插件版本优先
    // pos 示例: AnyMenu简单的上下文 - MdNote_Public - Obsidian v1.9.10
    // if (global_setting.config.app_no_use_in_ob && pos[3] && pos[3].length > 0) {
    //   if (pos[3].includes('- Obsidian v')) {
    //     return { x: -2, y: -2 }
    //   }
    // }

    global_setting.state.selectedText = pos[2] && pos[2].length > 0 ? pos[2] : undefined
    return { x: pos[0], y: pos[1] }
  }

  global_setting.api.getScreenSize = async () => {
    const pos: any = await invoke("get_screen_size");
    if (typeof pos === 'string') return { width: -1, height: -1 }
    return { width: pos[0], height: pos[1] }
  }

  global_setting.api.getInfo = async (): Promise<string|null> => {
    const info: any = await invoke("get_info");
    if (typeof info !== 'string') return null
    return info
  }

  global_setting.api.notify = async (message: string) => {
    try {
      // 处理系统通知权限
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) { // 如果没有授予权限，则向用户请求权限
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      if (!permissionGranted) { // 请求权限失败
        console.warn('用户拒绝了系统通知权限');
      }

      // 发送通知
      // 这个是系统级的通知，缺点: 无法控制显示时长、堆叠/排序
      // 如果想要解决该缺点，可以应用内通知 (不过目前该软件并非常规窗口使用逻辑，要做这点可能得维护一个专用于通知的窗口)
      sendNotification({
        title: 'AnyMenu',
        body: message,
        // icon: '可选：图标路径'
      });
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  global_setting.api.sendText = async (str: string) => {
    // 非 Tauri 程序中，我们采用了非失焦的方式展开菜单
    // 但 Tauri 程序中，我们采用了失焦的方式展开菜单
    // 这里应该多一个判断。不过这里恒为后者
    hideWindow()
    await new Promise(resolve => setTimeout(resolve, 2)) // 等待一小段时间确保窗口已隐藏且焦点已切换
    await invoke("send", { text: str, method: global_setting.config.send_text_method })
  }

  global_setting.api.readFolder = async (relPath: string) => {
    const files: string[]|null = await invoke("read_folder", { path: relPath })
    if (typeof files !== 'object' || !Array.isArray(files)) {
      console.error("Invalid directory listing format", relPath, files)
      return []
    }
    return files
  }

  global_setting.api.readFile = async (relPath: string) => {
    const file_content: string|unknown = await invoke("read_file", { path: relPath })
    if (typeof file_content !== 'string') {
      console.error("Invalid file content format")
      return null
    }
    return file_content
  }

  global_setting.api.writeFile = async (relPath: string, content: string, _isappend?: boolean): Promise<boolean> => {
    let isappend: boolean = _isappend || false;
    return await invoke("write_file", { path: relPath, content, isappend });
  }

  global_setting.api.deleteFile = async (relPath: string): Promise<boolean> => {
    return await invoke("delete_file", { path: relPath });
  }

  const CONFIG_PATH = './am-user.toml' // TODO 放C盘会更利于软件版本更新时复用

  global_setting.api.loadConfig = async (): Promise<boolean|string> => {
    // 后续内容也可以用 
    // ```
    // invoke("config_read_to_json", {...})`
    // global_setting.config = ...
    // ```
    // 来代替
    // 不过这里还要支持纯文本编辑配置文件，所以就使用前端解析方案了

    // 读取配置文件
    let file_content: string = ''
    try {
      const result = await global_setting.api.readFile(CONFIG_PATH)
      if (typeof result !== 'string') {
        throw new Error("Invalid file content format")
      }
      file_content = result
    } catch (error) {
      console.warn("没配置文件，将自动生成一个")
    }
  
    // 如果没有配置文件则生成一个默认值的配置文件
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

    // 解析，并应用配置文件
    try {
      const new_config = toml_parse(file_content)['config']
      if (!new_config || typeof new_config !== 'object') {
        throw new Error("Invalid config format")
      }
      // TODO 可以动态更新一些页面信息 (暂时通过告知用户设置后需要重启来实现)
      global_setting.config = {...global_setting.config, ...new_config}
    } catch (error) {
      console.error('配置解析失败，请检查格式是否正确', error)
      return ''
    }
    
    return file_content
  }

  global_setting.api.saveConfig = async (): Promise<boolean> => {
    await invoke("config_write_from_json", {
      path: CONFIG_PATH,
      newJson: { config: global_setting.config }
    })
    return true
  }

  // 后端为 Tauri 时使用
  // 参考: https://v2.tauri.app/zh-cn/plugin/http-client/ https://v2.tauri.app/zh-cn/reference/javascript/http/
  // 这里的 tauri_fetch 是一个 rust 后端 api，试图与 fetch web api 尽量接近和兼容，一般情况下可当作 fetch 使用
  global_setting.api.urlRequest = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
    try {
      const response = await tauri_fetch(conf.url, {
        method: conf.method || 'GET',
        headers: conf.headers,
        body: conf.body,
      });

      // 返回值适配
      if (!response.ok) {
        // 处理 HTTP 错误状态 (例如 404, 500)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text(); // .data?
      
      // 尝试解析 JSON，如果失败则回退
      let json = null;
      if (conf.isParseJson) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          json = null;
        }
      }
      return {
        code: 0,
        data: {
          text: text,
          json: json,
          originalResponse: response,
        },
      };
    } catch (error: any) {
      console.error('Fetch request failed:', error);
      return {
        code: -1,
        msg: error?.message || 'An unknown error occurred in fetch request.',
        data: {
          text: '',
          originalResponse: error
        }
      };
    }
  }

  // 后端为 nodejs 时使用 (这里不要使用tauri的fetch)
  // const old = async (conf: UrlRequestConfig): Promise<UrlResponse | null> => {
  //   try {
  //     const response = await fetch(conf.url, {
  //       method: conf.method || 'GET',
  //       headers: conf.headers,
  //       body: conf.body,
  //     });
  // 
  //     // 返回值适配
  //     if (!response.ok) {
  //       // 处理 HTTP 错误状态 (例如 404, 500)
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //     const text = await response.text();
  // 
  //     // 尝试解析 JSON，如果失败则回退
  //     let json = null;
  //     if (conf.isParseJson) {
  //       try {
  //         json = JSON.parse(text);
  //       } catch (e) {
  //         json = null;
  //       }
  //     }
  //     return {
  //       code: 0,
  //       data: {
  //         text: text,
  //         json: json,
  //         originalResponse: response,
  //       },
  //     };
  //   } catch (error: any) {
  //     console.error('Fetch request failed:', error);
  //     return {
  //       code: -1,
  //       msg: error?.message || 'An unknown error occurred in fetch request.',
  //       data: {
  //         text: '',
  //         originalResponse: error
  //       }
  //     };
  //   }
  // }
}

// 这样的toml配置会有注释，如果用 global_setting.config 转toml则没注释
// 会自动与 global_setting.config 合并
const DEFAULT_TOML = `\
[config]
language = "English"        # 语言 'auto'|'English'|'中文'|string
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

# 工具栏列表。可控制显示是否显示与显示顺序，为空则默认全显示
toolbar_list = []
# 多级菜单列表。细节同上
context_menu_list = []
`
