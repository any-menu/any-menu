let cache_el = null

export default {
    metadata: {
        id: 'anymenu-example-panel',
        name: '示例-自定义并控制面板',
        version: '1.0.2',
        min_app_version: '1.2.0',
        author: 'LincZero',
        icon: 'lucide-layout-dashboard'
    },

    onLoad() {},

    onUnload() {
        this.app.api.unregisterSubPanel('example-panel')
    },

    async run(ctx) {
        // 注册面板
        if (!cache_el) {
            cache_el = document.createElement('div'); cache_el.innerText = '这是一个新面板的内容'
            this.app.api.registerSubPanel({
                id: 'example-panel',
                el: cache_el
            })
        }

        this.app.api.hidePanel(['menu'])
        this.app.api.showPanel(['example-panel'])
    }
}
