export const global_setting: {
  env: 'app' | 'obsidian-plugin' | 'browser-plugin' | 'vscode-plugin',
  isDebug: boolean,
  /**
   * 是否启用自动聚焦到输入框 (目前仅app环境有效)。分两种模式: 不聚焦使用和聚焦使用
   * - 聚焦使用: 当需要使用菜单中input时只能使用这种方式，app也只能用这种方式 (切换窗口了)
   *   输出文本时需要先隐藏窗口 -> 等待聚焦转移和光标归位回原位 -> 再输出文本
   * - 不聚焦使用: 需要阻止任何点击事件避免聚焦转移
   *   可以在聚焦不改变的情况下直接输出文本，少了等待理论上会更快，而且能在窗口上多次操作和多次输出
   */
  focusStrategy: true | false,
  /** 跨平台的通用配置。
   * - 这里是通用模块，不跨平台的不存这
   * - 这里是可序列化的配置 (可对应配置文件)，不可序列化的不放在这
   * - 用户不可配置的硬编码也不放在这
   */
  config: {
    language: 'auto'|'English'|'中文'|string // 语言
    // 抢焦点模式 = 默认聚焦+默认置顶。隐藏条件: 失焦、直接点击窗口的#main/body、点击菜单项
    // 不抢焦点模式 = 不聚焦+默认置顶。隐藏条件: 失焦[-]、直接点击窗口的#main/body、点击菜单项、窗口外点击[+]
    panel_focus_mode: boolean, // 新窗口的聚焦模式: 聚焦到新窗口/不聚焦到新窗口
    panel_default_always_top: boolean, // 默认置顶窗口/不置顶窗口 (pin键是临时切换)

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
     * TODO: 后续是否有可能不同的字典/词表用不同的发送方式? 例如有些词表用来表示按键操作组
     */
    send_text_method: 'keyboard'|'clipboard'|'auto',
    // 在线词库来源 'gitee'|'github'
    dict_online_source: 'gitee'|'github',
    // 词库路径列表。在debug模式下不使用这个路径，而是硬编码
    dict_paths: string,
    // 记录笔记的基础路径
    note_paths: string,
    // app黑名单，其中 'obsidian' 主要针对同时安装anymenu ob插件版和app版的情况。ob进黑名单则插件优先 (推荐)，否则app版优先
    app_black_list: string[],
    // app是否使用高级快捷键，TODO 未起作用
    app_ad_shortcut: boolean,
  },
  config_: { // 非配置文件的配置，可能未实现仅占位，可能非持续久化的
    is_auto_startup: boolean, // 是否开机自启
    pinyin_method: 'pinyin', //  目前仅支持普通拼音，后续可能加入其他拼音方案甚至形码
    menu_position: 'cursor'|'mouse'|'screen', // 窗口出现位置，插入符光标优先|鼠标位置|屏幕中心
  },
  // 运行时状态
  state: {
    language: 'en'|'zh'|'zh-TW'|string // 语言 (字典语言标志: 本地化语言名转标志, 不存在语言转en，自动选择转实际语言)
    isPin: boolean, // 置顶面板和子面板 (主要用于debug，避免面板在调试过程中失焦而隐藏)
    editor_engine: 'codeblock'|'cm', // mini 编辑器渲染引擎 (可运行中切换)
    selectedText?: string, // 当前选中的文本 (每次展开菜单时更新)
    infoText: string, // 当前信息文本 (仅debug模式会注册info面板，从而才会使用这里)
    activeAppName: string, // 当前激活的应用名称 (每次窗口聚焦改变时更新)
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
   */
  api: {
    readFile: (relPath: string) => Promise<string | null>
    readFolder: (relPath: string) => Promise<string[]>
    writeFile: (relPath: string, content: string, is_append?: boolean) => Promise<boolean> // 需实现自动创建目录
    deleteFile: (relPath: string) => Promise<boolean>
    getCursorXY: () => Promise<{ x: number, y: number }>
    getScreenSize: () => Promise<{ width: number, height: number }>
    getInfo: () => Promise<string | null> // 主要用于调试
    sendText: (text: string) => Promise<void>
    urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null> // 统一的网络请求接口，并简化try/catch
  },
  /** 通常是any|null类型，是特有环境临时存的东西 */
  other: {
    obsidian_plugin: any|null,
    obsidian_ctx: any|null, // type: MarkdownPostProcessorContext
    renderMarkdown: null|((markdown: string, el: HTMLElement, ctx?: any) => Promise<void>),
    run_command_ob: null|((commandId: string) => Promise<void>),
  }
} = {
  env: 'app',
  isDebug: false,
  focusStrategy: true,
  config: {
    language: 'auto',
    panel_focus_mode: true,  // false为不抢焦点模式，true为抢焦点模式
    panel_default_always_top: true,

    pinyin_index: true,
    pinyin_first_index: true,
    search_engine: 'reverse',
    search_limit: 500,

    send_text_method: 'clipboard',
    dict_online_source: 'gitee',
    dict_paths: './dict/',  // obsidian 用户可能比较熟悉于 Template 文件夹
    note_paths: './notes/', // 备注个人开发环境常用: "./notes/" or "H:/Git/Private/Group_Note/MdNote_Public/note/"
    app_black_list: ['- Obsidian v'],
    app_ad_shortcut: true,
  },
  config_: {
    is_auto_startup: false,
    pinyin_method: 'pinyin',
    menu_position: 'cursor',
  },
  state: {
    language: 'en',
    isPin: false,
    editor_engine: 'codeblock',
    selectedText: undefined,
    infoText: '',
    activeAppName: '',
  },
  api: {
    readFile: async () => { console.error("需实现 api.readFile 方法"); return null },
    readFolder: async () => { console.error("需实现 api.readFolder 方法"); return [] },
    writeFile: async () => { console.error("需实现 api.writeFile 方法"); return false },
    deleteFile: async () => { console.error("需实现 api.deleteFile 方法"); return false },
    getCursorXY: async () => { console.error("需实现 api.getCursorXY 方法"); return { x: -1, y: -1 } },
    getScreenSize: async () => { console.error("需实现 api.getScreenSize 方法"); return { width: -1, height: -1 } },
    getInfo: async () => { console.error("需实现 api.getInfo 方法"); return null },
    sendText: async () => { console.error("需实现 api.sendText 方法") },
    urlRequest: async () => { console.error("需实现 api.urlRequest 方法"); return null },
  },
  other: {
    obsidian_plugin: null,
    obsidian_ctx: null,
    renderMarkdown: async (): Promise<void> => { console.warn("非obsidian环境不支持此操作") },
    run_command_ob: async (): Promise<void> => { console.warn("非obsidian环境不支持此操作") },
  }
}

/**
 * 请求配置接口
 */
export interface UrlRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: BodyInit | null;
  isParseJson?: boolean; // 是否尝试将响应解析为 JSON
}

/**
 * 响应数据接口
 */
export interface UrlResponseData {
  text: string;
  json?: any;
  originalResponse: any; // 原始响应对象，用于调试
  // 可能还有 arrayBuffer headers json status text
}

/**
 * 统一响应接口
 */
export interface UrlResponse {
  code: number; // 0 表示成功, -1 表示失败
  data?: UrlResponseData;
  msg?: string;
}
