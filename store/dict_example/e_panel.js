let cache_ctx = null

export default {
    metadata: {
        id: 'anymenu-example-panel',
        name: '示例-自定义并控制面板',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        icon: 'lucide-layout-dashboard'
    },

    onLoad() {},

    onUnload() {
        if (cache_ctx) cache_ctx.api.unregisterSubPanel('example-panel')
    },

    async run(ctx) {
        // 注册面板
        if (!cache_ctx) {
            cache_ctx = ctx
            const newPanel = document.createElement('div'); newPanel.innerText = '这是一个新面板的内容'
            ctx.api.registerSubPanel({
                id: 'example-panel',
                el: newPanel
            })
        }

        ctx.api.hidePanel(['menu'])
        ctx.api.showPanel(['example-panel'])
    }
}
