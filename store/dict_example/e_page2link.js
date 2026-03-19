export default {
    metadata: {
        id: 'anymenu-example-page2link',
        name: '示例-获取该页面的 Markdown 链接',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'LincZero, Copilot Cluade Opus 4.6',
        description: '获取浏览器/文档环境下当前标签页标题和链接，生成 Markdown 链接',
        icon: 'lucide-link'
    },

    async run(ctx) {
        // 获取 url
        let url = ''
        if (ctx.env.platform === 'obsidian-plugin') {
            url = ctx.env.activeDocUrl
        } else {
            if (!ctx.env.selectedText) {
                console.warn('请选中页面 url 后再执行，当前环境无法自动获取 url')
                return
            } else if (ctx.env.selectedText.startsWith('http')) { // 判断 url 合法性
                url = ctx.env.selectedText
            }
        }

        // 获取简易窗口标题
        // 窗口标题通常格式为 "文档标题 - 应用名" 或 "文档标题 — 应用名"
        let title = ''
        if (ctx.env.activeDocTitle) {
            title = ctx.env.activeDocTitle
        } else {
            title = ctx.env.activeAppName.split(' - ')[0].split(' — ')[0] // 以 " - " 或 " — " 分割，取第一个部分作为标题
            // 优化
            title = cleanTitle(title)
        }

        // 构造 markdown 链接
        const markdownLink = `[${title}](${url})` // 可以根据需要修改成 obsidian wiki 链接的形式
        ctx.api.saveToClipboard(markdownLink)
        ctx.api.notify('成功复制: ' + markdownLink)
        ctx.api.hidePanel()
    }
}

/** 清理标题中的无用信息，可自行补充 */
function cleanTitle(title) {
    title = title.replace(/^[●■◆★☆◉○◇▶►▸🔴🟢🟡⚪⬤\u25CF\u25A0\u25C6]\s*/u, '')
    const siteSuffixes = [
        /_哔哩哔哩_bilibili$/,
    ]
    for (const suffix of siteSuffixes) {
        title = title.replace(suffix, '')
    }
    return title.trim()
}
