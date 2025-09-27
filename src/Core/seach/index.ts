import { EditableBlock_Raw } from "@editableblock/textarea/dist/EditableBlock/src/EditableBlock_Raw"
import { global_setting } from "../Setting"

/** 核心数据库
 * 
 * 内容交给别的模块来初始化
 * 
 * 支持多层索引方式
 * - Trie树 (前缀树)，用于前缀匹配。对于输入法场景，这是最完美且高效的
 * - 倒排索引，用于模糊匹配
 * - 哈希表，用于精确匹配
 * - 分词辅助 (可选)
 * - 后缀树: 不采用，占用太多
 */
export const db: {
  trie: any
  reverse: any
  hash: any
} = {
  trie: null,
  reverse: null,
  hash: null
}

/**
 * AnyMenu 的 k-v 搜索框
 * 
 * 目前仅支持: 静态构建 + 显示/隐藏的策略
 */
export class AMSearch {
  el_parent: HTMLElement | null = null
  el: HTMLDivElement | null = null

  /**
   * @param el 挂载的元素
   * 如果是动态创建创建则不需要，则是在挂载时创建
   */
  constructor(el?: HTMLElement) {
    if (el) this.createDom(el)

    // app环境默认显示，非app环境 (ob/) 默认隐藏
    if (global_setting.env === 'app') this.show()
  }

  createDom(el: HTMLElement) {
    this.el_parent = el
    this.el = document.createElement('div'); this.el_parent.appendChild(this.el); this.el.classList.add('am-search')
    const input = document.createElement('input'); this.el.appendChild(input);
      input.type = 'text'; input.placeholder = 'Search...待开发';
      // EditableBlock_Raw.insertTextAtCursor(input as HTMLElement, item.callback as string)

    if (global_setting.focusStrategy) input.focus()
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
