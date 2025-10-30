import { global_setting } from "../../setting"
import { AMSuggestion } from "./suggestion"

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
  el: HTMLElement | null = null
  el_input: HTMLInputElement | null = null
  amSuggestion: AMSuggestion | null = null

  static factory(el?: HTMLElement): AMSearch {
    const instance = new AMSearch(el)
    return instance
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

    this.amSuggestion = AMSuggestion.factory(this.el_input, this.el)
  }

  // ------------- 显示隐藏 -------------

  private isShow: boolean = false
  
  show(x?: number, y?: number) {
    if (this.el_input) this.el_input.value = ''
    if (this.amSuggestion) this.amSuggestion.hide()

    this.isShow = true
    if (this.el) {
      this.el.classList.remove('am-hide')
      if (x !== undefined) this.el.style.left = `${x}px`
      if (y !== undefined) this.el.style.top = `${y}px`
    }

    // 显示后聚焦，否则 focus 无效
    ;(() => {
      if (!global_setting.focusStrategy) return
      this.el_input?.focus()
    })();

    // ~~在 app (非ob/编辑器或浏览器插件等) 环境跟随窗口显示隐藏，用不到聚焦变换~~
    if (global_setting.env == 'app') {
      return
    }

    window.addEventListener('click', this.visual_listener_click)
    window.addEventListener('mouseup', this.visual_listener_mouseup)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }

  hide() {
    if (this.el_input) this.el_input.value = ''
    if (this.amSuggestion) this.amSuggestion.hide()

    this.isShow = false
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
    if (global_setting.env == 'app') return

    window.removeEventListener('click', this.visual_listener_click)
    window.removeEventListener('mouseup', this.visual_listener_mouseup)
    window.removeEventListener('keydown', this.visual_listener_keydown)
  }

  // 动态事件组。菜单显示时注册，隐藏时销毁
  // 当菜单处于显示状态时，右键到其他区域/左键/Esc，则隐藏菜单
  visual_listener_click = (ev: MouseEvent) => {
    if (!this.el) return
    if (!this.isShow) return
    if (this.el.contains(ev.target as Node)) return
    this.hide()
  }
  visual_listener_mouseup = (ev: MouseEvent) => {
    if (!this.isShow) return
    if (ev.button === 2) this.hide()
  }
  visual_listener_keydown = (ev: KeyboardEvent) => {
    if (!this.isShow) return
    if (ev.key === 'Escape') this.hide()
  }
}
