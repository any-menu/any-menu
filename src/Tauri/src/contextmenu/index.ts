import { invoke } from "@tauri-apps/api/core"

import { ABContextMenu2 } from "../contextmenu/ABContextMenu2"
import { AMSearch } from "../../../Core/seach"
import { root_menu_demo, root_menu_callout } from "../../../Core/contextmenu/demo"
import { SEARCH_DB } from "../../../Core/seach/SearchDB"

/// 初始化菜单
export async function initMenu(el: HTMLDivElement) {
  // #region key-value 数据

  ;(async () => {
    let result: string | unknown
    try {
      result = await invoke("read_file", {
        // 路径可能有问题?
        path: '../../../docs/demo/emoji.txt',
      })
    } catch (error) {
      console.error("Failed to read file:", error)
    }

    // 非Tauri环境下的测试调试数据
    if (typeof result !== 'string') {
      result = 'testE	🙂‍↔️\ntest1\t读取词库文件失败\ntest2\ttest222\ntest3\ttest123超长测试超长测试超长测试超长测试超长测试5超长测试超长测试超长测试'
      // return
    }
    
    // 解析csv内容
    // const kv_emoji: Record<string, string> = {}
    // const lines = result.split('\n').filter(line => {
    //   return line.trim() !== '' && !line.startsWith('#') // 过滤空行和注释行
    // })
    // for (const line of lines) {
    //   const [label, value] = line.split('	'); // 没有确保安全性
    //   kv_emoji[label] = value.trim();
    // }
    // console.log('kv_obj', Object.keys(kv_emoji).length)

    // 解析csv内容2
    SEARCH_DB.init_trie_by_csv(result as string, 'emoji')
  })();

  // #endregion

  // #region 搜索框
  AMSearch.factory(el)
  // #endregion

  const myMenu = new ABContextMenu2(el)

  // myMenu.append_headerEditor('header test', ()=>{})

  // #region 多级展开菜单
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
      label: '代码片段',
      children: []
    },
    {
      label: '自定义短语',
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
    },
    {
      label: '表情包', // 这功能会用到本体存储，app版才支持
      children: [
        { label: "Too many. You should use the search bar." }
      ]
    },
  ])

  // #endregion

  // myMenu.attach(el)
}
