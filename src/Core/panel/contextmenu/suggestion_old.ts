/** 装饰 - 输入框建议
 * 
 * - .autocomplete-p' (输入框的容器)
 *   - input (输入框)
 *   - div.autocomplete-items#<id>-autocomplete-list (建议列表)
 *     - div has strong/input (建议项)
 * 
 * @param callback (已废弃，换用ctrl+enter来传递消息) 选中建议项时的回调
 */
export function input_suggestion(el_input: HTMLInputElement, el_container: HTMLElement) {
  el_container.classList.add('autocomplete-p')
  const suggestions = ['list2table', 'list2tab', 'list2markmap', 'list2mermaid']
  let currentFocus: number = -1; // 用于跟踪键盘选择的项目

  // el_input事件 - 输入
  el_input.addEventListener('input', function() {
    const val: string = this.value
    closeAllLists() // 关闭任何已打开的列表

    // 策略: 可以不做建议 / 展示所有建议 / 限制建议条数
    // if (!val) { return false } // 如果输入为空，则不执行任何操作

    currentFocus = -1 // 重置焦点

    // 创建 建议列表
    const suggestionList = document.createElement("div");
      suggestionList.setAttribute("id", "autocomplete-list"); // 同一时间应该只会存在一个建议列表
      suggestionList.setAttribute("class", "autocomplete-items");
      el_container.appendChild(suggestionList)
    // 创建 建议列表项
    for (const item of suggestions) {
      // 筛选去除不匹配项
      if (val && item.substring(0, val.length).toUpperCase() != val.toUpperCase()) continue

      // 创建建议项的DIV，其中与输入匹配的字符进行加粗
      const suggestionItem = document.createElement("div")
      suggestionItem.innerHTML = "<strong>" + item.substring(0, val.length) + "</strong>"
      suggestionItem.innerHTML += item.substring(val.length)      
      
      // 建议列表项事件 - 点击
      suggestionItem.dataset.value = item
      suggestionItem.addEventListener("click", function(ev) {
        ev.preventDefault()
        el_input.value = this.dataset.value!
        const ctrlEnterEvent = new KeyboardEvent('keydown', { // ctrl+Enter
          key: 'Enter',
          code: 'Enter',
          ctrlKey: true,
          bubbles: true,
          cancelable: true
        });
        el_input.dispatchEvent(ctrlEnterEvent);
        closeAllLists()
      })
      suggestionList.appendChild(suggestionItem)
    }
  })

  // el_input事件 - 键盘按键
  el_input.addEventListener('keydown', (ev) => {
    let el_list: HTMLElement|null = document.getElementById("autocomplete-list")
    let el_items: HTMLCollectionOf<HTMLElement>|undefined
    if (el_list) el_items = el_list.getElementsByTagName("div")
    if (!el_items) return

    if (ev.key == 'ArrowDown') { // Down 切换选项
      currentFocus++
      addActive(el_items);
    } else if (ev.key == 'ArrowUp') { // Up 切换选项
      currentFocus--
      addActive(el_items);
    } else if (ev.key == 'Enter') { // Enter 模拟点击选中的项目
      if (currentFocus > -1) {
        ev.preventDefault()
        if (el_items) el_items[currentFocus].click()
      }
    } else if (ev.key == 'Tab') { // Tab 不应用，仅将内容填入输入框
      if (currentFocus > -1) {
        ev.preventDefault()
        if (el_items) el_input.value = el_items[currentFocus].dataset.value!
      }
    }
  })

  // --- 辅助函数 ---

  // 添加高亮样式到选中项
  function addActive(list: HTMLCollectionOf<Element>) {
    if (!list) return false
    removeActive(list) // 先移除所有高亮
    if (currentFocus >= list.length) currentFocus = 0
    if (currentFocus < 0) currentFocus = (list.length - 1)
    list[currentFocus].classList.add("autocomplete-active") // 添加高亮
    list[currentFocus].scrollIntoView({ block: 'nearest' }) // 滚动到可视区域
  }

  // 移除所有项的高亮样式
  function removeActive(list: HTMLCollectionOf<Element>) {
    for (let i = 0; i < list.length; i++) {
      list[i].classList.remove("autocomplete-active");
    }
  }

  // 关闭建议列表
  function closeAllLists() {
    const lists = document.getElementsByClassName("autocomplete-items")
    // 从后往前遍历并删除，以避免在实时 HTMLCollection 上操作时出现索引问题
    for (let i = lists.length - 1; i >= 0; i--) {
        lists[i].parentNode?.removeChild(lists[i])
    }
  }

  // 当点击页面其他地方时，关闭列表
  // document.addEventListener("click", function (e) {
  //   const target = e.target as HTMLElement
  //   // 如果点击的目标不是输入框，也不是自动完成容器的子元素，则关闭列表
  //   if (target !== el_input && !el_container.contains(target)) {
  //     closeAllLists()
  //   }
  // })
}
