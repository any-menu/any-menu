import { AMPanel, global_el } from "../../../Core/panel"
// import { ABContextMenu } from "../../../Core/panel/contextmenu"
// import { AMSearch } from "../../../Core/panel/search"
import { initMenuData } from "../../../Core/panel/initTool"

/// 初始化菜单
/// TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
export async function initMenu(el: HTMLElement) {
  // 搜索框和多级菜单 - 元素
  AMPanel.factory(el)
  // 搜索框和多极菜单 - 数据内容
  void initMenuData()
}
