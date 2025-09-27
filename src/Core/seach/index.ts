import { EditableBlock_Raw } from "@editableblock/textarea/dist/EditableBlock/src/EditableBlock_Raw"
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

    // app环境默认显示，非app环境 (ob/) 默认隐藏
    if (global_setting.env === 'app') this.show()
  }

  createDom(el: HTMLElement) {
    this.el_parent = el
    this.el = document.createElement('div'); this.el_parent.appendChild(this.el); this.el.classList.add('am-search')
    this.el_input = document.createElement('input'); this.el.appendChild(this.el_input);
      this.el_input.type = 'text'; this.el_input.placeholder = 'Search...待开发';
      // EditableBlock_Raw.insertTextAtCursor(input as HTMLElement, item.callback as string)

    if (global_setting.focusStrategy) this.el_input.focus()
  }

  // 执行搜索
  public search(query: string) {
    // 刷新输入建议
  }

  // 输入建议
  input_suggestion(el_input: HTMLElement, el_input_parent: HTMLElement) {
    


    // header_input.addEventListener('keydown', (ev) => { // input enter和suggestion enter冲突，前者先触发
    //   if (ev.key === 'Enter') { // 按回车应用值
    //     ev.preventDefault()
    //     // 获取隐藏值 (提示值)
    //     header_callback(header_input.value)
    //     this.visual_hide()
    //   }
    //   // if (ev.key === 'Escape') { // 按esc不应用值
    //   //   ev.preventDefault()
    //   //   ev.stopPropagation()
    //   //   header_2.value = header_old
    //   //   this.hide()
    //   // }
    // })
  }

  show() {
    this.el_input?.focus()
    // 在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到
    if (global_setting.env !== 'app') return
  }

  hide() {
    // 在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到
    if (global_setting.env !== 'app') return
  }
}
