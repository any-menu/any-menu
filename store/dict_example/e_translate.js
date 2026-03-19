let cache_ctx = null
let panelEl = null
let cssInjected = false

/**
 * 翻译源配置
 *
 * 可用翻译源:
 *   免费 (无需 API Key):
 *     - google:   Google Translate (gtx 免费端点)
 *     - mymemory: MyMemory 翻译 API (每日有一定免费额度)
 *
 *   需要 API Key:
 *     - deepl:          DeepL API Free/Pro, 需在 DEEPL_API_KEY 中填入 key
 *     - libre:          LibreTranslate, 需自建实例或使用公共实例并填入 key
 *     - yandex:         Yandex Translate API, 需在 YANDEX_API_KEY 中填入 key
 *     - azure:          Microsoft Azure Translator, 需在 AZURE_API_KEY 中填入 key 和 AZURE_REGION 中填入区域
 *     - baidu:          百度翻译 API, 需在 BAIDU_APP_ID 和 BAIDU_SECRET_KEY 中填入信息
 *
 * 注意: 需要 API Key 的翻译源，目前需要用户直接在本文件中硬编码 API Key。
 *       这是临时方案，后续会提供安全的脚本 API 来读写存储敏感信息，届时会更新此处实现。
 */

// === 用户可配置的 API Key (需要时请直接修改此处) ===
const DEEPL_API_KEY = ''      // DeepL API Key, 例如 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx'
const LIBRE_URL = 'https://libretranslate.com'  // LibreTranslate 实例地址
const LIBRE_API_KEY = ''      // LibreTranslate API Key (部分实例需要)
const YANDEX_API_KEY = ''     // Yandex Translate API Key
const AZURE_API_KEY = ''      // Azure Translator API Key
const AZURE_REGION = ''       // Azure 区域, 例如 'eastasia'
const BAIDU_APP_ID = ''       // 百度翻译 APP ID
const BAIDU_SECRET_KEY = ''   // 百度翻译密钥

// 百度翻译语言代码映射 (与通用代码不同)
const BAIDU_LANG_MAP = { 'zh': 'zh', 'en': 'en', 'ja': 'jp', 'ko': 'kor', 'fr': 'fra', 'de': 'de', 'es': 'spa', 'ru': 'ru' }

