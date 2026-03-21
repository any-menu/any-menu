let cache_ctx = null
let cache_el = null
let cache_el_content = null

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
    const titleInput = document.createElement('input'); toolbar.appendChild(titleInput);
        titleInput.type = 'text'
        titleInput.title = '标题名'
        titleInput.placeholder = '请输入标题，可为空，默认自动生成当前时间戳'
        titleInput.value = `${hours}:${minutes}:${seconds}.${milliseconds}`
        

    // 原文区域
    const srcBox = document.createElement('textarea'); root.appendChild(srcBox); srcBox.id = '__translate_src'
        srcBox.className = 'note-content'
        srcBox.placeholder = '请输入...'
        cache_el_content = srcBox

    // 操作按钮
    const btnBar = document.createElement('div'); root.appendChild(btnBar);
        btnBar.className = 'note-btnbar'

    const btnSave = document.createElement('button'); btnBar.appendChild(btnSave); btnSave.textContent = '保存'
        btnSave.className = 'btn'
        btnSave.onclick = async () => {
            const ret = await cache_ctx.api.writeFile('PUBLIC', folderPath.value + fileName.value, `## ${titleInput.value}\n\n${srcBox.value}\n\n`)
            if (ret) {
                cache_ctx.api.notify('保存成功')
            } else {
                console.error('保存失败', ret)
                cache_ctx.api.notify('保存失败')
            }
        }

    const cleanBtn = document.createElement('button'); btnBar.appendChild(cleanBtn); cleanBtn.textContent = '清空'
        cleanBtn.className = 'btn'
        cleanBtn.onclick = () => {
            srcBox.value = ''
        }

    const btnCopy = document.createElement('button'); btnBar.appendChild(btnCopy); btnCopy.textContent = '复制'
        btnCopy.className = 'btn'
        btnCopy.onclick = () => {
            if (cache_ctx && srcBox.value) cache_ctx.api.saveToClipboard(srcBox.value)
        }

    const btnInsert = document.createElement('button'); btnBar.appendChild(btnInsert); btnInsert.textContent = '插入'
        btnInsert.className = 'btn'
        btnInsert.onclick = () => {
            if (cache_ctx && srcBox.value) cache_ctx.api.sendText(srcBox.value)
        }

    const btnHistory = document.createElement('button'); btnBar.appendChild(btnHistory); btnHistory.textContent = '历史记录'
        btnHistory.className = 'btn'
        btnHistory.onclick = () => {
            cache_ctx.api.notify('功能开发中...')
        }

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
    .note-arrow { flex-shrink:0; }
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

        // 切换到当前面板
        ctx.api.hidePanel(['menu'])
        ctx.api.showPanel(['note-panel'])
        cache_el_content?.focus()
    }
}
