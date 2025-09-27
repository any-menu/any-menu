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

  /** 输入框
   * 
   * DOM:
   * - el_parent
   *   - .am-search (this.el)
   *     - input.am-search-input (this.el_input)
   *     - .am-search-suggestion (this.el_suggestion)
   */
  createDom(el: HTMLElement) {
    // el_input
    this.el_parent = el
    this.el = document.createElement('div'); this.el_parent.appendChild(this.el); this.el.classList.add('am-search');
    this.el_input = document.createElement('input'); this.el.appendChild(this.el_input); this.el_input.classList.add('am-search-input')
      this.el_input.type = 'text'; this.el_input.placeholder = 'Search...';
      // EditableBlock_Raw.insertTextAtCursor(input as HTMLElement, item.callback as string)

    this.createDom_suggestion(this.el)
  }

  // 输入建议
  createDom_suggestion(el_input_parent: HTMLElement) {
    const p_this = this

    // el_suggestion
    this.el_suggestion = document.createElement('div'); el_input_parent.appendChild(this.el_suggestion);
      this.el_suggestion.classList.add('am-search-suggestion');
      // this.el_suggestion.setAttribute("id", "autocomplete-list"); // 同一时间应该只会存在一个建议列表
      this.el_suggestion.style.display = 'none' // 没有匹配项就隐藏

    // 键盘选择项追踪
    let currentFocus: number = -1
    // 添加高亮样式到选中项
    function addActive(list: NodeListOf<Element>) {
      if (!list || list.length == 0) return false
      removeActive(list)

      if (currentFocus >= list.length) currentFocus = 0
      if (currentFocus < 0) currentFocus = (list.length - 1)
      list[currentFocus].classList.add("autocomplete-active") // 添加高亮
      list[currentFocus].scrollIntoView({ block: 'nearest' }) // 滚动到可视区域
    }
    // 移除所有项的高亮样式
    function removeActive(list: NodeListOf<Element>) {
      for (let i = 0; i < list.length; i++) {
        list[i].classList.remove("autocomplete-active");
      }
    }

    // input事件 - 输入
    let search_result: {
      key: string;
      value: string;
    }[] = []
    this.el_input?.addEventListener('input', (ev) => {
      const target = ev.target as HTMLInputElement
      search_result = this.search(target.value)

      // 可选: 重置选择项为0 (如果采取不自动应用建议项的策略则不需要重置)
      currentFocus = 0
      const el_items = p_this.el_suggestion!.querySelectorAll(":scope>div.item")
      addActive(el_items)
    })

    // input事件 - 键盘按键
    this.el_input?.addEventListener('keydown', (ev) => {
      let el_items: NodeListOf<HTMLElement>|undefined
      el_items = p_this.el_suggestion!.querySelectorAll(":scope>div.item")
      if (!el_items) return

      if (ev.key == 'ArrowDown') { // Down 切换选项
        currentFocus++
        addActive(el_items);
      } else if (ev.key == 'ArrowUp') { // Up 切换选项
        currentFocus--
        addActive(el_items);
      } else if (ev.key == 'Enter') { // Enter 模拟点击选中的项目 // TODO 区分 shift+Enter 换行、ctrl+Enter 应用输入框而非建议项
        if (currentFocus > -1) {
          ev.preventDefault()
          if (el_items) el_items[currentFocus].click()
        }
      } else if (ev.key == 'Tab') { // Tab 不应用，仅将内容填入输入框
        if (currentFocus > -1) {
          ev.preventDefault()
          if (el_items && search_result.length) p_this.el_input!.value = search_result[currentFocus].value
        }
      }
    })
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
