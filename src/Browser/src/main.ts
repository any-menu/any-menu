/** 主面板相关 */

import { global_setting } from '../../Core/shared/setting'
import { activeAMPanel, AMPanel } from "../../Core/panels/MulPanel"
import { initMenuData } from "../../Core/initTool"
import { initApi } from './utils/initApi'

initApi()

// #region 启动时阅读配置文件

let is_init = false
async function init() {
  if (is_init) return
  is_init = true
  const result = await global_setting.api.loadConfig()
  if (!result) { console.error('配置文件读取/初始化失败'); return }
}

// #endregion

// 前端模块
window.addEventListener("DOMContentLoaded", async () => {
  const main_el: HTMLDivElement | null = document.querySelector("#main")
  console.log('测试测试', main_el, document)
  if (!main_el) return

  await init() // 保证先读取配置再初始化别的

  // 临时 debug
  {
    const btn = document.createElement('button'); main_el.appendChild(btn);
      btn.innerText = 'Test, show panel'
      btn.onclick = () => { activeAMPanel?.panel_show(undefined) }
  }

  // initMenu
  {
    const el_panel = document.createElement('div'); main_el.appendChild(el_panel);
    // 搜索框和多级菜单 - 元素
    AMPanel.factory(el_panel)
    // 搜索框和多极菜单 - 数据内容
    void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
  }

  // 置顶按钮 (仅 debug 时显示)
  if (!global_setting.isDebug) return;
  const pin_btn = document.createElement('button'); main_el.appendChild(pin_btn); pin_btn.classList.add('btn-1', 'windows-pin');
  // https://lucide.dev/icons/pin
  global_setting.api.saveInnerHTML(pin_btn, `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`)
  pin_btn.addEventListener('click', () => {
    global_setting.api.pin()
  })
})
