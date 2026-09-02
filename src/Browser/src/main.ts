/** 主面板相关 */

import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { schema as schema_md, defaultMarkdownParser,
        defaultMarkdownSerializer } from "prosemirror-markdown"
import { exampleSetup } from "prosemirror-example-setup"
// import { Schema, DOMParser } from "prosemirror-model"
// import { schema } from "prosemirror-schema-basic"
// import { addListNodes } from "prosemirror-schema-list"
import { selectionPlugin } from "./ProseMirror/plugin"

import { global_setting } from '@/Core/shared/setting'
import { AMPanel } from '@/Core/panels/MulPanel'
import { initSettingTab_1, initSettingTab_2 } from '@/Core/modules/settingPanel/SettingTab'
import { initMenuData } from '@/Core/initTool'
import { DocumentListeners } from '@/Core/modules/editor/event'
import { EditorTools } from '@/Core/modules/editor/cursor'
import { initApi, initApi_with_server } from './utils/initApi'
import { addShowPanelBtn } from "./modules/showEvent"

// #region 启动时阅读配置文件

let is_init = false
async function init_config() {
  if (is_init) return
  is_init = true
  const result = await global_setting.api.loadConfig()
  if (!result) { console.error('配置文件读取/初始化失败'); return }
}

// #endregion

