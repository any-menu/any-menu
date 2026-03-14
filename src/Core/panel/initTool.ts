/** 依赖于搜索框和多级菜单 */

import { global_el } from "."
import { type AMContextMenu } from "./contextmenu"
import { type AMToolbar } from "./toolbar"
import { global_setting } from "../setting"
import { SEARCH_DB } from "./search/SearchDB"
import { PLUGIN_MANAGER, PluginManager } from "../pluginManager/PluginManager"
import { type ContextMenuItems, toml_parse } from "./contextmenu/demo"
import * as yaml from 'js-yaml';

/**
 * TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
 * 这里也要区分是 搜索框数据 / 静态菜单数据 / 动态菜单数据
 * 
 * TODO 工具栏数据
 * 
 * TODO id 制，方便自定义脚本/按钮去引用其他词典的功能
 * 拟定策略:
 * - 脚本: id 为路径名
 * - 非结构化: id 为路径+词条id
 *   不应该用序数，这样的话字典在增删改查后会改换id (策略: 保留该方法但告知用户风险?)
 * 话说字典应该入 id 制吗，会不会导致内存臃肿
 * 
 * TODO 应该可以自由指定各个字典是否是否进入: 搜索数据库、多级菜单、工具栏。为此，需要插件管理器、id 制
 * 目前的策略是:
 * - 量多
 *   - 进搜索数据库，不进多级菜单
 *   - 特性: 非结构化字典，条目数较多 (几十万)，必须动态渲染 dom
 *   - 默认文件: 'csv', 'txt', 'json', 'yaml', 'yml'
 * - 量少
 *   - 进搜索数据库 + 多级菜单
 *   - 特性: 结构化字典，条目数较少 (<1000)，可以静态渲染 dom
 *   - 默认文件: 'toml', 'js'
 * 
 * TODO 设计上应该直接区分两种类型:
 * - 命令试: 限制只能1000条
 * - 字典: 无限制
 */
export async function initMenuData() {
  // 准备元素
  if (!global_el.amContextMenu) {
    console.error("AMContextMenu is not initialized")
    return
  }
  const myContextMenu: AMContextMenu = global_el.amContextMenu
  if (!global_el.amToolbar) {
    console.error("AMToolbar is not initialized")
    return
  }
  const myToolbar: AMToolbar = global_el.amToolbar
  // SEARCH_DB

  // 测试一下
  {
    // 数据库系统 (非Tauri环境下或其他环境下，不让数据为空)
    if (global_setting.isDebug) {
      const result = 'testE	🙂‍↔️\ntest1\t读取词库文件失败\ntest2\ttest222\ntest3\ttest123超长测试超长测试超长测试超长测试超长测试5超长测试超长测试超长测试'
      SEARCH_DB.add_data_by_csv(result as string, 'test')
    }
    // 脚本系统
    if (global_setting.isDebug) PluginManager.demo()
  }

  // #region key-value 数据

  // fill_by_folder
  if (!global_setting.config.dict_paths.endsWith('/')) { global_setting.config.dict_paths += '/' }
  await fill_by_folder(global_setting.config.dict_paths)

  async function fill_by_folder(folder_path: string) {
    try {
      const files: string[] = await global_setting.api.readFolder(folder_path)
      if (!files || files.length === 0) throw new Error("No files found")
      // 并发处理文件提升性能，但等待所有文件处理结束后再返回
      // 旧: for (const file_path of files) await fill_by_file(file_path)
      const promises = files.map(file_path => fill_by_file(file_path))
      await Promise.all(promises)
    } catch (error) {
      console.warn("Failed to read directory:", error) // 初始时还没词典可能为空
    }
  }

  async function fill_by_file(file_path: string) {
    // 文件名和文件扩展名 (文件扩展名和主体名都不一定有)
    let file_name_short: string // 不加路径和扩展名
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

    // 插件是否已开启
    let isFound = false
    let isEnable = false
    for (const plugin of global_setting.config.plugins) {
      if (plugin.name !== file_name_full) continue
      isFound = true
      if (plugin.enabled) isEnable = true
      break
    }
    if (!isFound) {
      global_setting.config.plugins.push({
        name: file_name_full,
        enabled: false
      })
      global_setting.api.saveConfig()
      return
    }
    if (!isEnable) return

    // 文件内容
    let file_content: string|null = ''
    if (['toml', 'csv', 'txt', 'json', 'yaml', 'yml', 'js'].includes(file_ext)) {
      file_content = await global_setting.api.readFile(file_path)
      if (typeof file_content !== 'string') {
        throw new Error("Invalid file content format")
      }
    } else {// 无关文件
      return
    }

    // 分发各种扩展名/特定文件名 // TODO 存在顺序问题
    if (file_ext === 'toml') {
      void fill_by_toml(file_content, file_name_short)
    } else if (file_ext === 'csv' || file_ext === 'txt') {
      void fill_by_csv(file_content, file_name_short)
    } else if (file_ext === 'json') {
      void fill_by_json(file_content, file_name_short)
    } else if (file_ext === 'yaml' || file_ext === 'yml') {
      void fill_by_yaml(file_content, file_name_short)
    } else if (file_ext === 'js') {
      void fill_by_js(file_content, file_name_short)
    } else { // 无关文件
      console.error('Unreadable, file type:', file_ext)
    }
  }

  async function fill_by_toml(file_content: string, file_name_short: string) {
    // 解析
    let menu_items: ContextMenuItems = []
    try {
      menu_items = toml_parse(file_content)["categories"] as ContextMenuItems
    } catch (error) {
      console.error("Parse error:", error)
      return
    }

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
    if (menu_items) recursive(menu_items)
    SEARCH_DB.add_data_by_json(records, file_name_short)

    // 多级菜单部分
    myContextMenu.append_data([
      {
        label: file_name_short,
        children: menu_items
      }
    ])
  }

  async function fill_by_csv(file_content: string, file_name_short: string) {
    // 搜索建议部分
    SEARCH_DB.add_data_by_csv(file_content, file_name_short)
  }

  async function fill_by_json(file_content: string, file_name_short: string) {
    // 解析
    let jsonData: any
    try {
      jsonData = JSON.parse(file_content)
    } catch (error) {
      console.error("Parse error:", error)
      return
    }

    // 搜索建议部分
    let records: {key: string, value: string, name?: string}[] = jsonData.map((item: any) => {
      return { key: item["keyword"], value: item["title"], name: item["description"] ?? undefined }
    })
    SEARCH_DB.add_data_by_json(records, file_name_short)
  }

  async function fill_by_yaml(file_content: string, file_name_short: string) {
    // 解析
    let yamlData: any
    try {
      yamlData = yaml.load(file_content)
    } catch (error) {
      console.error("Parse error:", error)
      return
    }

    // 搜索建议部分
    let records: {key: string, value: string, name?: string}[] = yamlData.map((item: any) => {
      return { key: item["keyword"], value: item["title"], name: item["description"] ?? undefined }
    })
    SEARCH_DB.add_data_by_json(records, file_name_short)
  }

  async function fill_by_js(file_content: string, file_name_short: string) {
    try {
      // 脚本部分
      const plugin = PLUGIN_MANAGER.loadPlugin(file_content)

      // 多级菜单部分
      myContextMenu.append_data([
        {
          label: file_name_short,
          callback: plugin.process
        }
      ])

      // toolbar 部分
      myToolbar.append_data([{
        label: file_name_short,
        callback: plugin.process
      }])
    } catch (error) {
      console.error("Parse script error:", error)
    }
  }

  // #endregion
}
