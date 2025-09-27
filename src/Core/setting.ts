export const global_setting: {
  env: 'app' | 'obsidian-plugin' | 'browser-plugin' | 'vscode-plugin',
  // 是否启用自动聚焦到输入框 (目前仅app环境有效)。分两种模式: 不聚焦使用和聚焦使用
  // - 聚焦使用: 当需要使用菜单中input时只能使用这种方式，app也只能用这种方式 (切换窗口了)
  //   输出文本时需要先隐藏窗口 -> 等待聚焦转移和光标归位回原位 -> 再输出文本
  // - 不聚焦使用: 需要阻止任何点击事件避免聚焦转移
  //   可以在聚焦不改变的情况下直接输出文本，少了等待理论上会更快，而且能在窗口上多次操作和多次输出
  focusStrategy: true | false
} = {
  env: 'app',
  focusStrategy: true
}
