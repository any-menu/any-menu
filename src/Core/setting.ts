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
  /** 跨平台的通用配置。这里是通用模块，不跨平台的不存这 */
  config: { 
    pinyin_index: boolean, // 是否为中文key自动构建拼音索引
    pinyin_first_index: boolean, // 是否为中文key自动构建拼音首字母索引
    search_engine: 'reverse'|'trie', // TODO 新选项: 混合使用策略
    /** 发送文本的方式。enigo/keyboard为模拟键盘输入，clipboard为复制到剪贴板,
     * 建议为 clipboard (或 auto，auto根据文本长度和是否有换行符决定)
     * 'keyboard' 好处是快，适合明确的短文本，缺点是不适合复杂情况或未知情况，例如:
     * - 被字符转义: QQ等环境，当把一个 emoji 拆成两字符输出，然后被转义成两个用于表示未知的字符，如 `😀` -> `��`
     * - 输出长文本后难以撤销: 撤销操作会分多次运行，具体示编辑器的一些刷新机制或优化有关 (vscode等通常按字符，ob等按单词撤回)
     * - 受自动补全和缩进影响: 如输出emoji中，由于经常包含 `( " '` 等符号，可能被自动补全成 `()`。又如自动换行，可能会被自动缩进，导致重复缩进
     * 仅当你清楚以上情况，总是输出短语时，才建议使用 keyboard
     * 
     * TODO: 后续是否有可能不同的字典/词表用不同的发送方式? 例如有些词表用来表示按键操作组
     */
    send_text_method: 'keyboard'|'clipboard'|'auto',
    // 查询结果的首页显示数
    // 对于模糊匹配引擎: 是显示数，目前不影响搜索引擎的查询数量，即只影响渲染
    // 对于前缀树引擎: 是查询数
    // 暂时以滚动形式显示，不支持类似输入法的通过 `[]` 翻页，否则这个数量可以限制更多
    search_limit: number,
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
    readFile: (path: string) => Promise<string | unknown>
    getCursorXY: () => Promise<{ x: number, y: number }>
    getScreenSize: () => Promise<{ width: number, height: number }>
    sendText: (text: string) => Promise<void>
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
    search_limit: 80,
  },
  api: {
    readFile: async () => { console.error("需实现 readFile 方法"); return '' },
    getCursorXY: async () => { console.error("需实现 getCursorXY 方法"); return { x: -1, y: -1 } },
    getScreenSize: async () => { console.error("需实现 getScreenSize 方法"); return { width: -1, height: -1 } },
    sendText: async () => { console.error("需实现 sendText 方法") }
  }
}
