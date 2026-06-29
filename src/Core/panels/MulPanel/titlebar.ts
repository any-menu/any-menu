import { activeAMPanel } from ".";
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

    AMPin.factory(el) // 置顶按钮
    createHideBtn(el)

    global_setting.other.app_createTitlebar(el)
  }
}

/** 隐藏窗口
 * 
 * (这里不使用最小化，而且还设置了 `"skipTaskbar": true` 隐藏)
 * 不过这里其实意义也不大，因为有太多其他方法能隐藏。
 */
function createHideBtn(el: HTMLElement) {
  const btn = document.createElement('button'); el.appendChild(btn);
  btn.classList.add('am-titlebar-btn', 'am-titlebar-minimize')
  btn.title = '隐藏'
  btn.innerText = '隐藏'
  btn.addEventListener('click', () => { activeAMPanel?.panel_hide() })
}
