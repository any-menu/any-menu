import { global_setting } from "../../../Core/setting"

export class AMToolbar {
  public el_parent: HTMLElement;
  public el: HTMLElement;
  
  isShow = true

  static factory(
    el_parent: HTMLElement,
  ) {
    return new AMToolbar(el_parent)
  }

  constructor(
    el_parent: HTMLElement,
  ) {
    this.el_parent = el_parent
    this.el = document.createElement('div'); el_parent.appendChild(this.el); this.el.classList.add('am-toolbar');
    this.hide()
  }

  // #region 显示/隐藏菜单

  show(x?: number, y?: number) {
    this.el.classList.remove('am-hide'); this.isShow = true;

    if (x !== undefined) this.el.style.left = `${x}px`
    if (y !== undefined) this.el.style.top = `${y}px`
    
    this.el.classList.remove('am-hide')
    this.el.classList.add('visible')
    this.el?.classList.remove('show-altkey')

    window.addEventListener('click', this.visual_listener_click)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }

  hide() {
    if (global_setting.state.isPin) return
    this.el.classList.add('am-hide'); this.isShow = false;

    window.removeEventListener('click', this.visual_listener_click)
    window.removeEventListener('keydown', this.visual_listener_keydown)
  }

  visual_listener_click = (ev: MouseEvent) => {
    if (!this.el) return
    if (this.el.contains(ev.target as Node)) return
    this.hide()
  }

  visual_listener_keydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      this.hide()
      return
    }
  }

  // #endregion
}
