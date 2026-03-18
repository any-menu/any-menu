export default {
    metadata: {
        id: 'anymenu-example-markdown-link',
        name: '示例-Markdown链接',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'LincZero',
        description: '获取当前文档标题和链接，生成 Markdown 链接',
        icon: 'lucide-link'
    },

    async run(ctx) {
        const title = ctx.env.activeDocTitle || ''
        const url = ctx.env.activeDocUrl || ''

        if (!title && !url) {
            ctx.api.notify('无法获取当前文档信息')
            return
        }

        const markdownLink = `[${title}](${url})`
        ctx.api.sendText(markdownLink)
    }
}
