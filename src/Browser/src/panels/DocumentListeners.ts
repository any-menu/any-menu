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
import { getCursorInfo } from "./cursorInfo"
import { EditorTools } from "../utils/initApi";

export class DocumentListeners {

  public isContextOpening: boolean = false;
  public isKeyboardSelection: boolean = false;  // 键盘选择状态 (互斥a)，上次的按下键是键盘键
  public isMouseSelecting: boolean = false;     // 鼠标选择状态 (互斥a)，上次的按下键是鼠标键
  public isMouseDown: boolean = false;          // 鼠标按下状态 (仅用于标注拖拽行为)

	// 跟踪指针位置，用于放置用户界面元素
	public pointerX: number = 0;
	public pointerY: number = 0;

  // 当前文本选择
  protected previewSelection: Selection | null = null;

  constructor(
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

  /** 右键/上下文菜单展开事件 */
  onContextMenu = () => {
    this.isContextOpening = true;
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
  onKeyUp = (event: KeyboardEvent) => {
    // this.isKeyboardSelection = true; this.isMouseSelecting = false; // 注释，只记录该松开行为的上一个操作
    this.isMouseDown = false;

    if (!(event.target instanceof Element)) return
    if (event.target.closest('.am-panel')) return
    if (event.key === 'Shift' || event.key === 'Alt') { // shift+鼠标/键盘，以及alt+鼠标都可以连选
      // 设置定时器是因为 SelectionChange 事件是异步的，并且可能不会在 keyup 之前触发
      if (this.isKeyboardSelection) window.setTimeout(() => void this.showPanel(), 10);
    }
  }

  /** 鼠标双击选择 */
  onDoubleClick = async (event: MouseEvent) => {
    this.isKeyboardSelection = false; this.isMouseSelecting = true;

    if (!(event.target instanceof Element)) return
    if (event.target.closest('.am-panel')) return
    // 选区改变事件是异步的，可能发生在双击行为之后
    window.setTimeout(() => void this.showPanel(), 10);
  }

  /** 鼠标按下事件 */
  onMouseDown = (event: MouseEvent) => {
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
    if (!(event.target instanceof Element)) return
    if (event.target.closest('.am-panel')) return
    activeAMPanel?.panel_hide([])
  }

  /**
   * 鼠标松开事件
   * 我们还监听文档以捕获编辑器之外的鼠标释放
   */
  onMouseUp = async (event: MouseEvent) => {
    // this.isKeyboardSelection = false; this.isMouseSelecting = true; // 注释，只记录该松开行为的上一个操作
    this.isMouseDown = false;

    if (!global_setting.config.auto_show_toolbar_on_select) return
    if (!this.previewSelection) return

    if (!(event.target instanceof Element)) return
    if (event.target.closest('.am-panel')) return
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
  onSelectionChange = (_event: Event) => {
    this.updateSelectedText()
  }

  /** 智能更新选区
   * 
   * ## 智能更新规则：
   * 
   * 避免在弹出面板中的选区行为，去影响本来在编辑器区域中的选区事件
   * 主要有两个判断:
   * 1. 判断选区变更时，是否在弹出面板对应的 class 内
   * 2. (可选) 判断选区变更时是否在编辑器对应的 class 内
   * 
   * ## 注意
   * 
   * 此处暂时不更新到 global_setting.state.selectedText 中
   * 原因是还没解决聚焦到 am-panel 上导致原元素上的选择状态变为空的情况
   */
  protected updateSelectedText() {
    const el: HTMLElement|null = DocumentListeners.get_selection_el()

    // 1. 排除
    // 1.1. 不匹配在弹出的工具栏/菜单上的选中行为
    if (el && el.closest(`.am-panel`) !== null) { // 无法获取 el 也认为不在 panel 上
      return
    }
    // 1.2. 只匹配某些 class 中/编辑模式下的选中项
    if (!el) { // 无法获取 el 也认为不在目标元素上
      return
    }

    // 更新当前选中状态 - 光标位置
    if (el && el instanceof HTMLTextAreaElement) {
      EditorTools.saveCurrentCursor(el)
    }

    // 2. 更新当前选中状态 - 选中文本
    // isCollapsed 更快，且其为 true 而文本串为空是可能的，表示有一个无文本选区
    const selection = document.getSelection()
    if (!selection || !selection.isCollapsed || selection.toString() === '') { // 无选中
      this.previewSelection = null; global_setting.state.selectedText = undefined;
    }
    else { // 有选中
      this.previewSelection = selection; global_setting.state.selectedText = selection.toString();
    }
  }

  /**
   * 在预览模式下选中文本后，显示文本工具栏以供选择
   * 
   * 无选择内容则不工作
   * 
   * 注意: 和手动显示不同:
   * - 在字符的上方显示
   * - 必须是非聚焦显示
   * - 如果为 pin 状态，则不要重置位置 (也可以不执行 show 函数了)
   */
  protected async showPanel() {
    if (!global_setting.config.auto_show_toolbar_on_select) return // 不开启选中自动弹出
    if (!this.previewSelection) return // 没有选择
  
    void show_panel_auto()

    async function show_panel_auto () {
      if (!activeAMPanel) return
      
      // 0. 默认参数
      const panel_list = global_setting.config.panel_preset2[1].list

      // 1. 光标位置 // [!code hl] (右上)
      const cursorInfo = getCursorInfo()
      if (!cursorInfo) {
        console.warn('获取光标位置失败')
        return
      }

      // 2. 光标修正 - 通过屏幕尺寸和面板尺寸，计算触底对齐/反向显示后的坐标
      const screen_size = { width: window.innerWidth, height: window.innerHeight }
      const panel_size = activeAMPanel.get_size(panel_list)
      const ret = activeAMPanel.fix_position(screen_size, panel_size, cursorInfo.pos, "side", "center", "top")

      // 3. 显示面板
      if (global_setting.state.isPin) return // 已置顶 // (不能放前面，信息采集是需要的，如光标位置的获取会自动更新当前选中的文本)
      activeAMPanel.panel_hide()
      activeAMPanel.panel_show(
        {x: ret.x, y: ret.y, is_reverse: ret.is_reverse},
        panel_list,
        false, // 注意: 划词模式应强制为 false，不使用设置的 is_focus 选项
      )
    }
  }

  /// 获取选区变化时所在的 el
  /// 可基于此实现 isInPanel (无法判断也返回 false)
  static get_selection_el(): HTMLElement | null {
    const selection = document.getSelection();
    
    // 获取选区变化时的目标元素
    let el: HTMLElement|null
    // 有选区时，取选区所在容器判断
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const node = range.commonAncestorContainer
      el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
    }
    // 无选区时（例如单纯聚焦），检查当前活动元素
    else {
      el = document.activeElement as (HTMLElement | null);
    }

    return el
  }
}
