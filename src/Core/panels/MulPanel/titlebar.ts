import { activeAMPanel, type AMPanel } from ".";
import { global_setting } from "../../shared/setting"
import { AMPin } from './pin/index'

export class AMTitlebar {
  el: HTMLElement

  static factory(amPanel: AMPanel) {
    return new AMTitlebar(amPanel)
  }

  /**
   * @param amPanel，其 `.el` 为挂载的元素，同时也是 .am-panel 元素
   */
  constructor(public amPanel: AMPanel) {
    this.el = document.createElement('div'); amPanel.el.appendChild(this.el); this.el.classList.add('am-titlebar')

    AMPin.factory(this.el, amPanel) // 置顶按钮
    createHideBtn(this.el)

    global_setting.other.app_createTitlebar(this.el)

    this.hide()
  }

  hide() {
    this.el.classList.add('am-hide')
  }

  show() {
    this.el.classList.remove('am-hide')
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
