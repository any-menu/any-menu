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
        const title = ctx.env.activeDocTitle || ''
        const url = ctx.env.activeDocUrl || ''

        if (!title && !url) {
            console.warn('无法获取当前文档信息', ctx.env)
            ctx.api.notify('无法获取当前文档信息')
            return
        }

        const markdownLink = `[${title}](${url})`
        console.log('get markdown link: ' + markdownLink)
    }
}
