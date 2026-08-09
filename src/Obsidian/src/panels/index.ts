import {
  MarkdownView, Plugin, type Editor
} from 'obsidian'
import { t } from '@/Core/shared/locales/helper'
import { AMPanel, activeAMPanel } from '@/Core/panels/MulPanel'
// import { ABContextMenu } from '@/Core/panels/contextmenu/index'
// import { AMSearch } from "@/Core/panels/search"
import { initMenuData } from "@/Core/initTool"
import { global_setting } from '@/Core/shared/setting'
// import { root_menu } from "@/Core/panels/contextmenu/demo"

export * from './DocumentListeners'
export { registerAMContextMenu_Ob } from './ABContextMenu_Ob'

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

// #region 通用部分

/** 获取游标和选区位置，还有对一些信息的采集
 * @param plugin 有editor优先用editor，没有则尝试通过plugin获取当前活动的editor
 */
export function getCursorInfo(plugin: Plugin, editor?: Editor): {
  editor: Editor,
  pos: {left: number, top: number, right: number, bottom: number}
} | void {
  // editor
  if (!editor) {
    const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView); 
    if (!activeView) {
      console.warn('没有活动的 Markdown 编辑器')
      return
    }
    editor = activeView.editor
  }

  // cursor
  const cursor = editor.getCursor(); // {line, ch}

  // selected
  // const from = editor.getCursor('from')
  // const to = editor.getCursor('to')
  const selectedText = editor.getSelection()
  global_setting.state.selectedText = selectedText.length > 0 ? selectedText : undefined

  // activeDoc
  global_setting.state.activeAppName = 'obsidian'
  const activeFile = plugin.app.workspace.getActiveFile()
  if (activeFile) {
    global_setting.state.activeDocTitle = activeFile.basename
    global_setting.state.activeDocUrl = activeFile.path
  }

  // xyPosition - 方法1, CodeMirror 的 coordsAtPos
  // @ts-ignore
  const cm = editor.cm;
  if (cm) {
    const coords = cm.coordsAtPos(editor.posToOffset(cursor)) // CodeMirror 6
    
    if (coords) {
      // console.log('cursor xyPosition, cm pos', coords)
      
      return {
        editor: editor,
        pos: { left: coords.left, top: coords.top, right: coords.right, bottom: coords.bottom }
      }
    }
  }

  // xyPosition - 方法2, DOM 元素定位
  const cursorElement = getCursorElement();
  if (cursorElement) {
    const rect = cursorElement.getBoundingClientRect()
    // console.log('cursor xyPosition, cursorEl pos', rect)

    return {
      editor: editor,
      pos: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
    }
  }
  function getCursorElement(): HTMLElement | null {
    // 查找 CodeMirror 光标元素
    const cursor = activeDocument.querySelector('.cm-cursor') as HTMLElement
    return cursor
  }
}

// #endregion
