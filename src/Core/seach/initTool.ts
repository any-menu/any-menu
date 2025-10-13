/** 依赖于搜索框和多级菜单 */

import { ABContextMenu } from "../contextmenu"
import { global_setting } from "../setting"
import { SEARCH_DB } from "./SearchDB"
import { PLUGIN_MANAGER, PluginManager } from "../pluginManager/PluginManager"
import { type ContextMenuItems, toml_parse } from "../contextmenu/demo"
import * as yaml from 'js-yaml';

/// TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
/// 这里也要区分是 搜索框数据 / 静态菜单数据 / 动态菜单数据
export async function initMenuData(myMenu: ABContextMenu) {
  // #region key-value 数据

  // 测试数据 (非Tauri环境下或其他环境下，不让数据为空)
  if (global_setting.isDebug) {
    const result = 'testE	🙂‍↔️\ntest1\t读取词库文件失败\ntest2\ttest222\ntest3\ttest123超长测试超长测试超长测试超长测试超长测试5超长测试超长测试超长测试'
    SEARCH_DB.add_data_by_csv(result as string, 'test')
  }

  if (!global_setting.config.dict_paths.endsWith('/')) { global_setting.config.dict_paths += '/' }
  try {
    const files: string[] = await global_setting.api.readFolder(global_setting.config.dict_paths)
    if (!files || files.length === 0) throw new Error("No files found")
    for (const file_path of files) {
      fillDB_by_file(file_path)
    }
  } catch (error) {
    console.warn("Failed to read directory:", error) // 初始时还没词典可能为空
    // debug 环境会走这里，使用硬编码 // 且这里写的硬编码应该在 src/Tauri 下而非项目根目录运行
    // try {
    //   const files: string[] = await global_setting.api.readFolder('../../../store/dict/')
    //   if (!files || files.length === 0) throw new Error("No files found2")
    //   for (const file_path of files) {
    //     fillDB_by_file(file_path)
    //   }
    // } catch (error) {
    //   console.error("Failed to read directory:", error)
    // }
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

    let file_content: string|null = ''
    if (['toml', 'csv', 'txt', 'json', 'yaml', 'yml', 'js'].includes(file_ext)) {
      file_content = await global_setting.api.readFile(file_path)
      if (typeof file_content !== 'string') {
        throw new Error("Invalid file content format")
      }
    } else {// 无关文件
      return
    }

    // 分发各种扩展名 // TODO 存在顺序问题
    if (file_ext === 'toml') {
      void fillDB_by_toml(file_content, file_name_short)
    } else if (file_ext === 'csv' || file_ext === 'txt') {
      void fillDB_by_csv(file_content, file_name_short)
    } else if (file_ext === 'json') {
      void fillDB_by_json(file_content, file_name_short)
    } else if (file_ext === 'yaml' || file_ext === 'yml') {
      void fillDB_by_yaml(file_content, file_name_short)
    } else if (file_ext === 'js') {
      void load_script(file_content, file_name_short)
    } else { // 无关文件
      console.error('Unreadable, file type:', file_ext)
    }
  }

  async function fillDB_by_toml(file_content: string, file_name_short: string) {
    let menu_items: ContextMenuItems = []
    try {
      menu_items = toml_parse(file_content)["categories"] as ContextMenuItems

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
      console.error("Parse error:", error)
    }
  }

  async function fillDB_by_csv(file_content: string, file_name_short: string) {
    try {
      SEARCH_DB.add_data_by_csv(file_content, file_name_short)
    } catch (error) {
      console.error("Parse error:", error)
    }
  }

  async function fillDB_by_json(file_content: string, file_name_short: string) {
    try {
      const jsonData = JSON.parse(file_content)
      let records: {key: string, value: string, name?: string}[] = jsonData.map((item: any) => {
        return { key: item["keyword"], value: item["title"], name: item["description"] ?? undefined }
        // return { key: item["tag"] + '/' + item["description"], value: item["text"] }
      })
      SEARCH_DB.add_data_by_json(records, file_name_short)
    } catch (error) {
      console.error("Parse error:", error)
    }
  }

  async function fillDB_by_yaml(file_content: string, file_name_short: string) {
    try {
      const yamlData: any = yaml.load(file_content)
      let records: {key: string, value: string, name?: string}[] = yamlData.map((item: any) => {
        return { key: item["keyword"], value: item["title"], name: item["description"] ?? undefined }
        // return { key: item["tag"] + '/' + item["description"], value: item["text"] }
      })
      SEARCH_DB.add_data_by_json(records, file_name_short)
    } catch (error) {
      console.error("Parse error:", error)
    }
  }

  // #endregion

  // #region 多级展开菜单 弃用默认菜单，必须由词典提供
  // myMenu.append_data([
  //   {
  //     label: 'Markdown',
  //     children: [
  //       { label: "表格" },
  //       { label: "引用" },
  //       { label: "代码块" },
  //       { label: "公式块" },
  //       { label: "有序列表" },
  //       { label: "无序列表" },
  //       { label: "---" },
  //       { label: "标题" },
  //       { label: "分割线" },
  //       { label: "粗体" },
  //       { label: "斜体" },
  //     ]
  //   },
  //   {
  //     label: 'Mermaid',
  //     children: [
  //       { label: "待补充" }
  //     ]
  //   },
  //   {
  //     label: '代码片段',
  //     children: [
  //       { label: "待补充" }
  //     ]
  //   },
  //   {
  //     label: '自定义短语',
  //     children: [
  //       { label: "待补充" }
  //     ]
  //   },
  //   {
  //     label: 'Plantuml',
  //     children: [
  //       { label: "待补充" }
  //     ]
  //   },
  //   {
  //     label: 'Emoji',
  //     children: [
  //       { label: "Too many. You should use the search bar." }
  //     ]
  //   },
  //   {
  //     label: '颜表情',
  //     children: [
  //       { label: "Too many. You should use the search bar." }
  //     ]
  //   },
  //   {
  //     label: '表情包', // 以及svg icon。这功能会用到本体存储，要么app版才支持，要么这里应该需要联网查询。
  //     children: [
  //       { label: "Too many. You should use the search bar." }
  //     ]
  //   },
  //   // {
  //   //   label: '最近', // 缓存最近通过菜单插入的内容项
  //   //   children: [
  //   //     { label: "Too many. You should use the search bar." }
  //   //   ]
  //   // },
  // ])

  // #endregion

  // #region custom script 自定义脚本

  if (global_setting.isDebug) PluginManager.demo()

  async function load_script(file_content: string, file_name_short: string) {
    try {
      // const fn = new Function(file_content)

      const plugin = PLUGIN_MANAGER.loadPlugin(file_content)
      if (plugin.onLoad) plugin.onLoad();

      // 多级菜单部分
      myMenu.append_data([
        {
          label: file_name_short,
          callback: plugin.process
        }
      ])
    } catch (error) {
      console.error("Parse script error:", error)
    }
  }

  // #endregion

  // myMenu.attach(el)
}
