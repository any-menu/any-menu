import { ABContextMenu2 } from "../contextmenu/ABContextMenu2"
import { AMSearch } from "../../../Core/seach"
import { initMenuData } from "../../../Core/seach/initTool"

/// 初始化菜单
/// TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
export async function initMenu(el: HTMLDivElement) {
  // 搜索框和多级菜单 - 元素
  AMSearch.factory(el)
  const myMenu = new ABContextMenu2(el)
  // myMenu.append_headerEditor('header test', ()=>{})

  // 搜索框和多极菜单 - 数据内容
  void initMenuData(myMenu)
}
