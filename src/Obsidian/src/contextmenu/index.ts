import {
  MarkdownView, Plugin, type Editor
} from 'obsidian'
import { AMPanel } from '@/Core/panel/'
// import { ABContextMenu } from '@/Core/panel/contextmenu/index'
// import { AMSearch } from "@/Core/panel/search"
import { initMenuData } from "@/Core/panel/search/initTool"
import { global_setting } from '@/Core/setting'
// import { root_menu } from "@/Core/panel/contextmenu/demo"

export * from './ABContextMenu_Ob'

// 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
export function registerAMContextMenu(plugin: Plugin) {
  // 搜索框和多极菜单 - 元素
  const { amSearch, amContextMenu } = AMPanel.factory(document.body as HTMLElement)
  // const amSearch = AMSearch.factory(document.body as HTMLElement)
  // const amContextMenu = new ABContextMenu(document.body as HTMLElement)

  // 搜索框和多极菜单 - 数据内容
  void initMenuData(amContextMenu)
  // amContextMenu.append_data(root_menu)

  // 注册命令
  plugin.addCommand({
    id: 'any-menu-panel',
    name: '展开 AnyMenu 面板',
    // callback: () => {},
    editorCallback: (editor, view) => { // 仅于编辑器界面才能触发的回调
      const cursorInfo = getCursorInfo(plugin, editor);
      if (cursorInfo) {
        amSearch.show(cursorInfo.pos.left + 2, cursorInfo.pos.bottom + 2)
        amContextMenu.visual_show(cursorInfo.pos.left + 2, cursorInfo.pos.bottom + 2 + 32)
      }
    },
    hotkeys: [ // 官方说: 如有可能尽量避免设置默认快捷键，以避免与用户设置的快捷键冲突，尽管用户快捷键优先级更高
      { modifiers: ["Alt"], key: "S" }
    ]
  })

  // 注册工具带
  plugin.addRibbonIcon('crosshair', '展开 AnyMenu 面板', () => {
    const cursorInfo = getCursorInfo(plugin)
    if (cursorInfo) {
      amSearch.show(cursorInfo.pos.left + 2, cursorInfo.pos.bottom + 2)
      amContextMenu.visual_show(cursorInfo.pos.left + 2, cursorInfo.pos.bottom + 2 + 32)
    }
  })
}

// #region 通用部分

/** 获取游标位置
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
    const cursor = document.querySelector('.cm-cursor') as HTMLElement
    return cursor
  }
}

// #endregion
