import { AMPanel } from "../../../Core/panel"
// import { ABContextMenu } from "../../../Core/panel/contextmenu"
// import { AMSearch } from "../../../Core/panel/search"
import { initMenuData } from "../../../Core/panel/initTool"

/// 初始化菜单
export async function initMenu(el: HTMLElement) {
  const el_panel = document.createElement('div'); el.appendChild(el_panel); el_panel.classList.add('am-panel');
  // 搜索框和多级菜单 - 元素
  AMPanel.factory(el_panel)
  // 搜索框和多极菜单 - 数据内容
  void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
}
