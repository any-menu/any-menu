import { global_setting } from "../../../Core/setting"
import { OuterEditor } from "@editableblock/cm/dist/EditableBlock/src/OuterEditor"
// import { EditableBlock_Cm } from "@editableblock/cm/dist/EditableBlock_Cm/src/"
import { EditableBlock_Code } from "@editableblock/code/dist/EditableBlock_Code/src/" // [!code hl]
import { type RangeSpec_None } from "@editableblock/cm/dist/EditableBlock_Cm/src/selector"

export class AMMiniEditor {
  public el_parent: HTMLElement;
  public el: HTMLElement;

  public cache_text: string = ''
  // public editableBlock_cm: EditableBlock_Cm
  public editableBlock_cm: EditableBlock_Code  // [!code hl]
  
  isShow = true

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
    // this.editableBlock_cm = new EditableBlock_Cm(rangeSpec_None, this.el, outterEditor)
    this.editableBlock_cm = new EditableBlock_Code(rangeSpec_None, this.el, outterEditor) // [!code hl]
    // this.editableBlock_cm.settings. ...
    this.editableBlock_cm.emit_render() // [!code hl]

    // buttons
    // const editor = document.createElement('div'); this.el.appendChild(editor);
    const buttons = document.createElement('div'); this.el.appendChild(buttons); buttons.classList.add('am-mini-editor-buttons');
    const btn_send = document.createElement('button'); buttons.appendChild(btn_send); btn_send.textContent = 'Send';
      btn_send.title = 'Ctrl+Enter';
      btn_send.onclick = () => {
        global_setting.api.sendText(this.cache_text)
        // 会自动隐藏窗口
      }
    const btn_save = document.createElement('button'); buttons.appendChild(btn_save); btn_save.textContent = 'Save';
      btn_send.title = 'Ctrl+S';
      btn_save.onclick = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        const dir_path = global_setting.config.note_paths
        global_setting.api.writeFile(`${dir_path}${year}-${month}-${day}.md`,
          `## ${hours}:${minutes}:${seconds}.${milliseconds}\n\n${this.cache_text}\n\n`,
          true
        ).catch(err=>{
          console.error('MiniEditor 保存笔记失败', err);
        });
        // TODO Tauri 版本存在bug，Tauri 版本中，鼠标外点会分别隐藏元素+窗口。但这里只会影响元素而不影响窗口
        this.hide(); // 隐藏窗口
      }
    const btn_md_mode = document.createElement('button'); buttons.appendChild(btn_md_mode); btn_md_mode.textContent = 'Md mode';
    const btn_source_mode = document.createElement('button'); buttons.appendChild(btn_source_mode); btn_source_mode.textContent = 'Source mode';
    
  }

  // 用来标记是显示 info 还是 selectedText，避免异步更新进行不合适的覆盖
  flag: 'miniEditor'|'info'|'' = ''
  set_flag(mode: 'miniEditor'|'info') {
    if (mode === 'miniEditor') {
      this.el.classList.remove('am-mini-editor-mode-info')
      this.el.classList.add('am-mini-editor-mode-minieditor')
    } else {
      this.el.classList.remove('am-mini-editor-mode-minieditor')
      this.el.classList.add('am-mini-editor-mode-info')
    }
    this.flag = mode
  }

  // #region 显示/隐藏菜单

  show(x?: number, y?: number, new_text?: string, is_focus: boolean = false) {
    this.el.classList.remove('am-hide'); this.isShow = true;

    if (x !== undefined) this.el.style.left = `${x}px`
    if (y !== undefined) this.el.style.top = `${y}px`
    if (new_text) this.cache_text = new_text
    else { this.cache_text = '' } // 策略应该显示旧内容还是空内容? 若是前者，此处不变。否则此处应该不执行

    this.editableBlock_cm.rangeSpec.text_content = this.cache_text
    // this.editableBlock_cm.update_content(this.cache_text)
    // [!code hl]
    this.editableBlock_cm.outerInfo.source = this.cache_text
    this.editableBlock_cm.innerInfo.source_old = this.cache_text
    this.editableBlock_cm.re_render()

    // 显示后聚焦，否则 focus 无效
    ;(() => {
      if (!is_focus) return
      if (!global_setting.focusStrategy) return
      this.editableBlock_cm.focus(0, this.cache_text.length + 2) // [!code warn] 我也没明白为什么要+2，好像每行都要，换行符? 还是原依赖库有bug
    })();

    window.addEventListener('click', this.visual_listener_click)
    window.addEventListener('keydown', this.visual_listener_keydown)
  }

  hide() {
    if (global_setting.state.isPin) return
    this.el.classList.add('am-hide'); this.isShow = false;

    window.removeEventListener('click', this.visual_listener_click)
    window.removeEventListener('keydown', this.visual_listener_keydown)
  }

  visual_listener_click = (ev: MouseEvent) => {
    if (!this.el) return
    if (this.el.contains(ev.target as Node)) return
    this.hide()
  }

  visual_listener_keydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      this.hide()
      return
    }
    else if (ev.key === 'Enter' && ev.ctrlKey) {
      // 阻止Enter原行为，避免输出结果带尾换行
      // ev.preventDefault() // 不过事件组织的话顺序不对，优先级不够。改为字符串修改
      if (this.cache_text.endsWith('\n')) this.cache_text = this.cache_text.slice(0, -1)
      // console.log(`MiniEditor Ctrl+Enter send text: "${this.cache_text}"`);

      global_setting.api.sendText(this.cache_text)
      return
    }
  }

  // #endregion
}
