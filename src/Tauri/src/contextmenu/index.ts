import { invoke } from "@tauri-apps/api/core"

import { ABContextMenu2 } from "../contextmenu/ABContextMenu2"
import { AMSearch } from "../../../Core/seach"
import { type ContextMenuItems, toml_parse } from "../../../Core/contextmenu/demo"
import { SEARCH_DB } from "../../../Core/seach/SearchDB"
import { global_setting } from "../../../Core/Setting"

/// 初始化菜单
export async function initMenu(el: HTMLDivElement) {
  // #region 元素 - 搜索框和多级菜单

  AMSearch.factory(el)
  const myMenu = new ABContextMenu2(el)
  // myMenu.append_headerEditor('header test', ()=>{})

  // #endregion

  // #region key-value 数据

  // 测试数据 (非Tauri环境下或其他环境下，不让数据为空)
  if (global_setting.isDebug) {
    const result = 'testE	🙂‍↔️\ntest1\t读取词库文件失败\ntest2\ttest222\ntest3\ttest123超长测试超长测试超长测试超长测试超长测试5超长测试超长测试超长测试'
    SEARCH_DB.add_data_by_csv(result as string, 'test')
  }

  try {
    const files: string[]|null = await invoke("read_folder", {
      path: '../../../docs/demo/' // 保证有后 `/`
    })
    if (typeof files !== 'object' || !Array.isArray(files)) {
      throw new Error("Invalid directory listing format")
    }

    for (const file_path of files) {
      fillDB_by_file(file_path)
    }
  } catch (error) {
    console.error("Failed to read directory:", error)
  }

  async function fillDB_by_file(file_path: string) {
    // 文件名和文件扩展名 (文件扩展名和主体名都不一定有)
    let file_name_short: string
    let file_ext: string
    const file_name_full = file_path.split(/\/|\\/).pop()??''
    const file_part = file_name_full.split('.')
    if (file_part.length < 2) {
      file_name_short = file_name_full
      file_ext = ''
    }
    else {
      file_name_short = file_part.slice(0, -1).join('.')
      file_ext = file_part[file_part.length - 1].toLowerCase()
    }

    // 分发各种扩展名 // TODO 存在顺序问题
    if (file_ext === 'toml') {
      void fillDB_by_toml(file_path, file_name_short)
    } else if (file_ext === 'csv' || file_ext === 'txt') {
      void fillDB_by_csv(file_path, file_name_short)
    } else if (file_ext === 'json') {
      void fillDB_by_json(file_path, file_name_short)
    } else { // 无关文件
      return
    }
  }

  async function fillDB_by_toml(file_path: string, file_name_short: string) {
    let menu_items: ContextMenuItems = []
    try {
      // 读取并解析文件
      const result = await invoke("read_file", {
        path: file_path,
      })
      menu_items = toml_parse(result as string)["categories"] as ContextMenuItems

      // 搜索建议部分
      const records: {key: string, value: string, name?: string}[] = []
      function recursive(items: ContextMenuItems) {
        for (const item of items) {
          if (item.callback && typeof item.callback === 'string') {
            records.push({ key: item.key ?? item.label, value: item.callback, ...(item.key ? {name: item.key} : {}) })
          }
          if (item.children) recursive(item.children)
        }
      }
      recursive(menu_items)
      SEARCH_DB.add_data_by_json(records, file_name_short)

      // 多级菜单部分
      myMenu.append_data([
        {
          label: file_name_short,
          children: menu_items
        }
      ])
    } catch (error) {
      console.error("Load dict fail:", error)
    }
  }

  async function fillDB_by_csv(file_path: string, file_name_short: string) {
    try {
      const result = await invoke("read_file", {
        path: file_path,
      })
      SEARCH_DB.add_data_by_csv(result as string, file_name_short)
    } catch (error) {
      console.error("Load dict fail:", error)
    }
  }

  async function fillDB_by_json(file_path: string, file_name_short: string) {
    try {
      const result = await invoke("read_file", {
        path: file_path,
      })
      const jsonData = JSON.parse(result as string)
      let records: {key: string, value: string}[] = jsonData.map((item: any) => {
        return { key: item["keyword"], value: item["title"], name: item["description"] }
        // return { key: item["tag"] + '/' + item["description"], value: item["text"] }
      })
      SEARCH_DB.add_data_by_json(records, file_name_short)
    } catch (error) {
      console.error("Load dict fail:", error)
    }
  }

  // #endregion

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
      label: 'Mermaid',
      children: [
        { label: "待补充" }
      ]
    },
    {
      label: '代码片段',
      children: [
        { label: "待补充" }
      ]
    },
    {
      label: '自定义短语',
      children: [
        { label: "待补充" }
      ]
    },
    {
      label: 'Plantuml',
      children: [
        { label: "待补充" }
      ]
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
      label: '表情包', // 以及svg icon。这功能会用到本体存储，要么app版才支持，要么这里应该需要联网查询。
      children: [
        { label: "Too many. You should use the search bar." }
      ]
    },
    // {
    //   label: '最近', // 缓存最近通过菜单插入的内容项
    //   children: [
    //     { label: "Too many. You should use the search bar." }
    //   ]
    // },
  ])

  // #endregion

  // myMenu.attach(el)
}
