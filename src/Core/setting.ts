import type { UrlRequestConfig, UrlResponse } from '../Type'
import DOMPurify from 'dompurify';

/** 全局设置
 * 会设置 set, get 方法，请使用 Object.assign 的方式修改对象而非直接赋值
 */
export const global_setting: {
  platform: 'app' | 'obsidian-plugin' | 'browser-plugin' | 'vscode-plugin',
  isDebug: boolean,
  /**
   * 是否启用自动聚焦到输入框 (目前仅app环境有效)。分两种模式: 不聚焦使用和聚焦使用
   * - 聚焦使用: 当需要使用菜单中input时只能使用这种方式，app也只能用这种方式 (切换窗口了)
   *   输出文本时需要先隐藏窗口 -> 等待聚焦转移和光标归位回原位 -> 再输出文本
   * - 不聚焦使用: 需要阻止任何点击事件避免聚焦转移
   *   可以在聚焦不改变的情况下直接输出文本，少了等待理论上会更快，而且能在窗口上多次操作和多次输出
   * 
   * @deprecated 目前不再使用该选项。而是使用主动召唤则抢焦点，选中文本自动弹出则不抢焦点的方式。
   */
  focusStrategy: true | false,
  /** 跨平台的、user的 通用配置
   * 
   * - 这里是通用模块，不跨平台的不存这
   * - 这里是可序列化的配置 (可对应配置文件)，不可序列化的不放在这
   * - 用户不可配置的硬编码也不放在这
   * 
   * 该内容修改后，应该同步到配置文件
   */
  config: {
    language: 'auto'|'English'|'中文'|string, // 语言
    // 弃用: 根据召唤面板的方式自动选择。例如选中文本自动弹出菜单时通常不抢焦点，主动召唤通常需要抢焦点
    // 抢焦点模式 = 默认聚焦+默认置顶。隐藏条件: 失焦、直接点击窗口的#main/body、点击菜单项
    // 不抢焦点模式 = 不聚焦+默认置顶。隐藏条件: 失焦[-]、直接点击窗口的#main/body、点击菜单项、窗口外点击[+]
    // panel_focus_mode: boolean, // 新窗口的聚焦模式: 聚焦到新窗口/不聚焦到新窗口
    // panel_default_always_top: boolean, // 默认置顶窗口/不置顶窗口 (pin键是临时切换)

    pinyin_index: boolean, // 是否为中文key自动构建拼音索引
    pinyin_first_index: boolean, // 是否为中文key自动构建拼音首字母索引
    // 搜索引擎类型，'reverse'|'trie' (模糊匹配/倒序 | 前缀树)
    // TODO 新选项: 混合使用策略
    search_engine: 'reverse'|'trie',
    // 查询结果的首页显示数
    // 对于模糊匹配引擎: 是显示数，目前不影响搜索引擎的查询数量，即只影响渲染
    // 对于前缀树引擎: 是查询数
    // 暂时以滚动形式显示，不支持类似输入法的通过 '方括号' 翻页，否则这个数量可以限制更多
    search_limit: number,

    // HTTP 服务端口。
    // 用于实现同设备上不同环境的通信。
    // 需要保证本地应用、Obsidian 插件、浏览器扩展等不同环境的端口一致，且不被占用。
    server_port: number,
    // 在线词库来源 'gitee'|'github'
    dict_online_source: 'gitee'|'github',
    // 配置路径。
    // 注意主配置文件不走这个路径，这个配置路径仅针对于副配置
    // 主配置:
    // - app:       使用 am-user.toml
    // - obsidian:  使用插件文件夹的 data.json
    // 
    // 注意: 不要自指
    // TODO App 版本可以考虑放C盘，使软件更新后更易于复用
    config_paths: string,
    // 词库路径列表。在debug模式下不使用这个路径，而是硬编码
    dict_paths: string,
    // 记录笔记的基础路径
    note_paths: string,
    // 缓存临时数据的路径 (Obsidian 和 App 版本中默认值不同)
    cache_paths: string,
    /** 发送文本的方式。
     * 'keyboard'|'clipboard'|'auto'
     * enigo/keyboard为模拟键盘输入，clipboard为复制到剪贴板,
     * 建议为 clipboard (或 auto，auto根据文本长度和是否有换行符决定)
     * 'keyboard' 好处是快，适合明确的短文本，缺点是不适合复杂情况或未知情况，例如:
     * - 被字符转义: QQ等环境，当把一个 emoji 拆成两字符输出，然后被转义成两个用于表示未知的字符，如 '😀' -> '��'
     * - 输出长文本后难以撤销: 撤销操作会分多次运行，具体示编辑器的一些刷新机制或优化有关 (vscode等通常按字符，ob等按单词撤回)
     * - 受自动补全和缩进影响: 如输出emoji中，由于经常包含括号和双引号等符号，可能被自动补全成一对。又如自动换行，可能会被自动缩进，导致重复缩进
     * 仅当你清楚以上情况，总是输出短语时，才建议使用 keyboard
     * 
     * TODO: auto 方式应该还需要判断是否有某些特殊字符，来决定是否使用 keyboard，因为有些环境（如微信）即使是短文本也不适合用 keyboard 方式。
     * TODO: 后续是否有可能不同的字典/词表用不同的发送方式? 例如有些词表用来表示按键操作组
     */
    send_text_method: 'keyboard'|'clipboard'|'auto',
    // app黑名单，其中 'obsidian' 主要针对同时安装anymenu ob插件版和app版的情况。ob进黑名单则插件优先 (推荐)，否则app版优先
    app_black_list: string[],
    // app是否使用高级快捷键，TODO 未起作用
    app_ad_shortcut: boolean,
    toolbar_list: string[],
    context_menu_list: string[],
    auto_show_toolbar_on_select: boolean, // 选中文本时是否自动显示工具栏

    // 快捷键与面板/操作的解耦。此处是普通快捷键，会被黑白名单影响
    // 这里的2是历史遗留问题。因为该选项以前是对象，现在改数组后避免和以前用户的选项合并导致冲突
    // 注意: 划词弹出模式不受 is_focus 影响，强制为 false
    panel_preset2: [
      // 注意位置模式: 若 cursor 失败会自动降级为 mouse
      // 建议: 搜索+工具栏+多极菜单。主动唤出的显示项
      {
        key: string,
        list: string[],
        is_focus: boolean,
        position_mode: 'center'|'cursor'|'mouse',
      },
      // 建议: 搜索+工具栏。自动唤出的显示项
      {
        key: string,
        list: string[],
        is_focus: boolean,
        position_mode: 'center'|'cursor'|'mouse',
      },
      // 建议: miniEditor / info
      {
        key: string,
        list: string[],
        is_focus: boolean,
        position_mode: 'center'|'cursor'|'mouse',
      }
    ],

    theme: string,
    darkmode: 'light'|'dark'|'auto',
  },
  // 外观相关的配置
  // css variables
  // TODO
  //   这里的设计可能还是不对，后面应该弄一个独立的文件可视化编辑模块出来
  //   处理包括普通配置和css变量配置的东西
  // 
  //   当然。独立存储 css 覆盖文件，以及更改 css 是两种不同的做法。
  //     为了更好地更新主题，也为了更好恢复默认值，和更少的破坏，一般是前者。
  //   前者的缺点是耦合，且要在面板加载后覆盖掉前者。
  config_css_vars: {
    varName: string, name?: string, value: string, darkValue?: string
  }[],
  // 本地的词典/插件管理配置
  config_plugins: {
    path: string, // 相对于 dict_paths 的路径
    version?: string,
    enabled: boolean,
  }[],
  // 非配置文件的配置，可能未实现仅占位，可能非持续久化的
  config_: {
    is_auto_startup: boolean, // 是否开机自启
    pinyin_method: 'pinyin', //  目前仅支持普通拼音，后续可能加入其他拼音方案甚至形码
    menu_position: 'cursor'|'mouse'|'screen', // 窗口出现位置，插入符光标优先|鼠标位置|屏幕中心
  },
  // 运行时状态
  state: {
    language: 'en'|'zh'|'zh-TW'|string // 语言 (字典语言标志: 本地化语言名转标志, 不存在语言转en，自动选择转实际语言)
    isDark: boolean, // 明暗模式
    isPin: boolean, // 置顶面板和子面板 (主要用于debug，避免面板在调试过程中失焦而隐藏)
    editor_engine: 'codeblock'|'cm', // mini 编辑器渲染引擎 (可运行中切换)
    selectedText?: string, // 当前选中的文本 (每次展开菜单时更新)
    infoText: string, // 当前信息文本 (仅debug模式会注册info面板，从而才会使用这里)
    activeAppName?: string, // 当前激活的应用名称 (每次窗口聚焦改变时更新)
    activeDocTitle?: string, // 当前文档/页面标题 (每次展开菜单时更新)
    activeDocUrl?: string, // 当前文档/页面链接 (每次展开菜单时更新)
  },
  /**
   * 适配在各种平台及环境中，会有所不同的一些api
   * 
   * 如:
   * 
   * - 读写文件，可能是: 开发阶段的node fs模块、tauri后端、obsidian api等
   * - 输出文本，可能是: windows环境sendText api、剪贴板、
   *   获得编辑器对象并使用editor api (又可能是通用浏览器环境、obsidian api、其他) 等
   * 
   * 所有的 relPath 均基于 "不基于" config.dict_paths 目录进行，如果要进 dict_paths 自行拼接
   * 
   * 通用 api 需要满足能在通用环境下执行，尽管不一定存在在通用环境下调用的情况
   */
  api: {
    saveInnerHTML: (el: HTMLElement, content: string) => void
    isFolder: (relPath: string) => Promise<boolean>
    readFile: (relPath: string) => Promise<string | null>
    readFolder: (relPath: string, recursion_depth?: number) => Promise<string[]>
    writeFile: (relPath: string, content: string, is_append?: boolean) => Promise<boolean> // 需实现自动创建目录
    deleteFile: (relPath: string) => Promise<boolean>
    // 从配置文件同步的 global config 对象 (注意 app 和 obsidian 版配置文件不同)
    // 如果没有文件，则自动生成默认配置文件
    // string 类型是为了 toml 以 raw 形式读取
    loadConfig: () => Promise<boolean|string>
    // 从 global config 对象同步到配置文件 (注意 app 和 obsidian 版配置文件不同)
    saveConfig: () => Promise<boolean>
    getCursorXY: () => Promise<{ x: number, y: number }>
    getScreenSize: () => Promise<{ width: number, height: number }>
    getInfo: () => Promise<string | null> // 主要用于调试
    notify: (message: string) => Promise<void> // 显式通知用户 (notify notification toast alert alert ...)
    pin: (isPin?: boolean) => Promise<void> // 切换窗口/面板的置顶状态，或拖拽窗口
    sendText: (text: string, mode?: 'IMG_MODE') => Promise<void>
    saveToClipboard: (text: string) => Promise<void>
    // 统一的网络请求接口，并简化try/catch
    // 需要注意的是: 有前端版本和后端版本
    // 在 Obsidian 和 App 版本中，都是后端版本，即可以无视浏览器的同源策略 (CORS 限制)
    // 而这需要注意风险。如果要限制: 记得白名单要保留几个该项目需要用到的 url:
    // { "url": "https://github.com/*" },
    // { "url": "https://*.github.com/*" },
    // { "url": "https://gitee.com/*" },
    // { "url": "https://api.gitee.com/*" },
    urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null>
    getSystemIsDark: () => boolean // 没有 dark 标识则默认是 light，不存在无法检测出的情况
  },
  /** 通常是 any|null 类型，特有环境临时存的东西，部分环境使用而部分环境用不着 */
  other: {
    obsidian_plugin: any|null,
    obsidian_ctx: any|null, // type: MarkdownPostProcessorContext
    obsidian_run_command: null|((commandId: string) => Promise<void>),
    renderMarkdown: null|((markdown: string, el: HTMLElement, ctx?: any) => Promise<void>),
    // @param pos 不填表示沿用之前的位置
    app_show: (pos?: 'cursor'|'center', panel_list?: string[]) => Promise<void>,
    app_hide: (panel_list?: string[], forceBlurApp?: boolean) => Promise<void>,
    // (特殊) 本地资源协议
    // 最终生成的 URL 类似：https://asset.localhost/path_encode...
    app_convertFileSrc: (relPath: string) => Promise<string>,
    // (特殊) 用于 Tauri 多窗口资源同步
    app_onChange: () => Promise<void>,
    app_offChange: () => Promise<void>,
  }
} = {
  platform: 'app',
  isDebug: false,
  focusStrategy: true,
  config: {
    "language": "auto",

    "pinyin_index": true,
    "pinyin_first_index": true,
    "search_engine": "reverse",
    "search_limit": 500,

    "server_port": 41667,
    "dict_online_source": "github",
    "config_paths": "./config/",// 在 obsidian 版本中，这里的默认值会是 "./<.obsidian>/plugins/any-menu/config/"
    "dict_paths": "./dict/",    // 在 obsidian 版本中，这里的默认值会是 "./<.obsidian>/plugins/any-menu/dict/"
    "note_paths": "./notes/",   // 通常放置生成结果 (markdown等)，备注个人开发环境常用: "./notes/" or "H:/Git/Private/Group_Note/MdNote_Public/note/"
    "cache_paths": "./cache/",  // 在 obsidian 版本中，这里的默认值会是 "./<.obsidian>/plugins/any-menu/cache/"
    "send_text_method": "clipboard",
    "app_black_list": ["- Obsidian "],
    "app_ad_shortcut": true,

    "toolbar_list": [],
    "context_menu_list": [],
    "auto_show_toolbar_on_select": false,

    "panel_preset2": [
      {
        "key": "Alt+A",
        "list": ["search", "toolbar", "menu"],
        "is_focus": true,
        "position_mode": "cursor",
      },
      {
        "key": "Alt+S",
        "list": ["search", "toolbar"], // ["miniEditor"]
        "is_focus": true,
        "position_mode": "cursor",
      },
      {
        "key": "Alt+D",
        "list": ["info"],
        "is_focus": true,
        "position_mode": "cursor",
      },
    ],

    "theme": "default",
    "darkmode": "auto",
  },
  config_css_vars: [], // 其初始定义放置于末尾
  config_plugins: [],
  config_: {
    is_auto_startup: false,
    pinyin_method: 'pinyin',
    menu_position: 'cursor',
  },
  state: {
    language: 'en',
    isDark: false,
    isPin: false,
    editor_engine: 'codeblock',
    selectedText: undefined,
    infoText: '',
    activeAppName: undefined,
    activeDocTitle: undefined,
    activeDocUrl: undefined,
  },
  api: {
    // 在 Obsidian 中可选择使用其提供的 sanitizeHTMLToDom 方法替换之
    saveInnerHTML: (el: HTMLElement, string: string) => {
      const safeNode = DOMPurify.sanitize(string, {
        USE_PROFILES: { html: true, svg: true },
        // 关键：让它返回 DOM 节点而不是字符串，并且不使用 innerHTML。否则 obsidian 那个自动 review 会说风险
        RETURN_DOM_FRAGMENT: true
      });
      el.replaceChildren(safeNode);
    },
    isFolder: async () => { console.error("需实现 api.isFolder 方法"); return false },
    readFile: async () => { console.error("需实现 api.readFile 方法"); return null },
    readFolder: async () => { console.error("需实现 api.readFolder 方法"); return [] },
    writeFile: async () => { console.error("需实现 api.writeFile 方法"); return false },
    deleteFile: async () => { console.error("需实现 api.deleteFile 方法"); return false },
    loadConfig: async (): Promise<boolean|string> => {
      const loadConfig_ = async (file_path: string, bindObj?: object): Promise<boolean> => {
        let file_content: string|null = null
        // 读取配置文件
        try {
          const result = await global_setting.api.readFile(file_path)
          if (typeof result !== 'string') {
            throw new Error("Invalid file content format")
          }
          file_content = result
        } catch (error) {
          console.warn("没配置文件，将自动生成一个")
          file_content = null
        }
        // 解析，并应用配置文件
        if (!file_content) return false
        try {
          const new_config: object = JSON.parse(file_content)
          if (!new_config || typeof new_config !== 'object') {
            throw new Error("Invalid config format")
          }
          if (bindObj) {
            Object.assign(bindObj, new_config)
          }
          return true
        } catch (error) {
          console.error('配置解析失败，请检查格式是否正确', error)
          return false
        }
      }

      // 并行读取三个配置文件，并尝试更新配置对象
      const [ret1, ret2, ret3] = await Promise.all([
        loadConfig_(global_setting.config.config_paths + 'config.json',
          global_setting.config),
        loadConfig_(global_setting.config.config_paths + 'config_css_vars.json',
          global_setting.config_css_vars),
        loadConfig_(global_setting.config.config_paths + 'config_plugins.json',
          global_setting.config_plugins),
      ]);

      // TODO 设置更新后，可以动态更新一些页面信息
      //   暂时不支持这点，许多设置必须要重启后才能生效
      // 无论如何均重新保存一遍。避免在开发更新过程中，添加新的选项
      const ret4 = await global_setting.api.saveConfig()

      return ret1 && ret2 && ret3 && ret4
    },
    saveConfig: async (): Promise<boolean> => {
      const saveConfig_ = async(file_path: string, target_obj: object): Promise<void> => {
        let newStr: string
        if (Array.isArray(target_obj)) {
          newStr = '[\n' + target_obj.map(item => JSON.stringify(item)).join(',\n') + '\n]'
        }
        else {
          newStr = JSON.stringify(target_obj, undefined, 2)
        }
        void global_setting.api.writeFile(file_path, newStr)
      }

      // 并行写入三个配置文件
      void saveConfig_(global_setting.config.config_paths + 'config.json',
        global_setting.config)
      void saveConfig_(global_setting.config.config_paths + 'config_css_vars.json',
        global_setting.config_css_vars)
      void saveConfig_(global_setting.config.config_paths + 'config_plugins.json',
        global_setting.config_plugins)

      return true
    },
    getCursorXY: async () => { console.error("需实现 api.getCursorXY 方法"); return { x: -1, y: -1 } },
    getScreenSize: async () => { console.error("需实现 api.getScreenSize 方法"); return { width: -1, height: -1 } },
    getInfo: async () => { console.error("需实现 api.getInfo 方法"); return null },
    notify: async (message: string) => {
      console.warn("未实现 api.notify 方法，将使用 console.warn 替代");
      console.warn(message)
    },
    pin: async () => { console.error("需实现 api.pin 方法") },
    sendText: async (text: string) => {
      console.warn("未实现 api.sendText 方法，将使用通用浏览器行为")

      // 通用 browser 环境
      // 获取当前焦点元素（通常是输入框、文本区域或可编辑元素）
      // 注意:
      // - 非 Tauri 程序中，我们可能采用了非失焦的方式展开菜单
      // - 但 Tauri 程序中，我们一般采用了失焦的方式展开菜单
      const activeElement: Element|null = document.activeElement

      if (activeElement) { // 检查该元素为可编辑的输入框或文本域，则直接输出
        await global_setting.api.sendText(text)
      } else { // 否则存到剪切版
        console.warn('没有活动的元素，将demo文本生成到剪贴板')
        navigator.clipboard.writeText(text).catch(err => console.error("Could not copy text: ", err))
      }
    },
    saveToClipboard: async (text: string) => {
      // 默认降级处理、通用浏览器环境
      try {
        await navigator.clipboard.writeText(text)
      } catch (err) {
        console.error("Failed to save to clipboard: ", err)
      }
    },
    urlRequest: async () => { console.error("需实现 api.urlRequest 方法"); return null },
    getSystemIsDark: () => { console.error("需实现 api.getSystemIsDark 方法"); return false },
  },
  other: {
    obsidian_plugin: null,
    obsidian_ctx: null,
    obsidian_run_command: async (): Promise<void> => { console.warn("非obsidian环境不支持此操作") },
    renderMarkdown: async (): Promise<void> => { console.warn("非obsidian环境不支持此操作") },
    app_show: async (): Promise<void> => { console.warn("非app环境不支持此操作") },
    app_hide: async (): Promise<void> => { console.warn("非app环境不支持此操作") },
    app_convertFileSrc: async (): Promise<string> => { console.warn("非app环境不支持此操作"); return '[error]' },
    app_onChange: async (): Promise<void> => { console.warn("非app环境不支持此操作，或未定义") },
    app_offChange: async (): Promise<void> => { console.warn("非app环境不支持此操作，或未定义") },
  }
}

