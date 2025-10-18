import { global_setting } from "../../setting";
import { SEARCH_DB } from "./SearchDB";

// 建议项
export class AMSuggestion {
  el_suggestion: HTMLElement

  // 创建建议项元素。并挂载到容器元素、和监听到input元素
  static factory(el_input: HTMLInputElement, el_input_parent: HTMLElement): AMSuggestion {
    const amSuggestion = new AMSuggestion()

    // 挂载到容器元素
    el_input_parent.appendChild(amSuggestion.el_suggestion);
    // 监听到input元素
    amSuggestion.bind_input(el_input)

    return amSuggestion
  }

  private constructor() {
    // createDom
    const el_suggestion = document.createElement('div');
    this.el_suggestion = el_suggestion
      el_suggestion.classList.add('am-search-suggestion');
    this.hide()
  }

  show() {
    const el_suggestion = this.el_suggestion
    el_suggestion.innerHTML = ''; el_suggestion.classList.remove('am-hide');
  }
  hide() {
    const el_suggestion = this.el_suggestion
    el_suggestion.innerHTML = ''; el_suggestion.classList.add('am-hide');
  }

  // #region 输入更新、方向键、虚拟聚焦/高亮项管理

  // 绑定到input元素
  bind_input(el_input: HTMLInputElement) {
    const el_suggestion = this.el_suggestion
    let search_result: {
      key: string;
      value: string;
    }[] = []

    // input事件 - 输入
    el_input.addEventListener('input', (ev) => {
      const target = ev.target as HTMLInputElement
      search_result = this.search(el_suggestion, target.value)

      // 可选: 重置选择项为0 (如果采取不自动应用建议项的策略则不需要重置)
      const el_items = el_suggestion.querySelectorAll(":scope>div.item")
      this.updateVFocus(el_items, '0')
    })

    // input事件 - 键盘按键
    el_input.addEventListener('keydown', (ev) => {
      // 无内容时，由多级菜单接管事件
      if (el_input.value.trim() === '') {
        this.hide()
        return
      }

      let el_items: NodeListOf<HTMLElement> = el_suggestion.querySelectorAll(":scope>div.item")
      if (!el_items || el_items.length == 0) return

      if (ev.key == 'ArrowDown') { // Down 切换选项
        this.updateVFocus(el_items, 'down')
      } else if (ev.key == 'ArrowUp') { // Up 切换选项
        this.updateVFocus(el_items, 'up');
      } else if (ev.key == 'Enter') { // Enter 模拟点击选中的项目 // TODO 区分 shift+Enter 换行、ctrl+Enter 应用输入框而非建议项
        if (this.currentFocus > -1) {
          ev.preventDefault()
          el_items[this.currentFocus].click()
        }
      } else if (ev.key == 'Tab') { // Tab 不应用，仅将内容填入输入框
        if (this.currentFocus > -1) {
          ev.preventDefault()
          if (search_result.length) el_input.value = search_result[this.currentFocus].value
        }
      }
    })
  }

  // 键盘选择项追踪，初始不起作用
  private currentFocus: number = -1

  /** 更新虚拟聚焦项 (选中项)
   * @param flag
   * - 空，使用当前的currentFocus值
   * - '0'，选中第一项
   * - 'up'，选中上一项 (可循环选择)
   * - 'down'，选中下一项 (可循环选择)
   */
  private updateVFocus(list: NodeListOf<Element>, flag?: 'up'|'down'|'0'|'clean') {
    if (flag === '0') this.currentFocus = 0
    else if (flag === 'down') this.currentFocus++
    else if (flag === 'up') this.currentFocus--
    else if (flag === 'clean') this.currentFocus = -1
    else throw new Error("unreachable")

    if (!list || list.length == 0) return false
    removeVFocus(list)

    // 循环选择 (可选，或改为置顶/底后不再移动)
    if (flag === 'clean') return
    if (this.currentFocus >= list.length) this.currentFocus = 0
    if (this.currentFocus < 0) this.currentFocus = (list.length - 1)

    list[this.currentFocus].classList.add("focus-active") // 添加高亮
    list[this.currentFocus].scrollIntoView({ block: 'nearest' }) // 滚动到可视区域

    // 移除所有项的聚焦样式
    function removeVFocus(list: NodeListOf<Element>) {
      for (let i = 0; i < list.length; i++) {
        list[i].classList.remove("focus-active");
      }
    }
  }

  // #endregion

  search(el_suggestion: HTMLElement, query: string): {key: string, value: string}[] {
    if (el_suggestion == null) return []

    let result: {key: string, value: string}[] = []
    if (global_setting.config.search_engine === 'trie') {
      result = SEARCH_DB.query_by_trie(query)
    } else if (global_setting.config.search_engine === 'reverse') {
      result = SEARCH_DB.query_by_reverse(query)
    } else {
      console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
      return []
    }
    // console.log(`query [${query}]: `, result)

    // 数量检查
    if (result.length === 0) {
      this.hide()
      return []
    }
    // if (result.length == 50) {} // 达到上限

    // 添加到建议列表
    this.show()
    for (const item of result) {
      const div = document.createElement('div'); el_suggestion.appendChild(div); div.classList.add('item')
      const div_value = document.createElement('div'); div.appendChild(div_value); div_value.classList.add('value')
        div_value.textContent = item.value
      const div_key = document.createElement('div'); div.appendChild(div_key); div_key.classList.add('key')
        div_key.textContent = item.key

      div.onclick = () => {
        // el_input.value = '' // 弃用，让 input hide 再 show 时清空内容
        this.hide()
        void global_setting.api.sendText(item.value)
      }
    }

    return result
  }
}
