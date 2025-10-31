import { global_setting } from "../../../Core/setting"
import { OuterEditor } from "@editableblock/cm/dist/EditableBlock/src/OuterEditor"
import { EditableBlock_Cm } from "@editableblock/cm/dist/EditableBlock_Cm/src/"
import { type RangeSpec_None } from "@editableblock/cm/dist/EditableBlock_Cm/src/selector"

export class AMMiniEditor {
  public el_parent: HTMLElement;
  public el: HTMLElement;

  public cache_text: string = ''
  public editableBlock_cm: EditableBlock_Cm

  static factory(
    el_parent: HTMLElement,
  ): AMMiniEditor {
    const amMiniEditor = new AMMiniEditor(el_parent)
    // if (el_input) abContextMenu.bind_arrowKeyArea(el_input)
    return amMiniEditor
  }

  constructor(
    el_parent: HTMLElement,
  ) {
    this.el_parent = el_parent
    this.el = document.createElement('div'); el_parent.appendChild(this.el); this.el.classList.add('am-mini-editor');
    this.hide()

    // buttons
    const editor = document.createElement('div'); this.el.appendChild(editor);
    const buttons = document.createElement('div'); this.el.appendChild(buttons);
    const btn_save = document.createElement('button'); buttons.appendChild(btn_save); btn_save.textContent = 'Save';
    const btn_md_mode = document.createElement('button'); buttons.appendChild(btn_md_mode); btn_md_mode.textContent = 'Md mode';
    const btn_source_mode = document.createElement('button'); buttons.appendChild(btn_source_mode); btn_source_mode.textContent = 'Source mode';

    // EditableBlock
    this.cache_text = 'test Mini Editor2' // TODO tmp
    const rangeSpec_None: RangeSpec_None = {
      type: 'none',
      fromPos: 0,
      toPos: 0,
      text_content: this.cache_text,
      text_lang: '',
      parent_prefix: '',
    }
    const outterEditor = new OuterEditor();
    outterEditor.save = (str_with_prefix: string): Promise<void> => { // force_refresh?: boolean | undefined
      this.cache_text = str_with_prefix
      return Promise.resolve()
    }
    this.editableBlock_cm = new EditableBlock_Cm(rangeSpec_None, editor, outterEditor)
    this.editableBlock_cm.emit_render()
  }

  // #region 显示/隐藏菜单

  show(x?: number, y?: number, new_text?: string, is_focus: boolean = false) {
    this.el.classList.remove('am-hide');

    if (x !== undefined) this.el.style.left = `${x}px`
    if (y !== undefined) this.el.style.top = `${y}px`
    if (new_text !== undefined) this.cache_text = new_text

    this.editableBlock_cm.rangeSpec.text_content = this.cache_text
    this.editableBlock_cm.update_content(this.cache_text)

    // 显示后聚焦，否则 focus 无效
    ;(() => {
      if (!is_focus) return
      if (!global_setting.focusStrategy) return
      this.editableBlock_cm.focus(0, this.cache_text.length + 2) // [!code warn] 我也没明白为什么要+2
    })();

    window.addEventListener('click', this.visual_listener_click)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }

  hide() {
    if (global_setting.state.isPin) return
    this.el.classList.add('am-hide');

    window.removeEventListener('click', this.visual_listener_click)
    window.removeEventListener('keydown', this.visual_listener_keydown)
  }

  visual_listener_click = (ev: MouseEvent) => {
    if (!this.el) return
    if (this.el.contains(ev.target as Node)) return
    this.hide()
  }

  visual_listener_keydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') this.hide()
  }

  // #endregion
}
