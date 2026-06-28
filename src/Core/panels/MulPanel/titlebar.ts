import { global_setting } from "../../shared/setting"
import { AMPin } from './pin/index'

export class AMTitlebar {
  static factory(el: HTMLElement) {
    return new AMTitlebar(el)
  }

  /**
   * @param p_el 挂载的元素，同时也是 .am-panel 元素
   */
  constructor(p_el: HTMLElement) {
    const el = document.createElement('div'); p_el.appendChild(el); el.classList.add('am-titlebar')

    AMPin.factory(el);

    this.initEvent(el, p_el)
  }

  initEvent(el: HTMLElement, p_el: HTMLElement) {
  }
}
