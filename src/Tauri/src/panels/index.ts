import { AMPanel } from "../../../Core/panels/MulPanel"
// import { ABContextMenu } from "../../../Core/panels/contextmenu"
// import { AMSearch } from "../../../Core/panels/search"
import { initMenuData } from "../../../Core/initTool"

/// 初始化菜单
export async function initMenu(el: HTMLElement) {
  // 搜索框和多级菜单 - 元素
  AMPanel.factory(el)
  // 搜索框和多极菜单 - 数据内容
  void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
}
