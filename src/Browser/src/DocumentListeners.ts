/**
 * ## 设计要点 (插件版和 app 版通用)
 * 
 * 这里设计一套 "选中文本自动弹出面板" 的通用交互逻辑，
 * 插件版 (Obsidian / Browser / 其他document版) 和 app 版都使用这套逻辑，避免分别实现两套逻辑导致的差异和维护成本
 * 
 * (1) 监听事件 - 面板未出现时
 * 
 * - 键盘按下 (无需监听抬起)
 * - 鼠标按下和抬起鼠标
 *   - 右键按下事件/上下文菜单事件
 * - 鼠标双击 (双击选中)
 * - ~~选择改变~~ (这个仅在浏览器版本可以被监听，在 app 版本难以直接监听到)
 * - 鼠标移动 (可选，不一定)
 * 
 * (2) 监听事件 - 面板出现后
 * 
 * - 截取全局的 Esc 事件，用于关闭面板 (可选)
 * 
 * (3) 面板属性
 * 
 * - 不自动聚焦 (非焦点式的)
 *   (只有主动唤出面板才应该抢焦点，否则不应该抢焦点)
 * - 倒置翻转显示 (不要遮挡当前选中文本的下面的内容，优先在上方显示，避免影响用户原来的进一步操作)
 *   (只有主动唤出才可在下面显示)
 */

import { global_setting } from "@/Core/shared/setting"
import { activeAMPanel, AMPanel } from "@/Core/panels/MulPanel"

export class DocumentListeners {

  public isContextOpening: boolean = false;
  public isKeyboardSelection: boolean = false;  // 键盘选择状态 (互斥a)，上次的按下键是键盘键
  public isMouseSelecting: boolean = false;     // 鼠标选择状态 (互斥a)，上次的按下键是鼠标键
  public isMouseDown: boolean = false;          // 鼠标按下状态 (仅用于标注拖拽行为)

	// 跟踪指针位置，用于放置用户界面元素
	public pointerX: number = 0;
	public pointerY: number = 0;

  // 当前文本选择
  private previewSelection: Selection | null = null;

  constructor(
    private plugin: Plugin
  ) {}

  public register() {
    if (!global_setting.config.auto_show_toolbar_on_select) return

    document.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('dblclick', this.onDoubleClick);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('selectionchange', this.onSelectionChange);
  }

