import { cache } from "react"

let cache_ctx = null
let cache_el = null

export default {
    metadata: {
        id: 'anymenu-example-debug',
        name: '示例-打印并显示一些调试信息',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        icon: 'lucide-bug'
    },

    onLoad() {},

    onUnload() {
        if (cache_ctx) cache_ctx.api.unregisterSubPanel('example-debug')
    },

    async run(ctx) {
        // 注册面板
        if (!cache_ctx) {
            cache_ctx = ctx
            cache_el = document.createElement('div'); cache_el.classList.add('example-debug-panel');
            ctx.api.registerSubPanel({
                id: 'example-debug',
                el: cache_el
            })
        }

        // 输出调试信息
        if (cache_el) {
            cache_el.innerText = '【Debug Message】\n\n' + JSON.stringify(ctx.env, null, 4) + '\n\nFor more information, please refer to the console.'
        }
        console.log('【Debug Message】ctx:', ctx)

        ctx.api.hidePanel(['menu'])
        ctx.api.showPanel(['example-debug'])
    }
}
