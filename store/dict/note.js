let cache_ctx = null
let cache_el = null
let cache_el_content = null

let alt_v_state = false  // 虚拟alt状态

function buildPanel() {
    const root = document.createElement('div')
        root.className = 'note-root'

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    // 工具栏
    const toolbar = document.createElement('div'); root.appendChild(toolbar);
        toolbar.className = 'note-toolbar'

    // 保存位置
    const folderPath = document.createElement('input'); toolbar.appendChild(folderPath);
        folderPath.type = 'text'
        folderPath.title = '保存位置'
        folderPath.placeholder = '默认: 配置的笔记路径'

    // 文件名
    const fileName = document.createElement('input'); toolbar.appendChild(fileName);
        fileName.type = 'text'
        fileName.title = '相对路径文件名'
        fileName.placeholder = '请输入文件名...'
        fileName.value = `${year}-${month}-${day}.md`

    // 标题
    const titleName = document.createElement('input'); toolbar.appendChild(titleName);
        titleName.type = 'text'
        titleName.title = '标题名'
        titleName.placeholder = '请输入标题，可为空，默认自动生成当前时间戳'
        titleName.value = `${hours}:${minutes}:${seconds}.${milliseconds}`
        

    // 原文区域
    const contentEl = document.createElement('textarea'); root.appendChild(contentEl); contentEl.id = '__translate_src'
        contentEl.className = 'note-content'
        contentEl.placeholder = '请输入...'
        cache_el_content = contentEl

    // 操作按钮
    const btnBar = document.createElement('div'); root.appendChild(btnBar);
        btnBar.className = 'note-btnbar'

    const btnSave = document.createElement('button'); btnBar.appendChild(btnSave); btnSave.textContent = '保存'
        btnSave.className = 'btn'
        btnSave.dataset.altKey = '1'
        btnSave.onclick = async () => {
            const ret = await cache_ctx.api.writeFile('PUBLIC', folderPath.value + fileName.value, `## ${titleName.value}\n\n${contentEl.value}\n\n`, true)
            if (ret) {
                cache_ctx.api.notify('保存成功')
            } else {
                console.error('保存失败', ret)
                cache_ctx.api.notify('保存失败')
            }
        }

    const cleanBtn = document.createElement('button'); btnBar.appendChild(cleanBtn); cleanBtn.textContent = '清空'
        cleanBtn.className = 'btn'
        cleanBtn.dataset.altKey = '2'
        cleanBtn.onclick = () => {
            contentEl.value = ''
        }

    const btnCopy = document.createElement('button'); btnBar.appendChild(btnCopy); btnCopy.textContent = '复制'
        btnCopy.className = 'btn'
        btnCopy.dataset.altKey = '3'
        btnCopy.onclick = () => {
            if (cache_ctx && contentEl.value) cache_ctx.api.saveToClipboard(contentEl.value)
        }

    const btnInsert = document.createElement('button'); btnBar.appendChild(btnInsert); btnInsert.textContent = '插入'
        btnInsert.className = 'btn'
        btnInsert.dataset.altKey = '4'
        btnInsert.onclick = () => {
            if (cache_ctx && contentEl.value) cache_ctx.api.sendText(contentEl.value)
        }

    const btnCodeblock = document.createElement('button'); btnBar.appendChild(btnCodeblock); btnCodeblock.textContent = '嵌入代码块'
        btnCodeblock.className = 'btn'
        btnCodeblock.dataset.altKey = '5'
        btnCodeblock.onclick = () => {
            let number_flag = // 包含在内的最大连续反引号数量 + 1 (最少为3)，确保不会和内容中的反引号冲突
                contentEl.value.match(/`+/g)?.reduce((max, cur) => Math.max(max, cur.length), 0) ?? 0
            number_flag = Math.max(number_flag + 1, 3)
            const codeblock_flag = '`'.repeat(number_flag)
            contentEl.value = `${codeblock_flag}\n${contentEl.value}\n${codeblock_flag}\n`
        }

    const btnHistory = document.createElement('button'); btnBar.appendChild(btnHistory); btnHistory.textContent = '历史记录'
        btnHistory.className = 'btn'
        btnHistory.dataset.altKey = '6'
        btnHistory.onclick = () => {
            cache_ctx.api.notify('功能开发中...')
        }

    const init_alt_mode = () => { // 复用 panel 提供的 alt 键管理
        contentEl.addEventListener('keydown', (ev) => {
            if (!contentEl.matches('.show-altkey *')) return
            if (ev.key === '1') { btnSave.click(); ev.preventDefault() }
            else if (ev.key === '2') { cleanBtn.click(); ev.preventDefault() }
            else if (ev.key === '3') { btnCopy.click(); ev.preventDefault() }
            else if (ev.key === '4') { btnInsert.click(); ev.preventDefault() }
            else if (ev.key === '5') { btnCodeblock.click(); ev.preventDefault() }
            else if (ev.key === '6') { btnHistory.click(); ev.preventDefault() }
        })
    }
    init_alt_mode()

    return root
}

export default {
    metadata: {
        id: 'anymenu-note',
        name: '笔记',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'LincZero',
        description: '快速保存笔记、查看笔记',
        icon: 'lucide-notebook-pen',
        css: `
.note-root {
  padding:8px; display:flex; flex-direction:column; gap:6px; min-width:280px; font-size:13px;
  background: var(--ab-menu-bg-color); border:1px solid var(--ab-tab-root-bd-color); border-radius:8px;
  .note-toolbar {
    display:flex; gap:6px; align-items:center; flex-wrap:wrap;
    > * { flex:1; min-width:0; padding:4px 8px; background:var(--ab-menu-bg-color); border:1px solid var(--ab-tab-root-bd-color); color:CurrentColor; border-radius:4px; }
  }
  .note-content {
    background:var(--am-background-color); color:currentColor; outline:none; padding:6px; border-radius:4px; white-space:pre-wrap; overflow-y:auto; resize:vertical; width:100%; box-sizing:border-box; border:1px solid var(--ab-tab-root-bd-color); font-size:inherit;
    font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Courier New', monospace; /* 跨平台强制mono字体 */
    height:190px;
  }
  .note-btnbar {
    display:flex; gap:6px;
    button { background:var(--ab-menu-bg-color); border:1px solid var(--ab-tab-root-bd-color); color:currentColor; border-radius:6px; cursor:pointer; padding: 4px 10px; }
  }
}
.show-altkey .note-root .note-btnbar button.btn::after {
    content:attr(data-alt-key); position:absolute; color:var(--ab-bright-color);
}
`
    },

    onLoad() {},

    onUnload() {
        if (cache_ctx) cache_ctx.api.unregisterSubPanel('note-panel')
    },

    async run(ctx) {
        // 首次运行时注册面板
        if (!cache_ctx) {
            cache_ctx = ctx
            cache_el = buildPanel()
            ctx.api.registerSubPanel({ id: 'note-panel', el: cache_el })
        } else cache_ctx = ctx

        // 有选中文本时 // TODO 判断一下上次有没有未保存的内容，若有，提供恢复方案
        if (cache_el_content) {
            if (ctx.env.selectedText) { // 没选中就不覆盖了
                cache_el_content.value = ctx.env.selectedText
            }
        }

        alt_v_state = false

        // 切换到当前面板
        ctx.api.hidePanel(['menu'])
        ctx.api.showPanel(['note-panel'])
        cache_el_content?.focus()
    }
}
