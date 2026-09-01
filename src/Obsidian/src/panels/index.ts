import { AMPanel } from '@/Core/panels/MulPanel'
import { initMenuData } from "@/Core/initTool"

export * from '../modules/editor/event'

// 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
export function registerAMContextMenu() {
  // 搜索框和多极菜单 - 元素
  AMPanel.factory(activeDocument.body)
  // 搜索框和多极菜单 - 数据内容
  void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
}
