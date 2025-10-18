import { AMPanel } from "../../../Core/panel/"
// import { ABContextMenu } from "../../../Core/panel/contextmenu"
// import { AMSearch } from "../../../Core/panel/search"
import { initMenuData } from "../../../Core/panel/search/initTool"

/// 初始化菜单
/// TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
export async function initMenu(el: HTMLElement) {
  // 搜索框和多级菜单 - 元素
  const { amContextMenu } = AMPanel.factory(el)
  // AMSearch.factory(el)
  // const myMenu = ABContextMenu.factory(el)
  // myMenu.append_headerEditor('header test', ()=>{})

  // 搜索框和多极菜单 - 数据内容
  void initMenuData(amContextMenu)
}
