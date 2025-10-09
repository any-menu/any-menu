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
    pinyin_index: boolean, // 是否为中文key自动构建拼音索引
    pinyin_first_index: boolean, // 是否为中文key自动构建拼音首字母索引
    // 搜索引擎类型，'reverse'|'trie' (模糊匹配/倒序 | 前缀树)
    // TODO 新选项: 混合使用策略
    search_engine: 'reverse'|'trie',
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
    // 查询结果的首页显示数
    // 对于模糊匹配引擎: 是显示数，目前不影响搜索引擎的查询数量，即只影响渲染
    // 对于前缀树引擎: 是查询数
    // 暂时以滚动形式显示，不支持类似输入法的通过 '方括号' 翻页，否则这个数量可以限制更多
    search_limit: number,
    // 词库路径列表。在debug模式下不使用这个路径，而是硬编码
    dict_paths: string,
  },
  config_: { // 非配置文件的配置，可能未实现仅占位，可能非持续久化的
    is_auto_startup: boolean, // 是否开机自启
    pinyin_method: 'pinyin', //  目前仅支持普通拼音，后续可能加入其他拼音方案甚至形码
    menu_position: 'cursor'|'mouse'|'screen', // 窗口出现位置，插入符光标优先|鼠标位置|屏幕中心
  },
  // 运行时状态
  state: {
    selectedText?: string, // 当前选中的文本 (每次展开菜单时更新)
  },
  /**
   * 适配在各种平台及环境中，会有所不同的一些api
   * 
   * 如:
   * 
   * - 读写文件，可能是: 开发阶段的node fs模块、tauri后端、obsidian api等
   * - 输出文本，可能是: windows环境sendText api、剪贴板、
   *   获得编辑器对象并使用editor api (又可能是通用浏览器环境、obsidian api、其他) 等
   */
  api: {
    readFile: (path: string) => Promise<string | null>
    readFolder: (path: string) => Promise<string[]>
    getCursorXY: () => Promise<{ x: number, y: number }>
    getScreenSize: () => Promise<{ width: number, height: number }>
    sendText: (text: string) => Promise<void>
    urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null> // 统一的网络请求接口，并简化try/catch
  },
  /** 通常是any|null类型，是特有环境临时存的东西 */
  other: {
    obsidian_plugin: any|null,
    renderMarkdown: null|((markdown: string, el: HTMLElement, ctx?: any) => Promise<void>),
  }
} = {
  env: 'app',
  isDebug: true,
  focusStrategy: true,
  config: {    
    pinyin_index: true,
    pinyin_first_index: true,
    search_engine: 'reverse',
    send_text_method: 'clipboard',
    search_limit: 500,
    dict_paths: './dict',
  },
  config_: {
    is_auto_startup: false,
    pinyin_method: 'pinyin',
    menu_position: 'cursor',
  },
  state: {
    selectedText: undefined
  },
  api: {
    readFile: async () => { console.error("需实现 api.readFile 方法"); return null },
    readFolder: async () => { console.error("需实现 api.readFolder 方法"); return [] },
    getCursorXY: async () => { console.error("需实现 api.getCursorXY 方法"); return { x: -1, y: -1 } },
    getScreenSize: async () => { console.error("需实现 api.getScreenSize 方法"); return { width: -1, height: -1 } },
    sendText: async () => { console.error("需实现 api.sendText 方法") },
    urlRequest: async () => { console.error("需实现 api.urlRequest 方法"); return null },
  },
  other: {
    obsidian_plugin: null,
    renderMarkdown: async (): Promise<void> => {},
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
