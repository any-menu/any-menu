let cache_el = null

export default {
    metadata: {
        id: 'anymenu-example-debug',
        name: '示例-打印并显示一些调试信息',
        version: '1.0.2',
        min_app_version: '1.2.0',
        author: 'LincZero',
        icon: 'lucide-bug'
    },

    onLoad() {},

    onUnload() {
        this.app.api.unregisterSubPanel('example-debug')
    },

    async run(ctx) {
        // 注册面板
        if (!cache_el) {
            cache_el = document.createElement('div'); cache_el.classList.add('example-debug-panel');
            this.app.api.registerSubPanel({
                id: 'example-debug',
                el: cache_el
            })
        }

        // 输出调试信息
        if (cache_el) {
            cache_el.innerText = '【Debug Message】\n\n' + JSON.stringify(ctx.env, null, 4) + '\n\nFor more information, please refer to the console.'
        }
        console.log('【Debug Message】ctx:', ctx)

        this.app.api.hidePanel(['menu'])
        this.app.api.showPanel(['example-debug'])
    }
}
