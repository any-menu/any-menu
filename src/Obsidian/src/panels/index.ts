import {
  Plugin, type Editor
} from 'obsidian'
import { t } from '@/Core/shared/locales/helper'
import { AMPanel, activeAMPanel } from '@/Core/panels/MulPanel'
import { initMenuData } from "@/Core/initTool"
import { global_setting } from '@/Core/shared/setting'
import { getCursorInfo } from '../modules/editor/cursor'

export * from '../modules/editor/event'

// 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
export function registerAMContextMenu(plugin: Plugin) {
  // 搜索框和多极菜单 - 元素
  AMPanel.factory(activeDocument.body)
  // 搜索框和多极菜单 - 数据内容
  void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成

  // 注册命令
  plugin.addCommand({
    id: 'any-menu-panel-1',
    name: t('Show panel: preset 1'),
    // callback: () => {},
    editorCallback: async (editor, _view) => { // 仅于编辑器界面才能触发的回调
      void show_panel(editor,
        global_setting.config.panel_preset2[0].list,
        global_setting.config.panel_preset2[0].is_focus
      )
    },
    // hotkeys: [ // 官方说: 如有可能尽量避免设置默认快捷键，以避免与用户设置的快捷键冲突，尽管用户快捷键优先级更高
    //   { modifiers: ["Alt"], key: "A" }
    // ]
  })
  plugin.addCommand({
    id: 'any-menu-panel-2',
    name: t('Show panel: preset 2'),
    // callback: () => {},
    editorCallback: (editor, _view) => {
      void show_panel(editor,
        global_setting.config.panel_preset2[1].list,
        global_setting.config.panel_preset2[1].is_focus
      )
    },
    // hotkeys: [
    //   { modifiers: ["Alt"], key: "S" }
    // ]
  })
  plugin.addCommand({
    id: 'any-menu-panel-3',
    name: t('Show panel: preset 3'),
    editorCallback: (editor, _view) => {
      void show_panel(editor,
        global_setting.config.panel_preset2[2].list,
        global_setting.config.panel_preset2[2].is_focus
      )
    },
  })

  const show_panel = async (editor: Editor, panel_list: string[], is_focus?: boolean) => {
    if (!activeAMPanel) return

    // 1. 光标位置 (右下)
    const cursorInfo = getCursorInfo(plugin, editor)
    if (!cursorInfo) return

    // 2. 光标修正 - 通过屏幕尺寸和面板尺寸，计算触底对齐/反向显示后的坐标
    const screen_size = { width: window.innerWidth, height: window.innerHeight }
    const panel_size: { width: number, height: number } = activeAMPanel.get_size(panel_list)
    const ret = activeAMPanel.fix_position(screen_size, panel_size, cursorInfo.pos, "revert", "right", "bottom")

    // 2. 光标修正 - 微小偏移，若 reverse 要反向 (TODO 如果触底后反向显示，则会偏移错误)
    {
      ret.x += 2
      ret.y += 2
    }

    // 3. 显示面板
    activeAMPanel.panel_hide()
    activeAMPanel.panel_show(
      {x: ret.x, y: ret.y, is_reverse: ret.is_reverse},
      panel_list,
      is_focus,
    )
  }

  // 注册工具带
  // plugin.addRibbonIcon('crosshair', '展开 AnyMenu 面板', () => {})
}
