import { global_setting } from "../Setting"
import { SEARCH_DB } from "./SearchDB"

/**
 * AnyMenu 的 k-v 搜索框
 * 
 * 目前仅支持: 静态构建 + 显示/隐藏的策略
 */
export class AMSearch {
  el_parent: HTMLElement | null = null
  el: HTMLElement | null = null
  el_input: HTMLInputElement | null = null
  el_suggestion: HTMLElement | null = null

  /** 单例模式 */
  static factory(el?: HTMLElement) {
    if (SEARCH_DB.el_search) return SEARCH_DB.el_search
    const instance = new AMSearch(el)
    SEARCH_DB.el_search = instance
  }

  /**
   * @param el 挂载的元素
   * 如果是动态创建创建则不需要，则是在挂载时创建
   */
  constructor(el?: HTMLElement) {
    if (el) this.createDom(el)
    this.show()

    // app环境默认显示，非app环境 (ob/) 默认隐藏
    if (global_setting.env === 'app') this.show()
  }

  // 输入框
  createDom(el: HTMLElement) {
    this.el_parent = el
    this.el = document.createElement('div'); this.el_parent.appendChild(this.el); this.el.classList.add('am-search')
    this.el_input = document.createElement('input'); this.el.appendChild(this.el_input); this.el_input.classList.add('am-search-input')
      this.el_input.type = 'text'; this.el_input.placeholder = 'Search...';
      // EditableBlock_Raw.insertTextAtCursor(input as HTMLElement, item.callback as string)

    this.el_input.oninput = (ev) => {
      const target = ev.target as HTMLInputElement
      this.search(target.value)
    }

    this.createDom_suggestion(this.el_input, this.el)
  }

  // 输入建议
  createDom_suggestion(el_input: HTMLElement, el_input_parent: HTMLElement) {
    this.el_suggestion = document.createElement('div'); el_input_parent.appendChild(this.el_suggestion); this.el_suggestion.classList.add('am-search-suggestion')
      this.el_suggestion.style.display = 'none' // 没有匹配项就隐藏
  }

  // 执行搜索、并修改输入建议
  public search(query: string): {key: string, value: string}[] {
    if (this.el_suggestion == null) return []

    const result = SEARCH_DB.query_by_trie(query)
    // console.log(`query [${query}]: `, result)

    // 数量检查
    if (result.length === 0) {
      this.el_suggestion.innerHTML = ''; this.el_suggestion.style.display = 'none';
      return []
    }
    // if (result.length == 50) {} // 达到上限

    // 添加到建议列表
    this.el_suggestion.innerHTML = ''; this.el_suggestion.style.display = 'block';
    for (const item of result) {
      const div = document.createElement('div'); this.el_suggestion.appendChild(div); div.classList.add('item')
      const div_value = document.createElement('div'); div.appendChild(div_value); div_value.classList.add('value')
        div_value.textContent = item.value
      const div_key = document.createElement('div'); div.appendChild(div_key); div_key.classList.add('key')
        div_key.textContent = item.key

      div.onclick = () => {
        this.el_input!.value = ''
        this.el_suggestion!.innerHTML = ''; this.el_suggestion!.style.display = 'none';
        void global_setting.api.sendText(item.value)
      }
    }

    return result
  }

  show() {
    if (global_setting.focusStrategy) this.el_input?.focus()
    
    // 在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到
    if (global_setting.env !== 'app') return
  }

  hide() {
    // 在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到
    if (global_setting.env !== 'app') return
  }
}
