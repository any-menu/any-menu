/**
 * modi from https://github.com/chrisgurney/obsidian-note-toolbar/blob/ae125b8380639a998b253979fad7bbae6baf2ff4/src/Listeners/DocumentListeners.ts
 */

import { global_setting } from "@/Core/setting"
import { getCursorInfo } from "."
import { AMPanel } from "@/Core/panel"
import { type Editor, type Plugin, MarkdownView, Platform } from "obsidian"

const enum PositionType {
	Bottom = 'bottom',
	FabLeft = 'fabl',
	FabRight = 'fabr',
	Floating = 'float',
	Hidden = 'hidden',
	Menu = 'menu',
	Props = 'props',
	QuickTools = 'quicktools',
	TabBar = 'tabbar',
	Text = 'text',
	Top = 'top'
}

export default class DocumentListeners {

  public isContextOpening: boolean = false;
  public isKeyboardSelection: boolean = false;  // 键盘选择状态 (互斥a)
  public isMouseDown: boolean = false;          // 鼠标按下状态
  public isMouseSelecting: boolean = false;     // 鼠标选择状态 (互斥a)

	// 跟踪指针位置，用于放置用户界面元素
	public pointerX: number = 0;
	public pointerY: number = 0;

  // 当前文本选择
  private previewSelection: Selection | null = null;

  constructor(
    private ntb: Plugin
  ) {}

  public register() {
    if (!global_setting.config.auto_show_toolbar_on_select) return

    this.ntb.registerDomEvent(activeDocument, 'contextmenu', this.onContextMenu);
    this.ntb.registerDomEvent(activeDocument, 'dblclick', this.onDoubleClick);
    this.ntb.registerDomEvent(activeDocument, 'keydown', this.onKeyDown);
    this.ntb.registerDomEvent(activeDocument, 'mousemove', this.onMouseMove);
    this.ntb.registerDomEvent(activeDocument, 'mouseup', this.onMouseUp);
    this.ntb.registerDomEvent(activeDocument, 'mousedown', this.onMouseDown);
    this.ntb.registerDomEvent(activeDocument, 'selectionchange', this.onSelectionChange);
  }

  onContextMenu = () => {
    this.isContextOpening = true;
  }

  // 通过双击选择
  onDoubleClick = async (_event: MouseEvent) => {
    // possible issue? not always true?
    this.isMouseSelecting = true;
    // timeout is because selectionchange event is asynchronous and might not fire before mouseup
    setTimeout(() => this.renderPreviewTextToolbar(), 10);
  }

  onKeyDown = (event: KeyboardEvent) => {
    this.isKeyboardSelection = true;
    this.isMouseSelecting = false;
    this.isMouseDown = false;
    if (event.key === 'Escape' && this.ntb.render.hasFloatingToolbar()) {
      this.ntb.render.removeFloatingToolbar();
    }
  }
  
  onMouseDown = (event: MouseEvent) => {
    // // 在底部工具栏中，当点击项目时防止手机导航栏出现
    // if (Platform.isPhone && this.ntb.render.phoneTbarPosition === PositionType.Bottom) {
    //   const target = event.target as HTMLElement;
    //   const isToolbar = (target.closest('.cg-note-toolbar-container') !== null);
    //   if (isToolbar) event.stopPropagation();
    // }

    this.isKeyboardSelection = false;
    this.isMouseDown = true;
    // TODO? 如果点击位置不在浮动工具栏内（或其菜单等区域），则是否应关闭浮动工具栏？
    // const clickTarget = event.target as Node;
    // const toolbarEl = this.ntb.render.floatingToolbarEl;
    if (this.ntb.render.floatingToolbarEl && !this.ntb.render.floatingToolbarEl.contains(event.target as Node)) {
      this.ntb.render.removeFloatingToolbar();
    }
  }

  /** 追踪鼠标位置 */
  onMouseMove = (event: MouseEvent) => {
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    if (this.isMouseDown) {
      this.isKeyboardSelection = false;
      this.isMouseSelecting = true;
    }
  }

  /**
   * 我们还监听文档以捕获编辑器之外的鼠标释放
   */
  onMouseUp = async (_event: MouseEvent) => {
    // this.ntb.debug('onMouseUp');
    this.isMouseDown = false;
    this.isMouseSelecting = false;
    if (!global_setting.config.auto_show_toolbar_on_select) return
    if (!this.previewSelection) return
    // 超时是因为 SelectionChange 事件是异步的，并且可能不会在 mouseup 之前触发
    if (this.isMouseSelecting) setTimeout(() => this.renderPreviewTextToolbar(), 10);
  }

  /**
   * 跟踪任何文档选择，但仅限于预览模式
   */
  onSelectionChange = (_event: any) => {
    // this.ntb.debug('onSelection');
    this.updatePreviewSelection();
  }

  /**
   * 在预览模式下显示文本工具栏以供选择
   */
  private async renderPreviewTextToolbar() {
    if (!global_setting.config.auto_show_toolbar_on_select) return
    if (!this.previewSelection) return
  
    show_panel(plugin)
  }

  /**
   * 使用在预览模式或 Markdown 嵌入中选择的任何文本更新局部变量
   */
  private updatePreviewSelection() {
    const selectedText = this.ntb.utils.getSelection(true); // only get text for preview mode/embeds
    const selection = activeDocument.getSelection();
    const hasSelection = selectedText && selection && !selection.isCollapsed;
    this.previewSelection = hasSelection ? selection : null;
  }
}

const show_panel = async (plugin: Plugin, editor: Editor, _view: MarkdownView | unknown, panel_list?: string[]) => {
  // 1. 光标位置
  const cursorInfo = getCursorInfo(plugin, editor)
  if (!cursorInfo) return
  const cursor = { x: cursorInfo.pos.right, y: cursorInfo.pos.bottom }

  // 2. 光标修正 - 屏幕尺寸
  const screen_size = { width: window.innerWidth, height: window.innerHeight }

  // 2. 光标修正 - 面板尺寸，并计算触底对齐/反向显示后的坐标
  const panel_size = AMPanel.get_size(panel_list)
  const cursor3 = AMPanel.fix_position(screen_size, panel_size, cursor, "revert")

  // 3. 显示面板 // TODO 和手动显示不同，这里最好默认在字符的上方显示，并且必须是非聚焦显示
  AMPanel.show({x: cursor3.x + 2, y: cursor3.y + 2}, panel_list)
}