// 前端模块
window.addEventListener("DOMContentLoaded", async () => {
  const main_el: HTMLDivElement | null = document.querySelector("#main")
  if (!main_el) return

  await initApi()
  await initApi_with_server()
  await init_config() // 保证先读取配置再初始化别的

  // 展开面板按钮
  {
    const btn = document.createElement('button'); main_el.appendChild(btn);
      btn.innerText = 'Test, show panel'
      btn.classList.add('am-browser-debug-btn')

      addShowPanelBtn(btn)
  }

  // 文本框集
  {
    const textsEl = document.createElement('div'); main_el.appendChild(textsEl);
      textsEl.classList.add('am-browser-debug-textels')

    // 文本框 - textarea
    {
      const textEl: HTMLTextAreaElement = document.createElement('textarea'); textsEl.appendChild(textEl);
        textEl.textContent = 'Textarea demo.\n'
        textEl.setAttribute('spellcheck', 'false')
        textEl.classList.add('am-browser-debug-textel', 'am-browser-debug-textarea')
    }

    // 文本框 - editable div
    {
      const textEl: HTMLDivElement = document.createElement('div'); textsEl.appendChild(textEl);
        textEl.textContent = 'Editable div demo.\n'
        textEl.setAttribute('spellcheck', 'false')
        textEl.classList.add('am-browser-debug-textel', 'am-browser-debug-editable')
        textEl.setAttribute('contenteditable', 'true')
    }

    // 文本框 - uneditable div
    {
      const textEl: HTMLDivElement = document.createElement('div'); textsEl.appendChild(textEl);
        textEl.textContent = 'Not editable div demo.\n'
        textEl.setAttribute('spellcheck', 'false')
        textEl.classList.add('am-browser-debug-textel', 'am-browser-debug-uneditable')
        textEl.setAttribute('contenteditable', 'false')
    }

    // 文本框 - ProseMirror div
    {
      const textEl: HTMLDivElement = document.createElement('div'); textsEl.appendChild(textEl);
        textEl.setAttribute('spellcheck', 'false')
        textEl.classList.add('am-browser-debug-textel', 'am-browser-debug-prosemirror')

      /* // 默认版 ProseMirror
      const contentEl: HTMLDivElement = document.createElement('div'); textsEl.appendChild(contentEl);
        contentEl.style.display = 'none'
        contentEl.innerHTML = `<h2>示例文档</h2>
  <p>ProseMirror div demo2。这是一个段落，包含<strong>粗体</strong>和<em>斜体</em>。</p>
  <ul>
    <li>列表项一</li>
    <li>列表项二</li>
  </ul>
  <p>继续输入内容体验编辑器。</p>
`;

      将prosemirror-schema-list中的节点混合到基本模式中
      创建一个支持列表的模式。
      const mySchema = new Schema({
        nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
        marks: schema.spec.marks
      })
      
      const view = new EditorView(textEl, {
        state: EditorState.create({
          doc: DOMParser.fromSchema(mySchema).parse(contentEl),
          plugins: exampleSetup({schema: mySchema})
        })
      })*/

      // Markdown 版 ProseMirror
      const mySchema = schema_md // 直接使用 markdown schema（已包含列表、标题、代码块等节点）
      const initialDoc = defaultMarkdownParser.parse(`## 示例文档

ProseMirror markdown demo。这是一个段落，包含**粗体**和*斜体*。

- 列表项一
- 列表项二

继续输入内容体验编辑器。`) // 使用 markdown 解析器解析初始内容
      new EditorView(textEl, { // const view = 
        state: EditorState.create({
          doc: initialDoc,
          plugins: [
            ...exampleSetup({ schema: mySchema }),
            selectionPlugin,
          ]
        })
      })
    }
  }

  // debug 信息面板
  {
    const info_el = document.createElement('div'); main_el.appendChild(info_el);
      info_el.classList.add('am-browser-debug-info')
    const info_el_fold = document.createElement('button'); info_el.appendChild(info_el_fold);
      info_el_fold.classList.add('fold'); info_el_fold.title = 'Fold'; info_el_fold.textContent = '>'
      let is_fold = false
      info_el_fold.onclick = () => {
        is_fold = !is_fold
        if (is_fold) {
          info_el_fold.textContent = '<'
          info_el_title.classList.add('am-hide')
          info_el_msg.classList.add('am-hide')
        } else {
          info_el_fold.textContent = '>'
          info_el_title.classList.remove('am-hide')
          info_el_msg.classList.remove('am-hide')
        }
      }
    const info_el_title = document.createElement('h3'); info_el.appendChild(info_el_title);
      info_el_title.textContent = 'Debug panel'
    const info_el_msg = document.createElement('div'); info_el.appendChild(info_el_msg);
    setInterval(() => {
      info_el_msg.textContent = `time: ${new Date().toLocaleString()}\n`
      info_el_msg.textContent += `selection: ${global_setting.state.selectedText}\n`
      const range = EditorTools.state.range
      if (!range) {
        info_el_msg.textContent += 'range: null\n'
      } else if (range instanceof Range) {
        // 注意: `range.startContainer` 和 `range.endContainer` 可能不同。
        //   所以可能存在 `endOffset > startOffset` 的情况
        info_el_msg.textContent += `range: {start:${range.startOffset},end:${range.endOffset}}\n`
      } else {
        info_el_msg.textContent += `range: ${JSON.stringify(range)}\n`
      }
      info_el_msg.textContent += `el: ${EditorTools.state.el?.tagName}\n.${EditorTools.state.el?.className}`
    }, 500)
  }

  // init - 自动更新选中文本 (防抖版，非节流版)
  const documentListeners = new DocumentListeners()
  documentListeners.setShow_whiteList('am-browser-debug-textel') // TODO 这里的是 browser 环境的临时规则，应该允许用户自定义这里的高级规则
  documentListeners.register() // 也不用去 unregister 了，持续到页面销毁

  // initMenu
  {
    // 搜索框和多级菜单 - 元素
    AMPanel.factory(main_el)
    // 搜索框和多极菜单 - 数据内容
    void initMenuData() // TODO 应该分开 initDB 和 initMenu，前者可以在dom加载之前完成
  }

  // 设置面板
  initSettingPanel(main_el)
})

function initSettingPanel(el: HTMLElement) {
  const div = document.createElement('div'); el.appendChild(div);

  const { tab_nav_container, tab_content_container } = initSettingTab_1(div)
  initSettingTab_2(tab_nav_container, tab_content_container)
}
