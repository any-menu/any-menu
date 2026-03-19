let cache_ctx = null
let panelEl = null

// 翻译源配置
const ENGINES = {
    google: {
        name: 'Google',
        translate: async (ctx, text, from, to) => {
            const ret = await ctx.api.urlRequest({
                url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
                method: 'GET',
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json[0].map(s => s[0]).join('')
        }
    },
    mymemory: {
        name: 'MyMemory',
        translate: async (ctx, text, from, to) => {
            const langpair = `${from === 'auto' ? 'autodetect' : from}|${to}`
            const ret = await ctx.api.urlRequest({
                url: `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`,
                method: 'GET',
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json.responseData?.translatedText ?? null
        }
    },
}

// 常用语言列表
const LANGUAGES = [
    { code: 'auto', label: '自动检测' },
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'ru', label: 'Русский' },
]

let currentEngine = 'google'
let currentFrom = 'auto'
let currentTo = 'zh'

function buildPanel() {
    const root = document.createElement('div')
    root.style.cssText = 'padding:8px;display:flex;flex-direction:column;gap:6px;min-width:280px;font-size:13px;'

    // 工具栏：翻译源 + 语言选择
    const toolbar = document.createElement('div')
    toolbar.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;'

    // 翻译源选择
    const engineSel = document.createElement('select')
    engineSel.style.cssText = 'flex:1;min-width:0;padding:2px 4px;'
    for (const [key, eng] of Object.entries(ENGINES)) {
        const opt = document.createElement('option'); opt.value = key; opt.textContent = eng.name
        if (key === currentEngine) opt.selected = true
        engineSel.appendChild(opt)
    }
    engineSel.onchange = () => { currentEngine = engineSel.value }
    toolbar.appendChild(engineSel)

    // 源语言
    const fromSel = document.createElement('select')
    fromSel.style.cssText = 'flex:1;min-width:0;padding:2px 4px;'
    for (const lang of LANGUAGES) {
        const opt = document.createElement('option'); opt.value = lang.code; opt.textContent = lang.label
        if (lang.code === currentFrom) opt.selected = true
        fromSel.appendChild(opt)
    }
    fromSel.onchange = () => { currentFrom = fromSel.value }
    toolbar.appendChild(fromSel)

    const arrow = document.createElement('span'); arrow.textContent = '→'; arrow.style.cssText = 'flex-shrink:0;'
    toolbar.appendChild(arrow)

    // 目标语言
    const toSel = document.createElement('select')
    toSel.style.cssText = 'flex:1;min-width:0;padding:2px 4px;'
    for (const lang of LANGUAGES) {
        if (lang.code === 'auto') continue
        const opt = document.createElement('option'); opt.value = lang.code; opt.textContent = lang.label
        if (lang.code === currentTo) opt.selected = true
        toSel.appendChild(opt)
    }
    toSel.onchange = () => { currentTo = toSel.value }
    toolbar.appendChild(toSel)

    root.appendChild(toolbar)

    // 原文区域
    const srcLabel = document.createElement('div'); srcLabel.textContent = '原文:'
    srcLabel.style.cssText = 'font-weight:bold;margin-top:4px;'
    root.appendChild(srcLabel)
    const srcBox = document.createElement('div'); srcBox.id = '__translate_src'
    srcBox.style.cssText = 'background:var(--background-secondary, #f5f5f5);padding:6px;border-radius:4px;white-space:pre-wrap;max-height:120px;overflow-y:auto;user-select:text;'
    root.appendChild(srcBox)

    // 译文区域
    const dstLabel = document.createElement('div'); dstLabel.textContent = '译文:'
    dstLabel.style.cssText = 'font-weight:bold;'
    root.appendChild(dstLabel)
    const dstBox = document.createElement('div'); dstBox.id = '__translate_dst'
    dstBox.style.cssText = 'background:var(--background-secondary, #f5f5f5);padding:6px;border-radius:4px;white-space:pre-wrap;max-height:120px;overflow-y:auto;user-select:text;'
    root.appendChild(dstBox)

    // 操作按钮
    const btnBar = document.createElement('div')
    btnBar.style.cssText = 'display:flex;gap:6px;'

    const btnTranslate = document.createElement('button'); btnTranslate.textContent = '翻译'
    btnTranslate.className = 'btn'
    btnTranslate.onclick = () => doTranslate(srcBox, dstBox)
    btnBar.appendChild(btnTranslate)

    const btnCopy = document.createElement('button'); btnCopy.textContent = '复制译文'
    btnCopy.className = 'btn'
    btnCopy.onclick = () => {
        if (cache_ctx && dstBox.textContent) cache_ctx.api.saveToClipboard(dstBox.textContent)
    }
    btnBar.appendChild(btnCopy)

    const btnInsert = document.createElement('button'); btnInsert.textContent = '插入译文'
    btnInsert.className = 'btn'
    btnInsert.onclick = () => {
        if (cache_ctx && dstBox.textContent) cache_ctx.api.sendText(dstBox.textContent)
    }
    btnBar.appendChild(btnInsert)

    root.appendChild(btnBar)
    return root
}

async function doTranslate(srcBox, dstBox) {
    const text = srcBox.textContent
    if (!text) { dstBox.textContent = '(无原文)'; return }
    dstBox.textContent = '翻译中...'
    try {
        const engine = ENGINES[currentEngine]
        const result = await engine.translate(cache_ctx, text, currentFrom, currentTo)
        dstBox.textContent = result ?? '翻译失败'
    } catch (e) {
        console.error('Translate error:', e)
        dstBox.textContent = '翻译出错: ' + (e.message || e)
    }
}

export default {
    metadata: {
        id: 'anymenu-translate',
        name: '翻译',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'LincZero',
        description: '选中文本后翻译，支持多种免费翻译源',
        icon: 'lucide-languages'
    },

    onLoad() {},

    onUnload() {
        if (cache_ctx) cache_ctx.api.unregisterSubPanel('translate-panel')
    },

    async run(ctx) {
        // 首次运行时注册面板
        if (!cache_ctx) {
            cache_ctx = ctx
            panelEl = buildPanel()
            ctx.api.registerSubPanel({ id: 'translate-panel', el: panelEl })
        }

        // 填充原文
        const srcBox = panelEl.querySelector('#__translate_src')
        const dstBox = panelEl.querySelector('#__translate_dst')
        const selectedText = ctx.env.selectedText || ''
        srcBox.textContent = selectedText
        dstBox.textContent = ''

        // 切换到翻译面板
        ctx.api.hidePanel(['menu'])
        ctx.api.showPanel(['translate-panel'])

        // 有选中文本时自动翻译
        if (selectedText) {
            await doTranslate(srcBox, dstBox)
        }
    }
}