const ENGINES = {
    google: {
        name: 'Google (免费)',
        needKey: false,
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
        name: 'MyMemory (免费)',
        needKey: false,
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
    deepl: {
        name: 'DeepL (需 Key)',
        needKey: true,
        translate: async (ctx, text, from, to) => {
            if (!DEEPL_API_KEY) return '[请先配置 DEEPL_API_KEY]'
            const host = DEEPL_API_KEY.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com'
            const params = new URLSearchParams({ text, target_lang: to.toUpperCase() })
            if (from !== 'auto') params.append('source_lang', from.toUpperCase())
            const ret = await ctx.api.urlRequest({
                url: `https://${host}/v2/translate`,
                method: 'POST',
                headers: { 'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json.translations?.[0]?.text ?? null
        }
    },
    libre: {
        name: 'LibreTranslate (需 Key)',
        needKey: true,
        translate: async (ctx, text, from, to) => {
            const body = { q: text, source: from === 'auto' ? 'auto' : from, target: to }
            if (LIBRE_API_KEY) body.api_key = LIBRE_API_KEY
            const ret = await ctx.api.urlRequest({
                url: `${LIBRE_URL}/translate`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json.translatedText ?? null
        }
    },
    yandex: {
        name: 'Yandex (需 Key)',
        needKey: true,
        translate: async (ctx, text, from, to) => {
            if (!YANDEX_API_KEY) return '[请先配置 YANDEX_API_KEY]'
            const body = { texts: [text], targetLanguageCode: to }
            if (from !== 'auto') body.sourceLanguageCode = from
            const ret = await ctx.api.urlRequest({
                url: 'https://translate.api.cloud.yandex.net/translate/v2/translate',
                method: 'POST',
                headers: { 'Authorization': `Api-Key ${YANDEX_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json.translations?.[0]?.text ?? null
        }
    },
    azure: {
        name: 'Azure (需 Key)',
        needKey: true,
        translate: async (ctx, text, from, to) => {
            if (!AZURE_API_KEY || !AZURE_REGION) return '[请先配置 AZURE_API_KEY 和 AZURE_REGION]'
            let url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${to}`
            if (from !== 'auto') url += `&from=${from}`
            const ret = await ctx.api.urlRequest({
                url,
                method: 'POST',
                headers: { 'Ocp-Apim-Subscription-Key': AZURE_API_KEY, 'Ocp-Apim-Subscription-Region': AZURE_REGION, 'Content-Type': 'application/json' },
                body: JSON.stringify([{ Text: text }]),
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json[0]?.translations?.[0]?.text ?? null
        }
    },
    baidu: {
        name: '百度翻译 (需 Key)',
        needKey: true,
        translate: async (ctx, text, from, to) => {
            if (!BAIDU_APP_ID || !BAIDU_SECRET_KEY) return '[请先配置 BAIDU_APP_ID 和 BAIDU_SECRET_KEY]'
            const bFrom = from === 'auto' ? 'auto' : (BAIDU_LANG_MAP[from] || from)
            const bTo = BAIDU_LANG_MAP[to] || to
            const salt = Date.now().toString()
            // 百度翻译签名: MD5(appid+q+salt+密钥)
            const signStr = BAIDU_APP_ID + text + salt + BAIDU_SECRET_KEY
            const sign = await md5(signStr)
            const params = new URLSearchParams({ q: text, from: bFrom, to: bTo, appid: BAIDU_APP_ID, salt, sign })
            const ret = await ctx.api.urlRequest({
                url: `https://fanyi-api.baidu.com/api/trans/vip/translate?${params.toString()}`,
                method: 'GET',
                isParseJson: true,
            })
            if (ret?.code !== 0 || !ret.data?.json) return null
            return ret.data.json.trans_result?.map(r => r.dst).join('\n') ?? null
        }
    },
}

// MD5 辅助函数 (仅用于百度翻译 API 签名，非安全用途)
async function md5(str) {
    const msgUint8 = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8).catch(() => null)
    if (!hashBuffer) throw new Error('当前环境不支持 MD5 (crypto.subtle 不可用)，无法使用百度翻译')
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
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

// 临时强制注入，后期会修改插件 api 来专门应用插件的 css。到时候会重新修改此处代码
// 当前直接写入 document
// 缺点: 脚本实现冗余麻烦: 要手动注入、关闭/卸载插件时去除、避免重复输入、封装较少、直接调用 document 不妥等
const TRANSLATE_CSS = `
.translate-root { padding:8px; display:flex; flex-direction:column; gap:6px; min-width:280px; font-size:13px; }
.translate-toolbar { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.translate-toolbar select { flex:1; min-width:0; padding:2px 4px; }
.translate-toolbar .translate-arrow { flex-shrink:0; }
.translate-label { font-weight:bold; }
.translate-label-src { margin-top:4px; }
.translate-src { background:var(--background-secondary, #f5f5f5); color:black; padding:6px; border-radius:4px; white-space:pre-wrap; min-height:40px; max-height:120px; overflow-y:auto; resize:vertical; width:100%; box-sizing:border-box; border:1px solid var(--background-modifier-border, #ddd); font-family:inherit; font-size:inherit; }
.translate-dst { background:var(--background-secondary, #f5f5f5); color:black; padding:6px; border-radius:4px; white-space:pre-wrap; max-height:120px; overflow-y:auto; user-select:text; }
.translate-btnbar { display:flex; gap:6px; }
`
function injectCSS() {
    if (cssInjected) return
    const style = document.createElement('style')
    style.textContent = TRANSLATE_CSS
    document.head.appendChild(style)
    cssInjected = true
}

function buildPanel() {
    injectCSS()

    const root = document.createElement('div')
    root.className = 'translate-root'

    // 工具栏：翻译源 + 语言选择
    const toolbar = document.createElement('div')
    toolbar.className = 'translate-toolbar'

    // 翻译源选择
    const engineSel = document.createElement('select')
    for (const [key, eng] of Object.entries(ENGINES)) {
        const opt = document.createElement('option'); opt.value = key; opt.textContent = eng.name
        if (key === currentEngine) opt.selected = true
        engineSel.appendChild(opt)
    }
    engineSel.onchange = () => { currentEngine = engineSel.value }
    toolbar.appendChild(engineSel)

    // 源语言
    const fromSel = document.createElement('select')
    for (const lang of LANGUAGES) {
        const opt = document.createElement('option'); opt.value = lang.code; opt.textContent = lang.label
        if (lang.code === currentFrom) opt.selected = true
        fromSel.appendChild(opt)
    }
    fromSel.onchange = () => { currentFrom = fromSel.value }
    toolbar.appendChild(fromSel)

    const arrow = document.createElement('span'); arrow.textContent = '→'; arrow.className = 'translate-arrow'
    toolbar.appendChild(arrow)

    // 目标语言
    const toSel = document.createElement('select')
    for (const lang of LANGUAGES) {
        if (lang.code === 'auto') continue
        const opt = document.createElement('option'); opt.value = lang.code; opt.textContent = lang.label
        if (lang.code === currentTo) opt.selected = true
        toSel.appendChild(opt)
    }
    toSel.onchange = () => { currentTo = toSel.value }
    toolbar.appendChild(toSel)

    root.appendChild(toolbar)

    // 原文区域 (textarea，允许用户编辑)
    const srcLabel = document.createElement('div'); srcLabel.textContent = '原文:'
    srcLabel.className = 'translate-label translate-label-src'
    root.appendChild(srcLabel)
    const srcBox = document.createElement('textarea'); srcBox.id = '__translate_src'
    srcBox.className = 'translate-src'
    srcBox.placeholder = '请输入要翻译的文本...'
    root.appendChild(srcBox)

    // 译文区域
    const dstLabel = document.createElement('div'); dstLabel.textContent = '译文:'
    dstLabel.className = 'translate-label'
    root.appendChild(dstLabel)
    const dstBox = document.createElement('div'); dstBox.id = '__translate_dst'
    dstBox.className = 'translate-dst'
    root.appendChild(dstBox)

    // 操作按钮
    const btnBar = document.createElement('div')
    btnBar.className = 'translate-btnbar'

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
    const text = srcBox.value
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
        srcBox.value = selectedText
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
