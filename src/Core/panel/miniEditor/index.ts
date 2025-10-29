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
    this.el_parent = el_parent;
    this.el = document.createElement('div'); el_parent.appendChild(this.el); this.el.classList.add('am-mini-editor');

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
    outterEditor.save = (str_with_prefix: string, force_refresh?: boolean | undefined): Promise<void> => {
      this.cache_text = str_with_prefix
      return Promise.resolve()
    }
    this.editableBlock_cm = new EditableBlock_Cm(rangeSpec_None, this.el, outterEditor)
    this.editableBlock_cm.emit_render()
  }

  show(x?: number, y?: number, new_text?: string) {
    this.el.classList.remove('am-hide');

    if (x !== undefined) this.el.style.left = `${x}px`
    if (y !== undefined) this.el.style.top = `${y}px`
    if (new_text !== undefined) this.cache_text = new_text

    // 显示后聚焦，否则 focus 无效
    ;(() => {
      if (!global_setting.focusStrategy) return
      this.el?.focus()
    })();

    this.editableBlock_cm.rangeSpec.text_content = this.cache_text
    this.editableBlock_cm.update_content(this.cache_text)
  }

  hide() {
    this.el.classList.add('am-hide');
  }
}
