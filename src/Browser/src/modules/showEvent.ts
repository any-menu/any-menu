import { global_setting } from '@/Core/shared/setting'
import { activeAMPanel } from '@/Core/panels/MulPanel'

export function addShowPanelBtn(btn: HTMLElement) {
  // 非失焦的按钮行为
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault(); // 阻止默认行为（阻止按钮获取焦点）
    e.stopPropagation();
    // 手动创建一个 click 事件并立即派发 (触发click但不触发焦点改变)
    btn.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  });
  btn.onclick = () => {
    if (!activeAMPanel) return
    activeAMPanel.panel_hide()
    activeAMPanel.panel_show(
      {x: 30, y: 200, is_reverse: false},
      [...global_setting.config.panel_preset2[0].list, 'debug'],
      true
    )
  }
}
