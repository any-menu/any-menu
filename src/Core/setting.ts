export const global_setting: {
  env: 'app' | 'obsidian-plugin' | 'browser-plugin' | 'vscode-plugin',
  /**
   * 是否启用自动聚焦到输入框 (目前仅app环境有效)。分两种模式: 不聚焦使用和聚焦使用
   * - 聚焦使用: 当需要使用菜单中input时只能使用这种方式，app也只能用这种方式 (切换窗口了)
   *   输出文本时需要先隐藏窗口 -> 等待聚焦转移和光标归位回原位 -> 再输出文本
   * - 不聚焦使用: 需要阻止任何点击事件避免聚焦转移
   *   可以在聚焦不改变的情况下直接输出文本，少了等待理论上会更快，而且能在窗口上多次操作和多次输出
   */
  focusStrategy: true | false
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
    sendText: (text: string) => Promise<void>
  }
} = {
  env: 'app',
  focusStrategy: true,
  api: {
    readFile: async () => { console.error("需实现 readFile 方法"); return '' },
    getCursorXY: async () => { console.error("需实现 getCursorXY 方法"); return { x: -1, y: -1 } },
    sendText: async () => { console.error("需实现 sendText 方法") }
  }
}