  public unregister() {
    document.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('dblclick', this.onDoubleClick);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  onContextMenu = () => {
    this.isContextOpening = true;
  }

  /** 通过双击选择 */
  onDoubleClick = async (_event: MouseEvent) => {
    this.isKeyboardSelection = false; this.isMouseSelecting = true;

    // 选区改变事件是异步的，可能发生在双击行为之后
    window.setTimeout(() => void this.showPanel(), 10);
  }

  /** 键盘按下事件 */
  onKeyDown = (ev: KeyboardEvent) => {
    this.isKeyboardSelection = true; this.isMouseSelecting = false;
    this.isMouseDown = false;

    // 按 Esc，无论是否在面板上按，都隐藏
    if (ev.key === 'Escape') {
      activeAMPanel?.panel_hide([])
      return
    }

    // if (ev.shiftKey == true || altKey) return // 目前是选择结束而非过程弹出，故连选过程也先取消
    // 面板上工作，不管
    if (!(ev.target instanceof Element)) return
    if (ev.target.matches('.am-panel *')) return
    activeAMPanel?.panel_hide([])
  }

  /** 键盘抬起事件 */
  onKeyUp = (ev: KeyboardEvent) => {
    // this.isKeyboardSelection = true; this.isMouseSelecting = false; // 注释，只记录该松开行为的上一个操作
    this.isMouseDown = false;

    if (ev.key === 'Shift' || ev.key === 'Alt') { // shift+鼠标/键盘，以及alt+鼠标都可以连选
      // 设置定时器是因为 SelectionChange 事件是异步的，并且可能不会在 keyup 之前触发
      if (this.isKeyboardSelection) window.setTimeout(() => void this.showPanel(), 10);
    }
  }

  /** 鼠标按下事件 */
  onMouseDown = (ev: MouseEvent) => {
    // // 在底部工具栏中，当点击项目时防止手机导航栏出现
    // if (Platform.isPhone && this.ntb.render.phoneTbarPosition === PositionType.Bottom) {
    //   const target = event.target as HTMLElement;
    //   const isToolbar = (target.closest('.cg-note-toolbar-container') !== null);
    //   if (isToolbar) event.stopPropagation();
    // }

    this.isKeyboardSelection = false; this.isMouseSelecting = true;
    this.isMouseDown = true;

    // if (ev.altKey == true && ev.button === 0) return // 目前是选择结束而非过程弹出，故连选过程也先取消
    // 面板上工作，不管
    if (!(ev.target instanceof Element)) return
    if (ev.target.matches('.am-panel *')) return
    activeAMPanel?.panel_hide([])
  }

  /**
   * 鼠标松开事件
   * 我们还监听文档以捕获编辑器之外的鼠标释放
   */
  onMouseUp = async (_event: MouseEvent) => {
    // this.isKeyboardSelection = false; this.isMouseSelecting = true; // 注释，只记录该松开行为的上一个操作
    this.isMouseDown = false;

    if (!global_setting.config.auto_show_toolbar_on_select) return
    if (!this.previewSelection) return
    // 设置定时器是因为 SelectionChange 事件是异步的，并且可能不会在 mouseup 之前触发
    if (this.isMouseSelecting) window.setTimeout(() => void this.showPanel(), 10);

    this.isMouseSelecting = false;
  }

  /** 追踪鼠标位置 */
  onMouseMove = (event: MouseEvent) => {
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    if (this.isMouseDown) {
      this.isKeyboardSelection = false; this.isMouseSelecting = true;
    }
  }

  /**
   * 选择文本改变事件
   * 跟踪任何文档选择，但仅限于预览模式
   * 
   * 使用在预览模式或 Markdown 嵌入中选择的任何文本更新局部变量
   */
  onSelectionChange = (_event: unknown) => {
    // 只匹配某些 class 中/编辑模式下的选中项
    const selectedText = getSelection_editor()
    if (!selectedText) {
      this.previewSelection = null
      return
    }

    // 任意元素选中
    // isCollapsed 更快，且其为 true 而文本串为空是可能的，表示有一个无文本选区
    const selection = document.getSelection()
    if (!selection || selection.isCollapsed) {
      this.previewSelection = null
      return
    }

    this.previewSelection = selection
  }

  /**
   * 在预览模式下显示文本工具栏以供选择
   * 
   * 无选择内容则不工作
   * 
   * 注意: 和手动显示不同:
   * - 在字符的上方显示
   * - 必须是非聚焦显示
   * - 如果为 pin 状态，则不要重置位置 (也可以不执行 show 函数了)
   */
  private async showPanel() {
    if (!global_setting.config.auto_show_toolbar_on_select) return // 不开启选中自动弹出
    if (!this.previewSelection) return // 没有选择
  
    void show_panel_auto(
      global_setting.config.panel_preset2[1].list,
      // global_setting.config.panel_preset2[1].is_focus
      false // 注意: 划词模式应强制为 false，不使用设置的 is_focus 选项
    )

    async function show_panel_auto (panel_list?: string[], is_focus?: boolean) {
      // 1. 光标位置 // [!code hl] (右上)
      const cursorInfo = getCursorInfo()
      if (!cursorInfo) return
      const cursor = { x: cursorInfo.pos.right, y: cursorInfo.pos.top }

      // 2. 光标修正 - 屏幕尺寸
      const screen_size = { width: window.innerWidth, height: window.innerHeight }

      // 2. 光标修正 - 面板尺寸，并计算触底对齐/反向显示后的坐标
      const panel_size: { width: number, height: number } = (activeAMPanel?.get_size(panel_list ?? [])) ?? {width:0, height:0}
      const cursor3 = AMPanel.fix_position(screen_size, panel_size, cursor, "revert", true)

      // 2. 光标修正 - 微小偏移，若 reverse 要反向 (TODO 如果触底后反向显示，则会偏移错误)
      {
        // cursor3.x += 2 (中心模式，不偏移)
        cursor3.y -= 2
      }

      // 3. 显示面板
      if (global_setting.state.isPin) return // 已置顶 // (不能放前面，信息采集是需要的，如光标位置的获取会自动更新当前选中的文本)
      activeAMPanel?.panel_show({x: cursor3.x, y: cursor3.y}, panel_list, is_focus, true)
    }
  }
}

// 只匹配某些 class 中/编辑模式下的选中项
function getSelection_editor(): string|null {
  return 'flag_getSelection_editor'
}

/** 获取游标和选区位置，还有对一些信息的采集 */
function getCursorInfo(): {
  pos: {left: number, top: number, right: number, bottom: number}
} | void {
  return
}
