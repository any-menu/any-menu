import {
  MarkdownView, Plugin, type Editor
} from 'obsidian'
import { global_setting } from '@/Core/shared/setting'

export * from './event'

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