// TODO 这里如果更新扩展了，新默认值应该会和用户的老配置冲突
global_setting.config_css_vars = [
  { varName:'--am-text-color',        value:'#1E1E1E', darkValue:'#f6f6f6', name:'文本色' },
  { varName:'--am-bg-color',          value:'#f6f6f6', darkValue:'#2f2f2f', name:'背景色' },
  { varName:'--am-bd-color',          value:'#e0e0e0', darkValue:'#34343f', name:'边框色' },

  { varName:'--am-pre-text-color',    value:'#5c5c5c', darkValue:'#e3e3e3', name:'文本框文本色' },
  { varName:'--am-pre-bg-color',      value:'#ffffff', darkValue:'#282828', name:'文本框背景色' }, // input select textarea 等
  { varName:'--am-pre-bd-color',      value:'#e5e5e5', darkValue:'#383839', name:'文本框边框色' },
  { varName:'--am-pre-bg-hlcolor',    value:'#005eb5', darkValue:'#0078d7', name:'文本框边框高亮色' },

  { varName:'--am-bright-color',      value:'#23A8F2', darkValue:'#23A8F2', name:'文本高亮色' },
  { varName:'--am-bright-bg-color',   value:'#4a89dc', darkValue:'#4a89dc', name:'背景高亮色' },

  { varName:'--ab-tab-root-tx-color', value:'#5c5c5c', darkValue:'#9e9e9e', name:'标签栏文本色' },
  { varName:'--ab-tab-root-bg-color', value:'#ffffff', darkValue:'#0d1117', name:'标签栏背景色' },
  { varName:'--ab-tab-root-bd-color', value:'#e0e0e0', darkValue:'#34343f', name:'标签栏边框色' },
  { varName:'--ab-tab-root-hv-color', value:'#d7d7d7', darkValue:'#363639', name:'标签栏悬停色' },

//{ varName:'--ab-menu-text-color',   value:'#000000', darkValue:'#CCCCCC', name:'文本色' },
//{ varName:'--ab-menu-bg-color',     value:'#ffffff', darkValue:'#1B1B1B', name:'背景色' },
]

