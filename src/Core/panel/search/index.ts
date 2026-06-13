import { global_setting } from "../../setting"
import { AMSuggestion } from "./AMSuggestion"

// 修复在非node环境 (obsidian是node环境，tauri app不是)，`require('obsidian')` 编译报错
// 当然，tauri app 中不应该调用 require
declare var require: any;

/**
 * AnyMenu 的 k-v 搜索框
 * 
 * 目前仅支持: 静态构建 + 显示/隐藏的策略
 */
export class AMSearch {
  el_parent: HTMLElement | null = null
  el: HTMLElement
  el_input: HTMLInputElement | null = null
  amSuggestion: AMSuggestion | null = null

  static factory(el_parent: HTMLElement): AMSearch {
    const instance = new AMSearch(el_parent)
    return instance
  }

  /**
   * @param el 挂载的元素
   * 如果是动态创建创建则不需要，则是在挂载时创建
   */
  constructor(el_parent: HTMLElement) {
    this.el = this.createDom(el_parent)
    this.panel_hide()
  }

  /** 输入框
   * 
   * DOM:
   * - el_parent
   *   - .am-search (this.el)
   *     - input.am-search-input (this.el_input)
   *     - .am-search-suggestion (this.el_suggestion)
   */
  createDom(el: HTMLElement): HTMLElement {
    // el_input
    this.el_parent = el
    this.el = document.createElement('div'); this.el_parent.appendChild(this.el); this.el.classList.add('am-search');
    this.el_input = document.createElement('input'); this.el.appendChild(this.el_input); this.el_input.classList.add('am-search-input')
      this.el_input.type = 'search'; this.el_input.placeholder = 'Search...';
      // EditableBlock_Raw.insertTextAtCursor(input as HTMLElement, item.callback as string)

    this.el_input.addEventListener('keydown', (ev: KeyboardEvent) => {
      // 截断并接管主面板默认的 Esc 行为
      // 顺序补充: 按 esc 时，此处按键 > 此处blur > (面板) 外面按键，且这里监听必聚焦，不用多余的判断逻辑
      // 
      // 此处截断并接管是为补充特殊逻辑:
      // 在输入框聚焦且存在内容时：
      // - 单 Esc 仅清空输入框。
      // - 即双 Esc 才可以清空并隐藏面板。
      if (ev.key === 'Escape' && this.el_input && this.el_input.value.trim() != "") {
        this.el_input.value = ""
        ev.preventDefault()
        ev.stopPropagation()
      }
    })

    this.amSuggestion = AMSuggestion.factory(this.el_input, this.el)

    return this.el
  }

  // #region 显示/隐藏
  
  public panel_show(is_focus: boolean = false) {
    if (this.el_input) this.el_input.value = ''
    if (this.amSuggestion) this.amSuggestion.panel_hide()

    if (this.el) {
      this.el.classList.remove('am-hide')
    }

    // 显示后聚焦，否则 focus 无效
    ;(() => {
      if (!is_focus) return
      if (!global_setting.focusStrategy) return
      this.el_input?.focus()
    })();

    // ~~在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到聚焦变换~~
    // if (global_setting.platform == 'app') return
  }

  public panel_hide() {
    if (this.el_input) this.el_input.value = ''
    if (this.amSuggestion) this.amSuggestion.panel_hide()

    if (this.el) this.el.classList.add('am-hide')
    this.el_input?.blur()

    // 隐藏后恢复聚焦
    ;(() => {
      if (!global_setting.focusStrategy) return
      if (typeof require == 'undefined') return
      const MarkdownView = require('obsidian').MarkdownView // as typeof import('obsidian').MarkdownView
      if (!MarkdownView) return
      const plugin = global_setting.other.obsidian_plugin
      if (!plugin) return
      const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView) return
      const editor = activeView.editor
      editor.focus()
    })();

    // ~~在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到聚焦变换~~
    // if (global_setting.platform == 'app') return
  }

  public panel_toggle() {
    if (this.el?.classList.contains('am-hide')) {
      this.panel_show()
    } else {
      this.panel_hide()
    }
  }

  // #endregion
}
