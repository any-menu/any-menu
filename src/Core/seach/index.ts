import { global_setting } from "../Setting"

/** 核心数据库
 * 交给别的模块来初始化
 */
export const db: {
  trie: any     // Trie树 (前缀树)，用于前缀匹配
  reverse: any  // 倒排索引，用于模糊匹配
  hash: any     // 哈希表，用于精确匹配
} = {
  trie: null,
  reverse: null,
  hash: null
}

/**
 * AnyMenu 的 k-v 搜索框
 * 静态构建 + 显示/隐藏的策略
 */
export class AMSearch {
  constructor() {
    // 初始化搜索框

    // app环境默认显示，非app环境 (ob/) 默认隐藏
    if (global_setting.env === 'app') this.show()
  }

  // 执行搜索
  public search(query: string) {
    
  }

  show() {
    // 在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到
    if (global_setting.env !== 'app') return
  }

  hide() {
    // 在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到
    if (global_setting.env !== 'app') return
  }
}