// 此处实现: 设置时额外进行其他动作 + 保持 config 可干净地JSON序列化的特征

/*const key_isDark = Symbol('isDark');
Object.defineProperty(global_setting.state, 'isDark', {
  get() {
    return this[key_isDark];
  },
  set(newValue) {
    document.documentElement.classList.toggle('theme-dark', newValue);
    document.documentElement.classList.toggle('theme-light', !newValue);
    this[key_isDark] = newValue;
  },
  enumerable: true, // 自身会出现在序列化结果中
  configurable: true,
})*/

// 可自动处理 state.isDark、html class 管理
const key_darkmode = Symbol('darkmode');
Object.defineProperty(global_setting.config, 'darkmode', {
  get() {
    return this[key_darkmode];
  },
  set(darkmode) {
    // config 管理
    this[key_darkmode] = darkmode;

    // state 管理
    let isDark: boolean
    if (darkmode === 'dark') isDark = true
    else if (darkmode === 'light') isDark = false
    else isDark = global_setting.api.getSystemIsDark()
    global_setting.state.isDark = isDark

    // class 管理。只影响组件，前缀避免浏览器环境中和页面主题冲突
    document.documentElement.classList.toggle('am-theme-dark', isDark);
    document.documentElement.classList.toggle('am-theme-light', !isDark);
  },
  enumerable: true, // 自身会出现在序列化结果中
  configurable: true,
})
