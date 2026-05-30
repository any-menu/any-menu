let cache_color = '#ff4d4f';
let cache_ctx = null
let cache_el = null

export default {
    metadata: {
        id: 'anymenu-md-background',
        name: 'md背景色',
        version: '1.0.0',
        min_app_version: '1.1.11',
        author: 'LincZero',
        icon: 'lucide-highlighter'
    },

    onUnload() {
        if (cache_ctx) cache_ctx.api.unregisterSubPanel('md-background-panel')
    },

    async run(ctx) {
        if (!cache_ctx) cache_ctx = ctx

        const str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        ctx.api.sendText(`<span style="background:${cache_color}">${str}</span>`);
    },

    onCreateItem(el, ctx) {
        if (!cache_ctx) cache_ctx = ctx

        // 右键点击时可以选择颜色
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 2) return; // 仅响应右键点击
            if (!cache_el) {
                cache_el = buildPanel()
                ctx.api.registerSubPanel({ id: 'md-background-panel', el: cache_el })
            }

            // 切换到当前面板
            ctx.api.hidePanel(['menu'])
            ctx.api.showPanel(['md-background-panel'])

            e.preventDefault()
            e.stopPropagation()
        })
    }
}

function buildPanel() {
    const root = document.createElement('div')
        root.className = 'md-background-panel'
    
    const input = document.createElement('input');
        root.appendChild(input);
        input.type = 'color';
        input.value = cache_color;
        input.click();
        input.onchange = () => {
            cache_color = input.value
            input.value = cache_color
        }

    return root
}
