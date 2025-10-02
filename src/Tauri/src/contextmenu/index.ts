import { invoke } from "@tauri-apps/api/core"

import { ABContextMenu2 } from "../contextmenu/ABContextMenu2"
import { AMSearch } from "../../../Core/seach"
import { root_menu_demo, root_menu_callout } from "../../../Core/contextmenu/demo"
import { SEARCH_DB } from "../../../Core/seach/SearchDB"
import { global_setting } from "../../../Core/Setting"

/// 初始化菜单
export async function initMenu(el: HTMLDivElement) {
  // #region key-value 数据

  // 测试数据 (非Tauri环境下或其他环境下，不让数据为空)
  if (global_setting.isDebug) {
    const result = 'testE	🙂‍↔️\ntest1\t读取词库文件失败\ntest2\ttest222\ntest3\ttest123超长测试超长测试超长测试超长测试超长测试5超长测试超长测试超长测试'
    SEARCH_DB.add_data_by_csv(result as string, 'test')
  }

  // emoji
  try {
    const result = await invoke("read_file", {
      path: '../../../docs/demo/emoji.txt', // 路径可能有问题?
    })
    SEARCH_DB.add_data_by_csv(result as string, 'emoji')
  } catch (error) {
    console.error("Load dict fail:", error)
  }

  // 颜表情
  try {
    const result = await invoke("read_file", {
      path: '../../../docs/demo/ybq.json',
    })
    const jsonData = JSON.parse(result as string)
    let records: {key: string, value: string}[] = jsonData.map((item: any) => {
      return { key: item["description"], value: item["text"] }
    })
    SEARCH_DB.add_data_by_json(records, '颜表情')
  } catch (error) {
    console.error("Load dict fail:", error)
  }

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
