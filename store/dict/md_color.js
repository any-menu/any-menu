let cache_color = 'red';
let cache_ctx = null
let cache_el = null
let cache_el_am_icon = null

export default {
    metadata: {
        id: 'anymenu-md-color',
        name: 'md文字色',
        version: '1.0.1',
        min_app_version: '1.1.11',
        author: 'LincZero',
        icon: 'lucide-baseline'
        // 备用:
        // 文字编辑类别: https://lucide.dev/icons/categories#text
        // 
        // 基线: lucide-baseline
        // 下滑线: lucide-underline
        // 加粗: lucide-bold
        // 斜体: lucide-italic
        // 高亮: lucide-highlighter
        // 字体: lucide-type
        // 描边: lucide-type-outline
        // 游标: lucide-text-cursor
        // 调色盘: lucide-palette
        // 颜料刷1: lucide-paintbrush
        // 取色: lucide-pipette
        // 橡皮擦: lucide-eraser
    },

    onUnload() {
        if (cache_ctx) cache_ctx.api.unregisterSubPanel('md-color-panel')
    },

    async run(ctx) {
        if (!cache_ctx) cache_ctx = ctx

        const str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }

        // 如果选中的文本已经包含 span 了 (可能之前设置过文字色或背景色)，则直接修改属性而不是再套一层
        const spanMatch = str.match(/^<span\s+style="([^"]*)">([\s\S]*)<\/span>$/);
        if (spanMatch) {
            let style = spanMatch[1];
            let newStr = spanMatch[2];
            // 用负向后行断言，避免误匹配 background-color
            const colorRegex = /(?<![a-zA-Z-])color\s*:[^;]*(;?)/i;
            if (colorRegex.test(style)) {
                // 已有 color 属性，直接替换
                style = style.replace(colorRegex, `color:${cache_color};`);
            } else {
                // 没有 color 属性，追加
                style = `color:${cache_color};${style}`;
            }
            ctx.api.sendText(`<span style="${style}">${newStr}</span>`);
        } else {
            ctx.api.sendText(`<span style="color:${cache_color}">${str}</span>`);
        }
    },

    onCreateItem(el, ctx) {
        if (!cache_ctx) cache_ctx = ctx

        // 右键点击时可以选择颜色
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 2) return; // 仅响应右键点击
            if (!cache_el) {
                cache_el = buildPanel()
                ctx.api.registerSubPanel({ id: 'md-color-panel', el: cache_el })
            }

            // 切换到当前面板
            ctx.api.hidePanel(['menu'])
            ctx.api.showPanel(['md-color-panel'])

            e.preventDefault()
            e.stopPropagation()
        })

        // 这里的样式处理应该移到主逻辑而非插件中?
        // 有可能是工具栏项 (.am-toolbar-item) 或多级菜单项 (am-context-menu-item)
        const el_am_icon = el.querySelector(':scope.am-toolbar-item > .am-icon')
        console.log('md-bg onCreateItem', el, el_am_icon)
        if (el_am_icon) {
            cache_el_am_icon = el_am_icon;
            el_am_icon.classList.add('has-more'); el_am_icon.style.setProperty('--color', cache_color);
        }
    }
}

function buildPanel() {
    const root = document.createElement('div')
        root.className = 'md-color-panel'
    
    const input = document.createElement('input');
        root.appendChild(input);
        input.type = 'color';
        input.value = cache_color;
        input.click();
        input.onchange = () => {
            cache_color = input.value; cache_el_am_icon.style.setProperty('--color', cache_color);
            input.value = cache_color
        }

    return root
}
