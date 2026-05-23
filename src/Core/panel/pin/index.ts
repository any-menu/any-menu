import { global_setting } from "../../setting"

export class AMPin {
  static factory(el: HTMLElement) {
    return new AMPin(el)
  }

  /**
   * @param el 挂载的元素
   * 
   * 注意: 普通浏览器环境和 App 环境中，这个置顶按钮的行为有所差异
   *   TODO 先只做 app 版本
   */
  constructor(el: HTMLElement) {
    if (global_setting.platform !== 'app') return
    const amPin = document.createElement('div'); el.appendChild(amPin); amPin.classList.add('am-pin')
    global_setting.api.saveInnerHTML(amPin, `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`)

    amPin.addEventListener('click', () => {
      global_setting.api.pin()
    })
  }
}
