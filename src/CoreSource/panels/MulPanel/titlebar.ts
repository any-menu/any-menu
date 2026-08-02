import { activeAMPanel, type AMPanel } from ".";
import { global_setting } from "../../shared/setting"
import { AbsAmPanel } from "../abs";
import { AMPin } from './pin/index'

export class AMTitlebar extends AbsAmPanel {
  static factory(amPanel: AMPanel) {
    return new AMTitlebar(amPanel)
  }

  /**
   * @param amPanel，其 `.el` 为挂载的元素，同时也是 .am-panel 元素
   */
  constructor(public amPanel: AMPanel) {
    const el = document.createElement('div');amPanel.el.appendChild(el); el.classList.add('am-titlebar');
    super(el, amPanel.el, amPanel)

    AMPin.factory(this, amPanel) // 置顶按钮
    this.createHideBtn()
    this.createPanelManagerBtn()

    global_setting.other.app_createTitlebar(this.el)

    this.panel_hide()

    AMPin.initEvent(this.el, amPanel)
  }

  panel_hide() {
    this.el.classList.add('am-hide')
  }

  panel_show() {
    this.el.classList.remove('am-hide')
  }

  /** 隐藏窗口
   * 
   * (这里不使用最小化，而且还设置了 `"skipTaskbar": true` 隐藏)
   * 不过这里其实意义也不大，因为有太多其他方法能隐藏。
   */
  private createHideBtn() {
    const btn = document.createElement('button'); this.el.appendChild(btn);
    btn.classList.add('am-titlebar-btn', 'am-titlebar-minimize')
    btn.title = '隐藏'
    btn.innerText = '隐藏'
    btn.addEventListener('click', () => {
      activeAMPanel?.panel_hide([], true)
    })
  }

  /** 面板管理
   * 会在所有子面板的上方显示/隐藏一个操作手柄，其功能包括：
   * 
   * 关闭 (/隐藏)、分离 (独立)、显示/关闭/排序已经注册的子面板
   */
  private createPanelManagerBtn() {
    const btn = document.createElement('button'); this.el.appendChild(btn);
    btn.classList.add('am-titlebar-btn', 'am-titlebar-manager')
    btn.title = '面板管理'
    btn.innerText = '面板管理'
    
    // 按钮的附加面板
    let el_panel_list: HTMLElement = document.createElement('div');  btn.appendChild(el_panel_list);
      el_panel_list.classList.add('am-titlebar-list', 'am-hide') // 默认不显示管理面板
    let is_show = false // 是否处于管理状态中
    
    btn.addEventListener('click', () => {
      if (!is_show) {
        is_show = true
        btn.classList.add('active')
        el_panel_list.classList.remove('am-hide')

        el_panel_list.innerHTML = ''

        // 已显示的内容
        for (const item of (activeAMPanel?.show_panel_list ?? [])) {
          const el_item = document.createElement('div'); el_panel_list.appendChild(el_item);
            el_item.innerText = item
            el_item.title = item

          el_item.onclick = () => {
            activeAMPanel?.panel_hide([item])
            el_item.remove(); el_item.onclick = null;
          }
        }

        const el_hr = document.createElement('hr'); el_panel_list.appendChild(el_hr);

        // 所有已注册的内容
        const all_panel_list: string[] = [
          'search', 'toolbar', 'menu', 'miniEditor', 'info',
          ...Object.keys(activeAMPanel?.custom_sub_panel ?? {})
        ]
        for (const item_name of all_panel_list) {
          const el_item = document.createElement('div'); el_panel_list.appendChild(el_item);
            el_item.innerText = item_name
            el_item.title = item_name

          el_item.onclick = () => {
            // if (item_el.classList.contains('am-hide')) {
            //   activeAMPanel?.panel_show(undefined, [item_name])
            // } else {
            //   activeAMPanel?.panel_hide([item_name])
            // }
          }
        }
      }
      else {
        is_show = false
        btn.classList.remove('active')
        el_panel_list.classList.add('am-hide')
      }
    })
  }
}
