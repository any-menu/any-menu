import { invoke } from "@tauri-apps/api/core"

import { ABContextMenu2 } from "../contextmenu/ABContextMenu2"
import { root_menu_demo, root_menu_callout } from "../../../Core/contextmenu/demo"

/// 初始化菜单
export async function initMenu(el: HTMLDivElement) {
  const myMenu = new ABContextMenu2(el)
  myMenu.append_data([
    {
      label: 'Markdown',
      children: [
        { label: "表格" },
        { label: "引用" },
        { label: "代码块" },
        { label: "公式块" },
        { label: "有序列表" },
        { label: "无序列表" },
        { label: "---" },
        { label: "标题" },
        { label: "分割线" },
        { label: "粗体" },
        { label: "斜体" },
      ]
    },
    {
      label: 'AnyBlock',
      children: root_menu_demo
    },
    {
      label: 'Callout',
      children: root_menu_callout
    },
    {
      label: 'Mermaid',
      children: []
    },
    {
      label: 'Plantuml',
      children: []
    },
    {
      label: 'Emoji',
      children: [
        { label: "Too many. You should use the search bar." }
      ]
    },
    {
      label: '颜表情',
      children: [
        { label: "Too many. You should use the search bar." }
      ]
    }
  ])




  const kv_emoji: Record<string, string> = {}
  const result = await invoke("read_file", {
    // 路径可能有问题?
    path: '../../../docs/demo/emoji.txt',
  })
  if (typeof result !== 'string') return
  // 解析csv内容
  const lines = result.split('\n').filter(line => {
    return line.trim() !== '' && !line.startsWith('#') // 过滤空行和注释行
  });
  for (const line of lines) {
    const [label, value] = line.split('	'); // 没有确保安全性
    kv_emoji[label] = value.trim();
  }

  console.log('kv_obj', Object.keys(kv_emoji).length)

  // myMenu.attach(el)
}
