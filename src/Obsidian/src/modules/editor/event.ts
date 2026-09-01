/**
 * modi from Core event.ts and https://github.com/chrisgurney/obsidian-note-toolbar/blob/ae125b8380639a998b253979fad7bbae6baf2ff4/src/Listeners/DocumentListeners.ts
 */

import { type Plugin, MarkdownView, ItemView } from "obsidian"
import { global_setting } from "@/Core/shared/setting"
import { activeAMPanel } from "@/Core/panels/MulPanel"
import { DocumentListeners as DocumentListeners_ } from "@/Core/modules/editor/event"
import { get_selection_el } from "@/Core/modules/editor/cursor"
import { getCursorInfo } from "./cursor"

export class DocumentListeners extends DocumentListeners_ {
  constructor(
    private plugin: Plugin
  ) {
    super()
  }

  public override register() {
    if (!global_setting.config.auto_show_toolbar_on_select) return

    // [!code hl] obsidian 专属版本
    this.plugin.registerDomEvent(activeDocument, 'contextmenu', this.onContextMenu);
    this.plugin.registerDomEvent(activeDocument, 'dblclick', this.onDoubleClick);
    this.plugin.registerDomEvent(activeDocument, 'keydown', this.onKeyDown);
    this.plugin.registerDomEvent(activeDocument, 'keyup', this.onKeyUp);
    this.plugin.registerDomEvent(activeDocument, 'mousemove', this.onMouseMove);
    this.plugin.registerDomEvent(activeDocument, 'mouseup', this.onMouseUp);
    this.plugin.registerDomEvent(activeDocument, 'mousedown', this.onMouseDown);
    this.plugin.registerDomEvent(activeDocument, 'selectionchange', this.onSelectionChange);
  }

  public override unregister() {
    // [!code hl] obsidian 专属版本
    // 无实现
    // obsidian 的 `registerDomEvent` 相较于原生的 `addEventListener`，可以在插件卸载时自动取消注册
  }

  protected override updateSelectedText() {
    // 1. 选区状态更新的过滤规则
    {
      const el: HTMLElement|null = get_selection_el()
      // 不匹配在弹出的工具栏/菜单上的选中行为
      if (el && el.closest(`.am-panel`) !== null) { // 无法获取 el 也为不在 panel 上
        return
      }
      // 只匹配某些 class 中/编辑模式下的选中项
      // 略，暂无此白名单
    }

    // 2. 更新当前的选中状态
    // isCollapsed 更快，且其为 true 而文本串为空是可能的，表示有一个无文本选区
    const selection = activeDocument.getSelection()
    if (!selection || selection.isCollapsed || selection.toString() === '') { // 无选中
      this.previewSelection = null; global_setting.state.selectedText = undefined;
    }
    else { // 有选中
      this.previewSelection = selection; global_setting.state.selectedText = selection.toString();
    }
  }

  protected override async getMsg_and_showPanel() {
    // 1. 筛选条件 - 需选中文本且在指定的面板上选中
    {
      if (!global_setting.config.auto_show_toolbar_on_select) return // 不开启选中自动弹出
      if (!this.previewSelection) return // 没有选择

      // 不匹配在 amPanel 上的选中行为
      // 略，下面的判断覆盖这个

      // 只匹配某些 class 中/编辑模式下的选中项
      const selectedText = getSelection_editor(this.plugin)
      if (!selectedText) {
        this.previewSelection = null
        return
      }

      // 其他
      if (!activeAMPanel) return
    }

    // 2. 环境获取
    let panel_list: string[]
    let final_pos: {x: number; y: number; is_reverse: boolean;}
    {
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView) return
      const editor = activeView.editor

      // 显示列表
      panel_list = global_setting.config.panel_preset2[1].list

      // 光标位置 // [!code hl] (右上)
      const cursorInfo = getCursorInfo(this.plugin, editor)
      if (!cursorInfo) {
        console.warn('获取光标位置失败')
        return
      }
      const pos = cursorInfo.pos

      // 光标修正 - 通过屏幕尺寸和面板尺寸，计算触底对齐/反向显示后的坐标
      const screen_size = { width: window.innerWidth, height: window.innerHeight }
      const panel_size = activeAMPanel.get_size(panel_list)
      final_pos = activeAMPanel.fix_position(screen_size, panel_size, pos, "side", "center", "top")
    }

    // 3. 显示面板
    {
      if (global_setting.state.isPin) return // 已置顶 // (不能放前面，信息采集是需要的，如光标位置的获取会自动更新当前选中的文本)
      activeAMPanel.panel_hide()
      activeAMPanel.panel_show(
        {x: final_pos.x, y: final_pos.y, is_reverse: final_pos.is_reverse},
        panel_list,
        false, // 注意: 划词模式应强制为 false，不使用设置的 is_focus 选项
      )
    }
  }
}

// [!code hl] obsidian 专属版本，且只匹配某些 class 中/编辑模式下的选中项
function getSelection_editor(plugin: Plugin, previewOnly: boolean = false): string|null {
  const editor = plugin.app.workspace.activeEditor?.editor;
  const view = plugin.app.workspace.getActiveViewOfType(ItemView);
  if (!(view instanceof MarkdownView)) return null

  const mode = view.getMode();
  const isPreviewMode = (mode === 'preview');
  
  // 检查选择是否处于嵌入状态（用于编辑模式）
  let isInEmbed = false;
  if (!isPreviewMode) {
    const selectionNode = activeDocument.getSelection()?.focusNode;
    const element = (selectionNode as HTMLElement)?.closest ? 
      (selectionNode as HTMLElement) : 
      (selectionNode as Node)?.parentElement;
    isInEmbed = !!element?.closest('.markdown-embed');
  }
  
  // 如果设置了 PreviewOnly 标志，则仅返回预览模式或嵌入的选择
  if (previewOnly && !isPreviewMode && !isInEmbed) {
    return null
  }
  
  // 在预览模式或嵌入中，使用文档选择
  if (isPreviewMode || isInEmbed) {
    const documentSelection = activeDocument.getSelection();
    const selectedText = documentSelection?.toString().trim();
    if (selectedText) return selectedText;
  }
  
  // 在编辑模式下（不在嵌入模式下），使用编辑器选择
  if (!isPreviewMode && !isInEmbed && editor) {
    const selection = editor.getSelection();
    if (selection) return selection;

    // 或返回光标处的单词（如果有的话）
    const cursor = editor.getCursor();
    const wordRange = editor.wordAt(cursor);
    if (wordRange) return editor.getRange(wordRange.from, wordRange.to);
  }

  return null
}
